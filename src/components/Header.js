// src/components/Header.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Header.css";
import { logout } from "../utils/logout";

/* ===================== 공통 디버깅 유틸 ===================== */
function showJwt() {
  const at = localStorage.getItem("accessToken");
  if (!at) {
    console.log("[JWT] no accessToken in localStorage");
    return;
  }
  const [, p] = at.split(".");
  const b64 = (p || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  try {
    const payload = JSON.parse(atob(b64 + pad));
    const now = Math.floor(Date.now() / 1000);
    console.log("[JWT] payload:", payload);
    console.log(
      "[JWT] exp:",
      payload.exp,
      "now:",
      now,
      "secondsLeft:",
      payload.exp - now
    );
  } catch (e) {
    console.warn("[JWT] failed to decode payload", e);
  }
}

function parseJwtPayload() {
  const at = localStorage.getItem("accessToken");
  if (!at) return null;
  const [, p] = at.split(".");
  const b64 = (p || "").replace(/-/g, "+").replace(/_/g, "/");
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  try {
    return JSON.parse(atob(b64 + pad));
  } catch {
    return null;
  }
}

function authHeaders() {
  const at = localStorage.getItem("accessToken");
  return at ? { Authorization: `Bearer ${at}` } : {};
}

function buildCurlForPending() {
  const at = localStorage.getItem("accessToken");
  const curl =
    `curl -i -X GET 'http://3.34.229.56:8080/api/lab-creation-requests/admin/pending' \\\n` +
    `  -H 'accept: application/json'` +
    (at ? ` \\\n  -H 'Authorization: Bearer ${at}'` : "");
  console.log("[cURL pending]\n" + curl);
  return curl;
}

async function rawFetchPending() {
  const at = localStorage.getItem("accessToken");
  const res = await fetch(
    "http://3.34.229.56:8080/api/lab-creation-requests/admin/pending",
    {
      method: "GET",
      headers: {
        accept: "application/json",
        ...(at ? { Authorization: `Bearer ${at}` } : {}),
      },
    }
  );
  const text = await res.text();
  console.log("[rawFetch pending] status:", res.status);
  console.log("[rawFetch pending] body:", text);
  return { status: res.status, body: text };
}

function buildCurlForApprove(id) {
  const at = localStorage.getItem("accessToken");
  const curl =
    `curl -i -X PUT 'http://3.34.229.56:8080/api/lab-creation-requests/${id}/approve' \\\n` +
    `  -H 'accept: application/json'` +
    (at ? ` \\\n  -H 'Authorization: Bearer ${at}'` : "");
  console.log("[cURL approve]\n" + curl);
  return curl;
}

async function rawFetchApprove(id) {
  const at = localStorage.getItem("accessToken");
  const res = await fetch(
    `http://3.34.229.56:8080/api/lab-creation-requests/${id}/approve`,
    {
      method: "PUT",
      headers: {
        accept: "application/json",
        ...(at ? { Authorization: `Bearer ${at}` } : {}),
      },
    }
  );
  const text = await res.text();
  console.log("[rawFetch approve] status:", res.status);
  console.log("[rawFetch approve] body:", text);
  return { status: res.status, body: text };
}
/* ============================================================ */

/* ===================== 거절(Reject) 초강력 디버깅 ===================== */
const DEBUG_REJECT = true;

function genTraceId() {
  return `rej-${Date.now().toString(36)}-${Math.random()
    .toString(16)
    .slice(2, 8)}`;
}
function shortToken(t, n = 12) {
  return t ? `${t.slice(0, n)}…` : "∅";
}
function jsonHeaders() {
  return {
    ...authHeaders(),
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}
function buildCurlForRejectVerbose(
  id,
  reason = "관리자에 의해 거절되었습니다."
) {
  const at = localStorage.getItem("accessToken");
  const curl =
    `curl -i -X PUT 'http://3.34.229.56:8080/api/lab-creation-requests/${id}/reject' \\\n` +
    `  -H 'accept: application/json' \\\n` +
    `  -H 'content-type: application/json'` +
    (at ? ` \\\n  -H 'Authorization: Bearer ${at}'` : "") +
    ` \\\n  -d '${JSON.stringify({ reason })}'`;
  console.log("[cURL reject verbose]\n" + curl);
  return curl;
}
async function rawFetchRejectJson(
  id,
  reason = "관리자에 의해 거절되었습니다."
) {
  const at = localStorage.getItem("accessToken");
  const res = await fetch(
    `http://3.34.229.56:8080/api/lab-creation-requests/${id}/reject`,
    {
      method: "PUT",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...(at ? { Authorization: `Bearer ${at}` } : {}),
      },
      body: JSON.stringify({ reason }),
    }
  );
  const text = await res.text();
  console.log("[rawFetchRejectJson] status:", res.status);
  console.log("[rawFetchRejectJson] body:", text);
  return { status: res.status, body: text };
}
async function rawFetchRejectNoBody(id) {
  const at = localStorage.getItem("accessToken");
  const res = await fetch(
    `http://3.34.229.56:8080/api/lab-creation-requests/${id}/reject`,
    {
      method: "PUT",
      headers: {
        accept: "application/json",
        ...(at ? { Authorization: `Bearer ${at}` } : {}),
      },
    }
  );
  const text = await res.text();
  console.log("[rawFetchRejectNoBody] status:", res.status);
  console.log("[rawFetchRejectNoBody] body:", text);
  return { status: res.status, body: text };
}
async function verifyPendingContainsId(id) {
  try {
    const res = await api.get("/api/lab-creation-requests/admin/pending", {
      headers: authHeaders(),
    });
    const arr = Array.isArray(res?.data?.data) ? res.data.data : [];
    const found = arr.find((x) => x?.id === id);
    console.log("[verifyPendingContainsId] found:", !!found, "item:", found);
    return found || null;
  } catch (e) {
    console.warn(
      "[verifyPendingContainsId] failed:",
      e?.response?.status,
      e?.message
    );
    return null;
  }
}
function logAxiosError(err, traceId) {
  const st = err?.response?.status;
  const data = err?.response?.data;
  const hdrs = err?.response?.headers;
  const cfg = err?.config;
  console.groupCollapsed(
    `%c[reject][${traceId}] axios error ${st ?? ""}`,
    "color:#f33;font-weight:bold"
  );
  console.log("status:", st);
  console.log("response.headers:", hdrs);
  console.log("response.data:", data);
  console.log("request.config.method:", cfg?.method);
  console.log("request.config.url:", cfg?.url);
  console.log("request.config.headers:", cfg?.headers);
  if (cfg?.data) {
    try {
      console.log("request.config.data:", JSON.parse(cfg.data));
    } catch {
      console.log("request.config.data(raw):", cfg.data);
    }
  }
  console.log("err.message:", err?.message);
  console.log("err.name:", err?.name);
  if (typeof err?.toJSON === "function") {
    console.log("err.toJSON():", err.toJSON());
  }
  console.groupEnd();
}
/* ============================================================ */

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isAuthPage = ["/", "/login", "/signup"].includes(location.pathname);

  const [showModal, setShowModal] = useState(false);
  const [pendingLabs, setPendingLabs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // 목록 열기
  const handleOpenModal = async () => {
    setIsLoading(true);

    const at = localStorage.getItem("accessToken");
    console.log("[pending] has accessToken:", !!at, at?.slice(0, 20) + "...");
    showJwt();
    buildCurlForPending();

    try {
      const res = await api.get("/api/lab-creation-requests/admin/pending", {
        headers: authHeaders(),
      });

      const list = Array.isArray(res?.data?.data) ? res.data.data : [];
      setPendingLabs(list);
      setShowModal(true);
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      console.error("⚠️ pending 목록 조회 실패:", { status, data, err });

      try {
        await rawFetchPending();
      } catch (e) {
        console.error("⚠️ rawFetch 실패:", e);
      }

      if (status === 401) {
        alert("로그인이 필요합니다. 다시 로그인 해주세요.");
        try {
          logout();
        } finally {
          navigate("/login", { replace: true });
        }
      } else if (status === 403) {
        alert("권한이 없습니다. (관리자 전용)");
      } else {
        alert(`목록을 불러올 수 없습니다. (status: ${status ?? "unknown"})`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => setShowModal(false);

  // 승인 (그대로 유지)
  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      showJwt();
      buildCurlForApprove(id);

      await api.put(`/api/lab-creation-requests/${id}/approve`, null, {
        headers: authHeaders(),
      });

      setPendingLabs((prev) => prev.filter((lab) => lab.id !== id));
      alert("✅ 승인되었습니다.");
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      console.error("approve error:", status, err.response?.data || err);
      try {
        await rawFetchApprove(id);
      } catch (e) {
        console.error("rawFetchApprove failed:", e);
      }
      if (status === 401) alert("로그인이 만료되었거나 인증이 필요합니다.");
      else if (status === 403) alert("⚠️ 권한이 없습니다. (관리자 전용)");
      else if (status === 422) alert("⚠️ 승인할 수 없는 상태입니다.");
      else
        alert(
          `⚠️ 승인 중 오류가 발생했습니다. (${status ?? "unknown"})\n${msg}`
        );
    } finally {
      setProcessingId(null);
    }
  };

  // 거절 (디버그 강화)
  const handleReject = async (id) => {
    const traceId = genTraceId();
    const t0 = performance.now();

    try {
      setProcessingId(id);

      const userReason = window.prompt(
        "거절 사유를 입력하세요.",
        "요건 미충족"
      );
      const reason = userReason?.trim() || "관리자에 의해 거절되었습니다.";

      const at = localStorage.getItem("accessToken");
      const jwt = parseJwtPayload();
      const now = Math.floor(Date.now() / 1000);
      const secsLeft = jwt?.exp ? jwt.exp - now : null;

      if (DEBUG_REJECT) {
        console.groupCollapsed(
          `%c[reject][${traceId}] PUT /api/lab-creation-requests/${id}/reject`,
          "color:#09f;font-weight:bold"
        );
        console.log("id:", id, "type:", typeof id);
        console.log("reason:", reason);
        console.log("accessToken(short):", shortToken(at));
        console.log("jwt.payload:", jwt);
        console.log("jwt.secondsLeft:", secsLeft);
        console.log(
          "navigator.userAgent:",
          typeof navigator !== "undefined" ? navigator.userAgent : "N/A"
        );
        console.log(
          "location.href:",
          typeof window !== "undefined" ? window.location?.href : "N/A"
        );
        console.log("request.headers:", jsonHeaders());
        buildCurlForRejectVerbose(id, reason);
        console.groupEnd();
      }

      // (선택) 대상이 실제 pending에 있는지 확인
      if (DEBUG_REJECT) {
        await verifyPendingContainsId(id);
      }

      // 실제 호출 (실패여도 응답을 받기 위해 validateStatus 허용)
      const res = await api.put(
        `/api/lab-creation-requests/${id}/reject`,
        { reason },
        { headers: jsonHeaders(), validateStatus: () => true }
      );

      const t1 = performance.now();

      if (res.status >= 200 && res.status < 300) {
        if (DEBUG_REJECT) {
          console.groupCollapsed(
            `%c[reject][${traceId}] SUCCESS ${res.status} (${(t1 - t0).toFixed(
              1
            )}ms)`,
            "color:#0a0;font-weight:bold"
          );
          console.log("response.headers:", res.headers);
          console.log("response.data:", res.data);
          console.groupEnd();
        }
        setPendingLabs((prev) => prev.filter((lab) => lab.id !== id));
        alert("✅ 거절되었습니다.");
        return;
      }

      // 실패 → 에러로 전환하여 아래 catch에서 일괄 처리
      if (DEBUG_REJECT) {
        console.groupCollapsed(
          `%c[reject][${traceId}] FAILURE ${res.status} (${(t1 - t0).toFixed(
            1
          )}ms)`,
          "color:#f80;font-weight:bold"
        );
        console.log("response.headers:", res.headers);
        console.log("response.data:", res.data);
        console.groupEnd();
      }
      const axiosLikeError = new Error(`Reject failed: ${res.status}`);
      axiosLikeError.response = res;
      throw axiosLikeError;
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || err?.message;

      logAxiosError(err, traceId);

      // fetch로 원문 재현 (바디 포함/미포함 둘 다)
      const repJson = await rawFetchRejectJson(
        id,
        "관리자에 의해 거절되었습니다. (repro)"
      );
      const repNoBody = await rawFetchRejectNoBody(id);

      const human =
        `거절 처리 중 오류가 발생했습니다.\n\n` +
        `• traceId: ${traceId}\n` +
        `• status: ${status ?? "unknown"}\n` +
        `• message: ${msg ?? "n/a"}\n` +
        `• jwt.expiresIn: ${(() => {
          const j = parseJwtPayload();
          const now = Math.floor(Date.now() / 1000);
          return j?.exp ? `${j.exp - now}s` : "n/a";
        })()}\n\n` +
        `재현 결과(fetch):\n` +
        `- JSON 바디: ${repJson.status}\n` +
        `- 바디 없음: ${repNoBody.status}`;

      alert(human);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <header className="rankus-header">
      <div className="rankus-header-inner">
        <span
          className="rankus-header-logo-text"
          onClick={() => navigate("/home")}
        >
          RANKUS
        </span>

        {!isAuthPage && (
          <div className="rankus-header-profile-group">
            <button
              className="rankus-header-pending-btn"
              onClick={handleOpenModal}
              disabled={isLoading}
            >
              {isLoading ? "불러오는 중..." : "승인 대기 랩실 보기"}
            </button>

            <div
              className="rankus-header-profile"
              onClick={() => navigate("/profile")}
            >
              <span className="rankus-header-profile-name">
                {user?.name ?? "Unknown"}
              </span>
            </div>

            <button className="rankus-header-logout-btn" onClick={logout}>
              로그아웃
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>✅ 승인 대기 중인 랩실 목록</h3>

            {!pendingLabs.length ? (
              <p>대기 중인 요청이 없습니다.</p>
            ) : (
              <ul>
                {pendingLabs.map((lab) => (
                  <li key={lab.id} style={{ marginBottom: 12 }}>
                    <strong>{lab.requestedLabName}</strong> (
                    {lab.requestedCategory})
                    <br />
                    <small>{lab.requestedDescription}</small>
                    <br />
                    <em>
                      신청자: {lab.requester?.name} ({lab.requester?.email})
                    </em>
                    <br />
                    <button
                      onClick={() => handleApprove(lab.id)}
                      style={{ marginRight: 8 }}
                      disabled={processingId === lab.id}
                    >
                      {processingId === lab.id ? "처리 중..." : "승인"}
                    </button>
                    <button
                      onClick={() => handleReject(lab.id)}
                      disabled={processingId === lab.id}
                    >
                      {processingId === lab.id ? "처리 중..." : "거절"}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button onClick={handleCloseModal}>닫기</button>
          </div>
        </div>
      )}
    </header>
  );
}

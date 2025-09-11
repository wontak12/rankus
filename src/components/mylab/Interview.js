// src/pages/Interview.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";
import "../../styles/MyLab.css";
import "../../styles/Interview.css";

/* ===== 날짜/표시 유틸 ===== */
function fmtDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ===== 디버그 유틸 (필요 시 콘솔에서 확인용) ===== */
const DEBUG_INT = true;
function shortToken(t, n = 16) {
  return t ? `${t.slice(0, n)}…` : "∅";
}
function curlGetInterviews(id, base = "http://3.34.229.56:8080") {
  const at = localStorage.getItem("accessToken");
  return [
    `curl -i -X GET '${base}/api/labs/${id}/interviews'`,
    `  -H 'accept: application/json'`,
    at ? `  -H 'Authorization: Bearer ${at}'` : null,
  ]
    .filter(Boolean)
    .join(" \\\n");
}
function curlPostInterview(id, body, base = "http://3.34.229.56:8080") {
  const at = localStorage.getItem("accessToken");
  const data = JSON.stringify(body).replace(/"/g, '\\"');
  return [
    `curl -i -X POST '${base}/api/labs/${id}/interviews'`,
    `  -H 'accept: application/json'`,
    `  -H 'content-type: application/json'`,
    at ? `  -H 'Authorization: Bearer ${at}'` : null,
    `  -d "${data}"`,
  ]
    .filter(Boolean)
    .join(" \\\n");
}
function curlGetSlots(labId, interviewId, base = "http://3.34.229.56:8080") {
  const at = localStorage.getItem("accessToken");
  return [
    `curl -i -X GET '${base}/api/labs/${labId}/interviews/${interviewId}/slots'`,
    `  -H 'accept: application/json'`,
    at ? `  -H 'Authorization: Bearer ${at}'` : null,
  ]
    .filter(Boolean)
    .join(" \\\n");
}
function curlPostSlot(
  labId,
  interviewId,
  body,
  base = "http://3.34.229.56:8080"
) {
  const at = localStorage.getItem("accessToken");
  const data = JSON.stringify(body).replace(/"/g, '\\"');
  return [
    `curl -i -X POST '${base}/api/labs/${labId}/interviews/${interviewId}/slots'`,
    `  -H 'accept: application/json'`,
    `  -H 'content-type: application/json'`,
    at ? `  -H 'Authorization: Bearer ${at}'` : null,
    `  -d "${data}"`,
  ]
    .filter(Boolean)
    .join(" \\\n");
}

/* ===== 페이지: Interview ===== */
export default function Interview({ labId: propLabId }) {
  const { labId: paramLabId, id: paramId } = useParams();
  const labId = propLabId ?? paramLabId ?? paramId;

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");
  const [items, setItems] = useState([]);

  // 생성 폼 상태(면접 자체) — 날짜 하나만!
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState("");
  const [fieldErrs, setFieldErrs] = useState({});
  const [createMsg, setCreateMsg] = useState("");
  const [form, setForm] = useState({
    date: todayStr(), // ✅ 단일 날짜
    durationMinutes: 30,
    maxApplicantsPerSlot: 1,
  });

  // 목록 불러오기(면접)
  const fetchList = async (id) => {
    if (!id) return;
    if (DEBUG_INT) {
      const at = localStorage.getItem("accessToken");
      console.groupCollapsed(
        "%c[Interview] GET list",
        "color:#09f;font-weight:bold"
      );
      console.log("Authorization(short):", shortToken(at));
      console.log("cURL:\n" + curlGetInterviews(id));
      console.groupEnd();
    }

    try {
      const res = await api.get(`/api/labs/${id}/interviews`, {
        headers: { Accept: "application/json" },
      });
      const payload = res?.data;
      const listRaw = Array.isArray(payload?.data)
        ? payload.data
        : payload?.data
        ? [payload.data]
        : [];
      // API엔 startDate/endDate가 있지만, 우리 UI는 date만 쓰므로 정렬은 startDate 기준
      const sorted = [...listRaw].sort(
        (a, b) => new Date(a.startDate) - new Date(b.startDate)
      );
      setItems(sorted);
      setErrMsg("");
    } catch (err) {
      console.error(
        "[Interview] GET /api/labs/{labId}/interviews failed:",
        err?.response?.status,
        err?.response?.data || err
      );
      setErrMsg("면접 일정 목록을 불러오지 못했습니다.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (!labId) {
      setErrMsg("랩실 ID가 없습니다.");
      setLoading(false);
      return;
    }
    (async () => {
      await fetchList(labId);
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
  }, [labId]);

  // 면접 생성 핸들러 (단일 날짜 → 서버에는 startDate=endDate=date 로 전송)
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!labId) return;

    setCreateErr("");
    setFieldErrs({});
    setCreateMsg("");

    const payload = {
      startDate: form.date?.trim(), // ✅ 단일 날짜
      endDate: form.date?.trim(), // ✅ 동일 날짜로 맞춰 전송(서버 호환)
      durationMinutes: Number(form.durationMinutes),
      maxApplicantsPerSlot: Number(form.maxApplicantsPerSlot),
    };

    // 최소 검증
    if (!payload.startDate) {
      setCreateErr("면접 날짜를 선택하세요.");
      return;
    }
    if (
      !Number.isFinite(payload.durationMinutes) ||
      payload.durationMinutes < 1
    ) {
      setCreateErr("면접 시간은 1분 이상이어야 합니다.");
      return;
    }
    if (
      !Number.isFinite(payload.maxApplicantsPerSlot) ||
      payload.maxApplicantsPerSlot < 1
    ) {
      setCreateErr("면접당 최대 인원은 1명 이상이어야 합니다.");
      return;
    }

    if (DEBUG_INT) {
      const at = localStorage.getItem("accessToken");
      console.groupCollapsed(
        `%c[Interview] POST /api/labs/${labId}/interviews`,
        "color:#0a0;font-weight:bold"
      );
      console.log("Authorization(short):", shortToken(at));
      console.log("payload:", payload);
      console.log("cURL:\n" + curlPostInterview(labId, payload));
      console.groupEnd();
    }

    setCreating(true);
    try {
      const res = await api.post(`/api/labs/${labId}/interviews`, payload, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        validateStatus: () => true,
      });

      if (res.status === 201 || res?.data?.success === true) {
        setCreateMsg("면접 일정이 생성되었습니다.");
        const created = res?.data?.data;
        if (created && typeof created === "object") {
          setItems((prev) =>
            [...prev, created].sort(
              (a, b) => new Date(a.startDate) - new Date(b.startDate)
            )
          );
        } else {
          await fetchList(labId);
        }
        return;
      }

      const serverMsg = res?.data?.message || "요청이 거절되었습니다.";
      const serverErrors = res?.data?.errors;
      let fields = {};
      if (Array.isArray(serverErrors)) {
        serverErrors.forEach((e) => {
          if (e?.field) fields[e.field] = e?.message;
        });
      }
      setCreateErr(serverMsg);
      setFieldErrs(fields);
    } catch (err) {
      console.error(
        "[Interview] create error:",
        err?.response?.status,
        err?.response?.data || err
      );
      setCreateErr("요청 중 오류가 발생했습니다.");
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="interview-loading">불러오는 중...</div>;
  if (errMsg) return <div className="interview-error">{errMsg}</div>;

  return (
    <div className="mylab-card">
      <div className="interview-inner">
        <div className="interview-header-row">
          <h2 className="interview-title">면접 일정</h2>
          <button
            className="mylab-interview-btn interview-create-toggle"
            onClick={() => setCreateOpen((v) => !v)}
          >
            {createOpen ? "면접 일정 생성 닫기" : "면접 일정 생성"}
          </button>
          <button
            className="mylab-interview-btn interview-refresh"
            onClick={() => fetchList(labId)}
          >
            새로고침
          </button>
        </div>

        {/* 면접 생성 폼 (날짜 하나만) */}
        {createOpen && (
          <form onSubmit={handleCreate} className="interview-create-form">
            <div className="interview-create-grid">
              
              <div>
                <label>면접 날짜</label>
                <input
                  type="date"
                  value={form.date}
                  min={todayStr()}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                  required
                  disabled={creating}
                />
                {fieldErrs.startDate && (
                  <div className="interview-field-error">
                    {fieldErrs.startDate}
                  </div>
                )}
              </div>

              <div>
                <label>면접 시간(분)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.durationMinutes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, durationMinutes: e.target.value }))
                  }
                  required
                  disabled={creating}
                />
                {fieldErrs.durationMinutes && (
                  <div className="interview-field-error">
                    {fieldErrs.durationMinutes}
                  </div>
                )}
              </div>
             

              <div>
                <label>면접당 최대 인원(명)</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.maxApplicantsPerSlot}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      maxApplicantsPerSlot: e.target.value,
                    }))
                  }
                  required
                  disabled={creating}
                />
                {fieldErrs.maxApplicantsPerSlot && (
                  <div className="interview-field-error">
                    {fieldErrs.maxApplicantsPerSlot}
                  </div>
                )}
              </div>
            </div>

            {createErr && (
              <div className="interview-create-error">{createErr}</div>
            )}
            {createMsg && (
              <div className="interview-create-success">{createMsg}</div>
            )}

            <div className="interview-create-btn-row">
              <button
                className="mylab-interview-btn"
                type="submit"
                disabled={creating}
              >
                {creating ? "생성 중..." : "면접 일정 생성하기"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    date: todayStr(),
                    durationMinutes: 30,
                    maxApplicantsPerSlot: 2,
                  }))
                }
                disabled={creating}
              >
                예시값(오늘·30분·2명)
              </button>
            </div>
          </form>
        )}

        {/* 면접 목록 + 각 면접의 슬롯 패널 */}
        {items.length === 0 ? (
          <div>등록된 면접 일정이 없습니다.</div>
        ) : (
          <ul className="interview-list">
            {items.map((it) => (
              <li
                key={it.id ?? `${it.startDate}-${it.durationMinutes}`}
                className="interview-list-item"
              >
                <div className="interview-list-title">
                  {it.labName || `랩실 #${it.labId || labId}`} — 면접 #{it.id}
                </div>
                <div className="interview-info-block">
                  <div className="interview-flex">
                  <div className="interview-info-row">
                    <span className="interview-info-label">📅 면접 날짜</span>
                    <span className="interview-info-value">{it.startDate}</span>
                  </div>
                  <div className="interview-info-row">
                    <span className="interview-info-label">⏱ 면접 시간</span>
                    <span className="interview-info-value">
                      {it.durationMinutes ?? 0}분
                    </span>
                  </div>
                  </div>
                  <div className="interview-info-row">
                    <span className="interview-info-label">
                      👥 면접당 최대 인원
                    </span>
                    <span className="interview-info-value">
                      {it.maxApplicantsPerSlot ?? 0}명
                    </span>
                  </div>
                  <div className="interview-list-dateinfo">
                    생성: {fmtDate(it.createdAt)} / 수정:{" "}
                    {fmtDate(it.updatedAt)}
                  </div>
                </div>

                {/* ▼ 해당 면접의 슬롯 패널. 날짜 하나만 주고, 그 날짜 내에서 시간만 선택 */}
                <SlotsPanel
                  labId={labId}
                  interviewId={it.id}
                  interviewDate={it.startDate} // ✅ 단일 날짜 기준
                  durationMinutes={it.durationMinutes}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* =========================
   면접별 슬롯 패널 (목록 + 생성)
   — 단일 날짜 내에서만 시간 선택
   ========================= */
function SlotsPanel({ labId, interviewId, interviewDate, durationMinutes }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [errMsg, setErrMsg] = useState("");

  // 생성 폼
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState("");
  const [createErr, setCreateErr] = useState("");
  const [fieldErrs, setFieldErrs] = useState({});
  const [slotForm, setSlotForm] = useState({
    startTime: "", // HH:mm
  });

  // UTC Z(+ms)로 변환: 2025-08-17T06:25:50.000Z
  function toUtcZ(dateTimeLocal) {
    if (!dateTimeLocal) return "";
    const d = new Date(dateTimeLocal); // 로컬시간으로 해석
    return d.toISOString(); // ISO(UTC Z)로
  }

  // GET 슬롯 목록
  const fetchSlots = async () => {
    setLoading(true);
    if (DEBUG_INT) {
      const at = localStorage.getItem("accessToken");
      console.groupCollapsed(
        "%c[Slots] GET list",
        "color:#09f;font-weight:bold"
      );
      console.log("labId, interviewId:", labId, interviewId);
      console.log("Authorization(short):", shortToken(at));
      console.log("cURL:\n" + curlGetSlots(labId, interviewId));
      console.groupEnd();
    }
    try {
      const res = await api.get(
        `/api/labs/${labId}/interviews/${interviewId}/slots`,
        { headers: { Accept: "application/json" } }
      );
      const payload = res?.data;
      const list = Array.isArray(payload?.data)
        ? payload.data
        : payload?.data
        ? [payload.data]
        : [];
      setItems(list);
      setErrMsg("");
    } catch (err) {
      console.error(
        "[Slots] GET failed:",
        err?.response?.status,
        err?.response?.data || err
      );
      setErrMsg("슬롯 목록을 불러오지 못했습니다.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && items.length === 0 && !loading) {
      fetchSlots();
    }
    // eslint-disable-next-line
  }, [open]);

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setCreateMsg("");
    setCreateErr("");
    setFieldErrs({});

    if (!interviewDate) {
      setCreateErr("면접 날짜 정보가 없습니다.");
      return;
    }
    if (!slotForm.startTime) {
      setCreateErr("시작 시간을 선택하세요.");
      return;
    }

    // 날짜 하나 + HH:mm → datetime-local 구성
    const startLocal = `${interviewDate}T${slotForm.startTime}`;
    const start = new Date(startLocal);
    if (!(start instanceof Date) || isNaN(start)) {
      setCreateErr("잘못된 시간 형식입니다.");
      return;
    }

    const duration = Number(durationMinutes) || 0;
    if (duration < 1) {
      setCreateErr("유효한 면접 시간(분)이 아닙니다.");
      return;
    }
    const end = new Date(start.getTime() + duration * 60000);

    // 같은 날짜 안에서만
    const dateOnly = (d) => d.toISOString().slice(0, 10);
    if (dateOnly(start) !== interviewDate || dateOnly(end) !== interviewDate) {
      setCreateErr(`면접은 면접 날짜(${interviewDate})를 벗어날 수 없습니다.`);
      return;
    }

    // 서버가 UTC Z 선호한다고 가정
    const payload = {
      startTime: toUtcZ(startLocal),
      endTime: toUtcZ(
        `${interviewDate}T${String(end.getHours()).padStart(2, "0")}:${String(
          end.getMinutes()
        ).padStart(2, "0")}`
      ),
      // 정원은 면접의 maxApplicantsPerSlot를 서버가 기본으로 잡는다면 생략 가능.
      // 필요시 필드 추가해서 setSlotForm에 입력받도록 확장하세요.
    };

    if (DEBUG_INT) {
      const at = localStorage.getItem("accessToken");
      console.groupCollapsed(
        "%c[Slots] POST create",
        "color:#0a0;font-weight:bold"
      );
      console.log(
        "interviewDate:",
        interviewDate,
        "startLocal:",
        startLocal,
        "end:",
        end
      );
      console.log("payload:", payload);
      console.log("Authorization(short):", shortToken(at));
      console.log("cURL:\n" + curlPostSlot(labId, interviewId, payload));
      console.groupEnd();
    }

    setCreating(true);
    try {
      const res = await api.post(
        `/api/labs/${labId}/interviews/${interviewId}/slots`,
        payload,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          validateStatus: () => true,
        }
      );

      if (
        res.status === 200 ||
        res.status === 201 ||
        res?.data?.success === true
      ) {
        setCreateMsg("면접이 생성되었습니다.");
        await fetchSlots();
        // 입력값 초기화
        setSlotForm({ startTime: "" });
      } else {
        const msg =
          res?.data?.message || `실패했습니다. (status: ${res.status})`;
        setCreateErr(msg);
        const errs = res?.data?.errors;
        if (Array.isArray(errs)) {
          const map = {};
          errs.forEach((e) => {
            if (e?.field) map[e.field] = e?.message;
          });
          setFieldErrs(map);
        }
      }
    } catch (err) {
      console.error(
        "[Slots] create error:",
        err?.response?.status,
        err?.response?.data || err
      );
      setCreateErr("요청 중 오류가 발생했습니다.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <button
        className="mylab-interview-btn"
        onClick={() => setOpen((v) => !v)}
        style={{ marginBottom: 8 }}
      >
        {open ? "면접 닫기" : "면접 보기/추가"}
      </button>

      {open && (
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 12,
            background: "#fafafa",
          }}
        >
          {/* 생성 폼 — 면접 날짜는 고정, 시간만 고름 */}
          <form onSubmit={handleCreateSlot} style={{ marginBottom: 12 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 0.8fr",
                gap: 12,
                alignItems: "end",
              }}
            >
              <div>
                <label>
                  면접 날짜: <b>{interviewDate}</b>
                </label>
                <div style={{ marginTop: 6 }}>
                  <label>시작 시간</label>
                  <input
                    type="time"
                    value={slotForm.startTime}
                    onChange={(e) =>
                      setSlotForm((s) => ({ ...s, startTime: e.target.value }))
                    }
                    required
                    disabled={creating}
                  />
                  {fieldErrs.startTime && (
                    <div style={{ color: "#b00020" }}>
                      {fieldErrs.startTime}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <button
                  className="mylab-interview-btn"
                  type="submit"
                  disabled={creating}
                >
                  {creating ? "면접 생성 중..." : "면접 생성"}
                </button>
              </div>
            </div>

            {createErr && (
              <div
                style={{
                  color: "#b00020",
                  marginTop: 8,
                  whiteSpace: "pre-line",
                }}
              >
                {createErr}
              </div>
            )}
            {createMsg && (
              <div style={{ color: "#0a7", marginTop: 8 }}>{createMsg}</div>
            )}
          </form>

          {/* 슬롯 목록 */}
          {loading ? (
            <div>면접 불러오는 중...</div>
          ) : errMsg ? (
            <div>{errMsg}</div>
          ) : items.length === 0 ? (
            <div>등록된 면접이 없습니다.</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {items.map((s, idx) => (
                <li
                  key={s.id ?? idx}
                  style={{
                    border: "1px solid #e6e6e6",
                    borderRadius: 10,
                    padding: 10,
                    marginBottom: 8,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    면접{s.id ?? idx}
                  </div>
                  <div className="interview-slot-info">
                    <div className="interview-slot-row">
                      <span className="interview-slot-label">🕒 시작</span>
                      <span className="interview-slot-value">
                        {fmtDate(s.startTime)}
                      </span>
                    </div>
                    <div className="interview-slot-row">
                      <span className="interview-slot-label">🕔 종료</span>
                      <span className="interview-slot-value">
                        {fmtDate(s.endTime)}
                      </span>
                    </div>
                    <div className="interview-slot-row">
                      <span className="interview-slot-label">👥 정원</span>
                      <span className="interview-slot-value">
                        {s.maxApplicants}
                      </span>
                      <span className="interview-slot-label">신청</span>
                      <span className="interview-slot-value">
                        {s.currentApplicants}
                      </span>
                      <span className="interview-slot-label">남은자리</span>
                      <span className="interview-slot-value">
                        {s.availableSpots}
                      </span>
                    </div>
                    <div className="interview-slot-status">
                      <span className="interview-slot-label">이용가능</span>
                      <span className="interview-slot-value">
                        {String(s.isAvailable)}
                      </span>
                    </div>
                  </div>
                  <div style={{ color: "#666", marginTop: 4 }}>
                    생성: {fmtDate(s.createdAt)} / 수정: {fmtDate(s.updatedAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* 수동 새로고침 */}
          <div style={{ marginTop: 8 }}>
            <button className="mylab-interview-btn" onClick={fetchSlots}>
              면접 목록 새로고침
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

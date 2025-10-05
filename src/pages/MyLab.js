// src/pages/MyLab.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api.js";
import "../styles/MyLab.css";

import ApplicationsPreview from "../components/mylab/ApplicationsPreview";
import CalendarSection from "../components/mylab/CalendarSection";
import FilePreview from "../components/mylab/FilePreview";
import HeaderSection from "../components/mylab/HeaderSection";
import MemberSection from "../components/mylab/MemberSection";
import NoticePreview from "../components/mylab/NoticePreview";
import VotePreview from "../components/mylab/VotePreview";

// ❌ 내부 렌더 제거 → 전용 페이지로 이동하므로 import 불필요
// import Interview from "../components/mylab/Interview";

/* ===================== 디버그 유틸 ===================== */
const DEBUG_MYLAB = true;

function curlGetMe(base = "http://3.34.229.56:8080") {
	const at = localStorage.getItem("accessToken");
	return [
		`curl -i -X GET '${base}/api/users/me'`,
		`  -H 'accept: application/json'`,
		at ? `  -H 'Authorization: Bearer ${at}'` : null,
	]
		.filter(Boolean)
		.join(" \\\n");
}
function curlGetLab(id, base = "http://3.34.229.56:8080") {
	const at = localStorage.getItem("accessToken");
	return [
		`curl -i -X GET '${base}/api/labs/${id}'`,
		`  -H 'accept: application/json'`,
		at ? `  -H 'Authorization: Bearer ${at}'` : null,
	]
		.filter(Boolean)
		.join(" \\\n");
}
function shortToken(t, n = 16) {
	return t ? `${t.slice(0, n)}…` : "∅";
}
/* ===================================================== */

function MyLab() {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [lab, setLab] = useState(null);

	useEffect(() => {
		let mounted = true;
		const t0 = performance.now();

		(async () => {
			try {
				/* ===== /api/users/me ===== */
				if (DEBUG_MYLAB) {
					const at = localStorage.getItem("accessToken");
					console.groupCollapsed(
						"%c[MyLab] GET /api/users/me",
						"color:#09f;font-weight:bold"
					);
					console.log("Authorization(short):", shortToken(at));
					console.log("cURL:\n" + curlGetMe());
					console.groupEnd();
				}

				const meRes = await api.get("/api/users/me", {
					headers: { Accept: "application/json" },
					validateStatus: () => true, // 상태코드와 관계없이 본문 확인
				});

				if (DEBUG_MYLAB) {
					console.groupCollapsed(
						`%c[MyLab] /api/users/me -> ${meRes.status}`,
						"color:#555"
					);
					console.log("response.data:", meRes?.data);
					console.log("response.headers:", meRes?.headers);
					console.groupEnd();
					// 콘솔에서 재확인용
					window.__mylab_me__ = { status: meRes.status, data: meRes?.data };
				}

				if (meRes.status === 401) {
					alert("세션이 만료되었습니다. 다시 로그인해주세요.");
					navigate("/login", { replace: true });
					return;
				}
				if (meRes.status >= 400) {
					console.warn("[MyLab] /api/users/me failed:", meRes.status);
					// 사용자 정보 조회 실패 → 안전하게 NoLab로
					navigate("/my-lab/no-lab", { replace: true });
					return;
				}

				const mePayload = meRes?.data;
				const me = mePayload?.data ?? mePayload ?? null;
				const labId = me?.labId ?? null;

				if (!labId) {
					if (DEBUG_MYLAB) console.log("[MyLab] labId is null → go NoLab");
					navigate("/my-lab/no-lab", { replace: true });
					return;
				}

				/* ===== /api/labs/{labId} ===== */
				if (DEBUG_MYLAB) {
					console.groupCollapsed(
						`%c[MyLab] GET /api/labs/${labId}`,
						"color:#09f;font-weight:bold"
					);
					console.log("cURL:\n" + curlGetLab(labId));
					console.groupEnd();
				}

				const labRes = await api.get(`/api/labs/${labId}`, {
					headers: { Accept: "application/json" },
					validateStatus: () => true,
				});

				if (DEBUG_MYLAB) {
					console.groupCollapsed(
						`%c[MyLab] /api/labs/${labId} -> ${labRes.status}`,
						"color:#555"
					);
					console.log("response.data:", labRes?.data);
					console.log("response.headers:", labRes?.headers);
					console.groupEnd();
					window.__mylab_lab__ = {
						labId,
						status: labRes.status,
						data: labRes?.data,
					};
				}

				if (labRes.status === 404) {
					console.warn("[MyLab] lab not found, id=", labId);
					// 랩실 상세 없지만 labId는 있으므로 최소 정보로 렌더
					if (mounted) setLab({ id: labId, name: "내 랩실", description: "" });
				} else if (labRes.status >= 400) {
					console.warn("[MyLab] lab fetch error:", labRes.status);
					if (mounted) setLab({ id: labId, name: "내 랩실", description: "" });
				} else {
					const payload = labRes?.data;
					const labData = payload?.data ?? payload;
					if (mounted) {
						if (labData && typeof labData === "object") {
							setLab(labData);
						} else {
							setLab({ id: labId, name: "내 랩실", description: "" });
						}
					}
				}
			} catch (err) {
				const st = err?.response?.status;
				console.error(
					"[MyLab] unexpected error:",
					st,
					err?.response?.data || err
				);
				if (st === 401) {
					navigate("/login", { replace: true });
				} else {
					navigate("/my-lab/no-lab", { replace: true });
				}
			} finally {
				const t1 = performance.now();
				if (DEBUG_MYLAB) {
					console.log(`[MyLab] init finished in ${(t1 - t0).toFixed(1)}ms`);
				}
				if (mounted) setLoading(false);
			}
		})();

		return () => {
			mounted = false;
		};
	}, [navigate]);

	if (loading) return <div className="mylab-container">불러오는 중...</div>;
	if (!lab) return null; // 위 effect에서 라우팅됨

	return (
		<div className="mylab-container">
			{/* 랩실 소개 및 헤더 */}
			<HeaderSection lab={lab} />

			{/* 인터뷰 페이지로 이동 버튼 */}
			<div style={{ display: "flex" }}>
				<div style={{ margin: "12px 0" }}>
					<button
						className="mylab-interview-btn"
						onClick={() => {
							if (DEBUG_MYLAB)
								console.log(
									"[MyLab] go interviews page:",
									`/lab/${lab.id}/interviews`
								);
							navigate(`/lab/${lab.id}/interviews`);
						}}
					>
						면접 일정 페이지로 이동
					</button>
				</div>

				<div style={{ margin: "12px 0" }}>
					<button
						className="mylab-interview-btn mylab-schedule-btn"
						onClick={() => {
							navigate(`/lab/${lab.id}/schedule`);
						}}
					>
						일정 페이지로 이동
					</button>
				</div>

				<div style={{ margin: "12px 0" }}>
					<button
						className="mylab-interview-btn mylab-attendance-btn"
						onClick={() => {
							navigate(`/lab/${lab.id}/attendance`);
						}}
					>
						출석 페이지로 이동
					</button>
				</div>

				<div style={{ margin: "12px 0" }}>
					<button
						className="mylab-interview-btn mylab-calendar-btn"
						onClick={() => {
							navigate(`/lab/${lab.id}/calendar`);
						}}
					>
						달력페이지로 이동
					</button>
				</div>
			</div>

			{/* 기능 섹션들 */}
			<div className="mylab-grid">
				<CalendarSection labId={lab.id} />
				<VotePreview />

				<NoticePreview labId={lab.id} />
				<FilePreview />
				<MemberSection labId={lab.id} />
				<ApplicationsPreview labId={lab.id} />
				{/* ❌ 내부 렌더 제거: {lab && <Interview labId={lab.id} />} */}
			</div>
		</div>
	);
}

export default MyLab;

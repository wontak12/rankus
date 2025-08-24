// src/pages/JoinLab.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import "../styles/JoinLab.css";

/* ========= DEBUG ========= */
const DEBUG = true;
const DSTYLE = {
	head: "color:#6c5ce7;font-weight:700",
	warn: "color:#e17055;font-weight:700",
	info: "color:#0984e3",
	ok: "color:#00b894",
	err: "color:#d63031;font-weight:700",
};
function dgroup(title, style = DSTYLE.head) {
	if (!DEBUG) return () => {};
	console.groupCollapsed?.(`%c${title}`, style);
	return () => console.groupEnd?.();
}
const dlog = (...a) => DEBUG && console.log(...a);
const dwarn = (...a) => DEBUG && console.warn(...a);
const derror = (...a) => DEBUG && console.error(...a);

/* ========= 날짜/시간 유틸 ========= */
// "YYYY-MM-DDTHH:mm" or ISO -> "YYYY-MM-DDTHH:mm:00" (로컬, Z 없음)
function toLocalSeconds(v) {
	if (!v) return "";
	if (v.length === 16) return `${v}:00`;
	if (v.length >= 19) return v.slice(0, 19);
	return v;
}
function isoToLocalDateStr(iso) {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}
function inRange(dateStr, startDate, endDate) {
	if (!dateStr || !startDate || !endDate) return false;
	return startDate <= dateStr && dateStr <= endDate;
}

/* ========= 화면 디버그 ========= */
function DebugPanel({ state }) {
	if (!DEBUG) return null;
	return (
		<details style={{ marginTop: 16 }}>
			<summary style={{ cursor: "pointer" }}>🔎 Debug</summary>
			<pre
				style={{
					whiteSpace: "pre-wrap",
					wordBreak: "break-all",
					background: "#0b1020",
					color: "#d6e1ff",
					padding: 12,
					borderRadius: 8,
					fontSize: 12,
					lineHeight: 1.4,
				}}
			>
				{JSON.stringify(state, null, 2)}
			</pre>
		</details>
	);
}

/* ========= 컴포넌트 ========= */
export default function JoinLab() {
	const { id, labId: id2, interviewId: interviewIdParam } = useParams();
	const location = useLocation();
	const qs = new URLSearchParams(location.search);
	const interviewIdQuery = qs.get("interviewId");

	const labId = id ?? id2;
	const navigate = useNavigate();

	// 1) 면접 목록
	const [intLoading, setIntLoading] = useState(false);
	const [intError, setIntError] = useState("");
	const [interviews, setInterviews] = useState([]);

	// 2) 날짜/면접/슬롯 선택 흐름
	const [selectedDate, setSelectedDate] = useState("");
	const [interviewsOnDate, setInterviewsOnDate] = useState([]);
	const [selectedInterviewId, setSelectedInterviewId] = useState("");

	// 3) 슬롯/제출
	const [slotsLoading, setSlotsLoading] = useState(false);
	const [slots, setSlots] = useState([]);
	const [selectedSlotId, setSelectedSlotId] = useState("");

	// 4) 레거시 전용: 시간 직접 입력(슬롯 없거나 지난 경우)
	const [manualTime, setManualTime] = useState("");

	// 제출 상태
	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState("");

	/* 성공 시 홈 이동 */
	useEffect(() => {
		if (success) {
			const t = setTimeout(() => navigate("/home"), 1500);
			return () => clearTimeout(t);
		}
	}, [success, navigate]);

	/* 1) 면접 목록 조회 */
	useEffect(() => {
		if (!labId) return;
		(async () => {
			setIntLoading(true);
			setIntError("");
			const end = dgroup(`FETCH interviews [labId=${labId}]`, DSTYLE.info);
			try {
				const res = await api.get(`/api/labs/${labId}/interviews`, {
					headers: { Accept: "*/*" },
					validateStatus: () => true,
				});
				if (res.status === 200) {
					const list = Array.isArray(res?.data?.data) ? res.data.data : [];
					list.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
					setInterviews(list);

					const prefer = interviewIdParam ?? interviewIdQuery;
					if (prefer && list.some((it) => String(it.id) === String(prefer))) {
						setSelectedInterviewId(String(prefer));
					}
				} else {
					setIntError(res?.data?.message || "면접 목록을 불러오지 못했습니다.");
					setInterviews([]);
				}
			} catch (e) {
				derror("[JoinLab] interviews fetch error:", e);
				setIntError("면접 목록 조회 중 오류가 발생했습니다.");
				setInterviews([]);
			} finally {
				end();
				setIntLoading(false);
			}
		})();
	}, [labId, interviewIdParam, interviewIdQuery]);

	/* 2-a) 날짜 변경 시 해당 날짜 면접만 보이기 */
	useEffect(() => {
		const end = dgroup("recompute interviewsOnDate", DSTYLE.ok);
		if (!selectedDate || interviews.length === 0) {
			setInterviewsOnDate([]);
			setSelectedInterviewId("");
			setSlots([]);
			setSelectedSlotId("");
			setManualTime("");
			end();
			return;
		}
		const filtered = interviews.filter((it) =>
			inRange(selectedDate, it.startDate, it.endDate)
		);
		setInterviewsOnDate(filtered);

		if (!filtered.some((it) => String(it.id) === String(selectedInterviewId))) {
			if (filtered.length === 1) setSelectedInterviewId(String(filtered[0].id));
			else setSelectedInterviewId("");
			setSlots([]);
			setSelectedSlotId("");
			setManualTime("");
		}
		end();
	}, [selectedDate, interviews]); // selectedInterviewId 의존성 제외 intentional

	/* 2-b) 면접 선택 또는 날짜 변경 시 슬롯 조회 */
	useEffect(() => {
		if (!labId || !selectedInterviewId || !selectedDate) {
			setSlots([]);
			setSelectedSlotId("");
			return;
		}
		const it = interviews.find(
			(x) => String(x.id) === String(selectedInterviewId)
		);
		if (!it || !inRange(selectedDate, it.startDate, it.endDate)) {
			dwarn("[JoinLab] selected interview not in selected date range");
			setSlots([]);
			setSelectedSlotId("");
			return;
		}

		(async () => {
			setSlotsLoading(true);
			setError("");
			const end = dgroup(
				`FETCH slots [labId=${labId}, interviewId=${selectedInterviewId}]`,
				DSTYLE.info
			);
			try {
				const url = `/api/labs/${labId}/interviews/${selectedInterviewId}/slots`;
				dlog("→ GET", url);
				const res = await api.get(url, {
					headers: { Accept: "*/*" },
					validateStatus: () => true,
				});
				if (res.status === 200) {
					const all = Array.isArray(res?.data?.data) ? res.data.data : [];
					all.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
					const byDate = all.filter(
						(s) => isoToLocalDateStr(s.startTime) === selectedDate
					);
					setSlots(byDate);

					const firstSelectable = byDate.find(
						(s) => s?.isAvailable && !s?.isFull && !s?.isPast
					);
					setSelectedSlotId(firstSelectable ? String(firstSelectable.id) : "");
				} else {
					dwarn("[JoinLab] slots fetch failed:", res?.status, res?.data);
					setSlots([]);
					setSelectedSlotId("");
				}
			} catch (e) {
				derror("[JoinLab] slots fetch error:", e);
				setSlots([]);
				setSelectedSlotId("");
			} finally {
				end();
				setSlotsLoading(false);
			}
		})();
	}, [labId, selectedInterviewId, selectedDate, interviews]);

	const selectableSlots = useMemo(
		() => slots.filter((s) => s?.isAvailable && !s?.isFull && !s?.isPast),
		[slots]
	);

	const selectedSlotStart = useMemo(() => {
		if (!selectedSlotId) return "";
		const s = slots.find((x) => String(x.id) === String(selectedSlotId));
		return s?.startTime ?? "";
	}, [selectedSlotId, slots]);

	/* ===== 제출: 슬롯 기반 우선 → 필요시 레거시 폴백 ===== */
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		const end = dgroup(
			"handleSubmit(slot-first-with-legacy-fallback)",
			DSTYLE.head
		);
		dlog({
			labId,
			selectedDate,
			selectedInterviewId,
			selectedSlotId,
			selectedSlotStart,
			manualTime,
		});

		if (!labId) {
			setError("잘못된 경로입니다. 랩실 ID가 없습니다.");
			end();
			return;
		}
		if (!selectedInterviewId) {
			setError("면접을 선택하세요.");
			end();
			return;
		}

		// 현재 선택한 슬롯이 '선택 가능'한지 체크
		const selectedSlot = slots.find(
			(s) => String(s.id) === String(selectedSlotId)
		);
		const slotSelectable =
			!!selectedSlot &&
			selectedSlot.isAvailable &&
			!selectedSlot.isFull &&
			!selectedSlot.isPast;

		// 1) 슬롯이 선택 가능하면 → /slot-based 1순위 시도
		if (slotSelectable) {
			try {
				setSubmitting(true);
				const slotRes = await api.post(
					`/api/labs/${labId}/applications/slot-based`,
					{ slotId: Number(selectedSlotId) },
					{
						headers: {
							Accept: "application/json",
							"Content-Type": "application/json",
						},
						validateStatus: () => true,
					}
				);
				dlog("slot-based →", slotRes?.status, slotRes?.data);

				if (slotRes.status === 201) {
					setSuccess(true);
					end();
					return;
				}

				// slot-based 실패 케이스 처리
				const sMsg = slotRes?.data?.message || "요청에 실패했습니다.";
				if (slotRes.status === 409) {
					setError("이미 해당 랩실에 신청하셨습니다.");
				} else if (slotRes.status === 403) {
					setError("권한이 없습니다.");
				} else if (slotRes.status === 401) {
					setError("로그인이 필요합니다. 다시 로그인해주세요.");
				} else if (slotRes.status === 404) {
					setError("해당 랩실을 찾을 수 없습니다.");
				} else if (slotRes.status === 400) {
					// 400이면 슬롯 예약 불가/검증 실패 → 레거시로 폴백 시도 (슬롯 시작시간 사용)
					dlog("slot-based 400 → fallback to legacy with slot startTime");
					await tryLegacyWithTime(selectedSlotStart, end);
					return;
				} else {
					setError(sMsg);
				}
			} catch (err) {
				const status = err?.response?.status;
				const msg = err?.response?.data?.message;
				if (status === 401)
					setError("로그인이 필요합니다. 다시 로그인해주세요.");
				else if (status === 403) setError("권한이 없습니다.");
				else if (status === 404) setError("해당 랩실을 찾을 수 없습니다.");
				else if (status === 409) setError("이미 해당 랩실에 신청하셨습니다.");
				else setError(msg || "알 수 없는 오류가 발생했습니다.");
				derror(
					"[JoinLab] slot-based submit error:",
					status,
					err?.response?.data || err
				);
			} finally {
				setSubmitting(false);
			}
			end();
			return;
		}

		// 2) 슬롯을 못 고르는 경우 → 레거시로 직접 시간 사용
		const picked = manualTime || selectedSlotStart; // selectedSlotStart가 있을 수 있으니 백업
		if (!picked) {
			setError("면접 시간을 직접 입력하세요.");
			end();
			return;
		}
		setSubmitting(true);
		try {
			await tryLegacyWithTime(picked, end);
		} finally {
			setSubmitting(false);
		}
	};

	// 레거시 호출 공통 함수
	const tryLegacyWithTime = async (timeString, endGroup) => {
		const payloadTime = toLocalSeconds(timeString); // "YYYY-MM-DDTHH:mm:SS"
		const now = new Date();
		const t = new Date(payloadTime);
		if (!(t > now)) {
			setError("면접 시간은 미래 시점이어야 합니다.");
			endGroup?.();
			return;
		}

		const res = await api.post(
			`/api/labs/${labId}/applications`,
			{ interviewTime: payloadTime },
			{
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				validateStatus: () => true,
			}
		);
		dlog("legacy →", res?.status, res?.data);

		if (res.status === 201 || res?.data?.success === true) {
			setSuccess(true);
			endGroup?.();
			return;
		}

		const msg = res?.data?.message || "요청에 실패했습니다.";
		if (res.status === 400) {
			// 레거시 금지 랩실 안내
			if (
				String(msg).includes("/slot-based") ||
				String(msg).includes("면접 시스템")
			) {
				setError(
					`${msg}\n※ 이 랩실은 슬롯 기반 신청만 허용합니다. 슬롯 예약 페이지로 이동해 주세요.`
				);
			} else {
				setError(msg);
			}
		} else if (res.status === 404) setError("해당 랩실을 찾을 수 없습니다.");
		else if (res.status === 409) setError("이미 해당 랩실에 신청하셨습니다.");
		else if (res.status === 401)
			setError("로그인이 필요합니다. 다시 로그인해주세요.");
		else if (res.status === 403) setError("권한이 없습니다.");
		else setError(msg);
		endGroup?.();
	};

	if (success) {
		return (
			<div className="joinlab-root">
				<div className="joinlab-success">
					가입 신청이 완료되었습니다!
					<br />
					승인 후 랩실에 참여하실 수 있습니다.
					<br />
					잠시 후 홈으로 이동합니다.
				</div>
			</div>
		);
	}

	return (
		<div className="joinlab-root">
			<h2 className="joinlab-title">랩실 가입 신청</h2>

			{/* 1) 날짜 */}
			<div className="joinlab-field">
				<label htmlFor="date">면접 날짜</label>
				<input
					id="date"
					name="date"
					type="date"
					value={selectedDate}
					onChange={(e) => setSelectedDate(e.target.value)}
					disabled={intLoading || submitting}
					required
				/>
				<small className="joinlab-help">
					날짜를 선택하면 해당 날짜에 진행 중인 면접만 표시됩니다.
				</small>
			</div>

			{/* 2) 면접 선택 */}
			<div className="joinlab-field">
				<label htmlFor="interview">면접 선택</label>
				{intLoading ? (
					<div className="joinlab-help">면접 목록을 불러오는 중…</div>
				) : intError ? (
					<div className="joinlab-error">{intError}</div>
				) : !selectedDate ? (
					<div className="joinlab-help">먼저 날짜를 선택하세요.</div>
				) : interviewsOnDate.length === 0 ? (
					<div className="joinlab-error">
						선택한 날짜에 진행되는 면접이 없습니다.
					</div>
				) : (
					<>
						<select
							id="interview"
							name="interview"
							value={selectedInterviewId}
							onChange={(e) => {
								setSelectedInterviewId(e.target.value);
								setSlots([]);
								setSelectedSlotId("");
								setManualTime("");
							}}
							disabled={slotsLoading || submitting}
							required
						>
							{interviewsOnDate.map((it) => (
								<option key={it.id} value={it.id}>
									#{it.id} • {it.startDate} ~ {it.endDate}
									{it.status ? ` • ${String(it.status).toUpperCase()}` : ""}
								</option>
							))}
						</select>
						<small className="joinlab-help">
							면접을 선택하면 해당 면접의 슬롯을 불러옵니다.
						</small>
					</>
				)}
			</div>

			{/* 3) 슬롯 안내 */}
			<div className="joinlab-help" style={{ marginBottom: 12 }}>
				{!selectedDate
					? ""
					: !selectedInterviewId
					? "면접을 선택하면 슬롯을 확인할 수 있습니다."
					: slotsLoading
					? "슬롯을 불러오는 중…"
					: slots.length > 0
					? "가능하면 슬롯을 선택해 제출하세요. 실패 시 레거시 방식으로 자동 전환됩니다."
					: "해당 날짜에 예약 가능한 슬롯이 없습니다. 아래에서 시간을 직접 입력해 신청할 수 있습니다."}
			</div>

			{/* 4) 슬롯 선택 + 신청 */}
			<form className="joinlab-form" onSubmit={handleSubmit}>
				<div className="joinlab-field">
					<label htmlFor="slotId">예약 가능한 슬롯</label>
					<select
						id="slotId"
						name="slotId"
						value={selectedSlotId}
						onChange={(e) => setSelectedSlotId(e.target.value)}
						disabled={
							submitting ||
							slotsLoading ||
							!selectedDate ||
							!selectedInterviewId ||
							slots.length === 0
						}
					>
						{slots.length > 0 ? (
							slots.map((s) => {
								const start = new Date(s.startTime);
								const end = new Date(s.endTime);
								const disabled = !s?.isAvailable || s?.isFull || s?.isPast;
								const reason = s?.isPast
									? "지난 슬롯"
									: s?.isFull
									? "마감"
									: !s?.isAvailable
									? "비활성"
									: "";
								const label = `${start.toLocaleTimeString("ko-KR", {
									hour: "2-digit",
									minute: "2-digit",
								})} ~ ${end.toLocaleTimeString("ko-KR", {
									hour: "2-digit",
									minute: "2-digit",
								})} ${
									reason ? `(${reason})` : `(잔여 ${s?.availableSpots ?? 0}명)`
								}`;
								return (
									<option key={s.id} value={s.id} disabled={disabled}>
										{label}
									</option>
								);
							})
						) : (
							<option value="">선택 가능한 슬롯이 없습니다</option>
						)}
					</select>
					<small className="joinlab-help">
						선택 가능한 슬롯이면 슬롯 기반으로 먼저 신청합니다.
					</small>
				</div>

				{/* 5) 레거시: 시간 직접 입력 (항상 보이게, 제출 중에만 disabled) */}
				<div className="joinlab-field">
					<label htmlFor="manualTime">면접 시간 직접 입력(레거시)</label>
					<input
						id="manualTime"
						type="datetime-local"
						value={manualTime}
						onChange={(e) => setManualTime(e.target.value)}
						disabled={submitting} // 제출 중일 때만 막기
					/>
					<small className="joinlab-help">
						슬롯이 없거나 모두 지난 경우, 직접 시간을 입력해 레거시 방식으로
						신청할 수 있습니다.
					</small>
				</div>

				{error && (
					<div className="joinlab-error" style={{ whiteSpace: "pre-line" }}>
						{error}
					</div>
				)}

				<button
					className="joinlab-btn"
					type="submit"
					disabled={
						submitting ||
						slotsLoading ||
						!selectedDate ||
						!selectedInterviewId ||
						// 선택 가능한 슬롯을 골랐거나, 직접 입력 시간이 있어야 제출 가능
						!(
							(selectedSlotId &&
								slots.find((s) => String(s.id) === String(selectedSlotId)) &&
								(() => {
									const s = slots.find(
										(x) => String(x.id) === String(selectedSlotId)
									);
									return s && s.isAvailable && !s.isFull && !s.isPast;
								})()) ||
							manualTime
						)
					}
				>
					{submitting ? "신청 중..." : "가입 신청"}
				</button>
			</form>

			{/* Debug */}
			<DebugPanel
				state={{
					params: { labId, interviewIdParam, interviewIdQuery },
					counts: {
						interviews: interviews.length,
						interviewsOnDate: interviewsOnDate.length,
						slots: slots.length,
					},
					selectedDate,
					selectedInterviewId,
					selectedSlotId,
					selectedSlotStart,
					manualTime,
					intLoading,
					slotsLoading,
					submitting,
					error,
					success,
					sampleInterviewsOnDate: interviewsOnDate.slice(0, 3),
					sampleSlots: slots.slice(0, 5),
				}}
			/>
		</div>
	);
}

// src/pages/JoinLab.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import "../styles/JoinLab.css";

/* ===== 공통 유틸 ===== */
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
/** 날짜만 비교하도록(YYYY-MM-DD) */
function inRange(dateStr, startDate, endDate) {
	if (!dateStr || !startDate || !endDate) return false;
	const s = String(startDate).slice(0, 10);
	const e = String(endDate).slice(0, 10);
	return s <= dateStr && dateStr <= e;
}

/* ===== API 응답 메시지 표준화 ===== */
function mapError(status, dataMsg, fallback = "요청에 실패했습니다.") {
	const msg = dataMsg || fallback;
	if (status === 401) return "로그인이 필요합니다. 다시 로그인해주세요.";
	if (status === 403) return "권한이 없습니다.";
	if (status === 404) return "해당 랩실을 찾을 수 없습니다.";
	if (status === 409) return "이미 해당 랩실에 신청하셨습니다.";
	return msg;
}

/* ===== 페이지 ===== */
export default function JoinLab() {
	const { id, labId: id2, interviewId: interviewIdParam } = useParams();
	const location = useLocation();
	const qs = new URLSearchParams(location.search);
	const interviewIdQuery = qs.get("interviewId");
	const labId = id ?? id2;

	const navigate = useNavigate();

	/* 인터뷰/슬롯 조회 상태 */
	const [intLoading, setIntLoading] = useState(false);
	const [intError, setIntError] = useState("");
	const [interviews, setInterviews] = useState([]);

	const [selectedDate, setSelectedDate] = useState("");
	const [interviewsOnDate, setInterviewsOnDate] = useState([]);
	const [selectedInterviewId, setSelectedInterviewId] = useState("");

	const [slotsLoading, setSlotsLoading] = useState(false);
	const [slots, setSlots] = useState([]);
	const [selectedSlotId, setSelectedSlotId] = useState("");

	/* 제출 상태 (슬롯/레거시 분리) */
	const [slotSubmitting, setSlotSubmitting] = useState(false);
	const [legacySubmitting, setLegacySubmitting] = useState(false);
	const [success, setSuccess] = useState(false);

	/* 에러 상태 (분리) */
	const [slotError, setSlotError] = useState("");
	const [legacyError, setLegacyError] = useState("");

	/* 레거시 입력 */
	const [manualTime, setManualTime] = useState("");

	/* 성공 시 홈으로 이동 */
	useEffect(() => {
		if (success) {
			const t = setTimeout(() => navigate("/home"), 1200);
			return () => clearTimeout(t);
		}
	}, [success, navigate]);

	/* 1) 면접 목록 조회 */
	useEffect(() => {
		if (!labId) return;
		(async () => {
			setIntLoading(true);
			setIntError("");
			try {
				const res = await api.get(`/api/labs/${labId}/interviews`, {
					headers: { Accept: "*/*" },
					validateStatus: () => true,
				});
				if (res.status === 200) {
					const list = Array.isArray(res?.data?.data) ? res.data.data : [];
					list.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
					setInterviews(list);

					// 외부에서 기본 인터뷰 지정이 들어온 경우
					const prefer = interviewIdParam ?? interviewIdQuery;
					if (prefer && list.some((it) => String(it.id) === String(prefer))) {
						setSelectedInterviewId(String(prefer));
					}
				} else {
					setIntError(res?.data?.message || "면접 목록을 불러오지 못했습니다.");
					setInterviews([]);
				}
			} catch (e) {
				setIntError("면접 목록 조회 중 오류가 발생했습니다.");
				setInterviews([]);
			} finally {
				setIntLoading(false);
			}
		})();
	}, [labId, interviewIdParam, interviewIdQuery]);

	/* 2-a) 날짜 변경 시 해당 날짜 면접만 보기 */
	useEffect(() => {
		if (!selectedDate || interviews.length === 0) {
			setInterviewsOnDate([]);
			setSelectedInterviewId("");
			setSlots([]);
			setSelectedSlotId("");
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
		}
	}, [selectedDate, interviews]); // selectedInterviewId는 의도적으로 제외

	/* 2-b) 인터뷰 선택/날짜 변경 시 슬롯 조회 */
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
			setSlots([]);
			setSelectedSlotId("");
			return;
		}

		(async () => {
			setSlotsLoading(true);
			setSlotError("");
			try {
				const url = `/api/labs/${labId}/interviews/${selectedInterviewId}/slots`;
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
					setSlots([]);
					setSelectedSlotId("");
					setSlotError(res?.data?.message || "슬롯을 불러오지 못했습니다.");
				}
			} catch (e) {
				setSlots([]);
				setSelectedSlotId("");
				setSlotError("슬롯 조회 중 오류가 발생했습니다.");
			} finally {
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

	/* ===== 슬롯 기반 제출 (완전 분리) ===== */
	const handleSubmitSlot = async (e) => {
		e.preventDefault();
		setSlotError("");

		// 최소 입력 검증
		if (!selectedDate) return setSlotError("면접 날짜를 선택하세요.");
		if (!selectedInterviewId) return setSlotError("면접을 선택하세요.");
		const chosen = slots.find((s) => String(s.id) === String(selectedSlotId));
		if (!chosen) return setSlotError("예약 가능한 슬롯을 선택하세요.");
		if (chosen.isPast || !chosen.isAvailable || chosen.isFull) {
			return setSlotError("선택한 슬롯은 신청할 수 없습니다.");
		}

		try {
			setSlotSubmitting(true);
			const res = await api.post(
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
			if (res.status === 201) {
				setSuccess(true);
			} else {
				setSlotError(mapError(res.status, res?.data?.message));
				// 슬롯 불가(400)인 경우 안내를 덧붙임
				if (res.status === 400 && selectedSlotStart) {
					setSlotError(
						(res?.data?.message || "슬롯 예약이 불가합니다.") +
							"\n※ 필요시 아래 레거시 신청으로 시간 직접 입력을 시도하세요."
					);
				}
			}
		} catch (e) {
			setSlotError("네트워크 오류가 발생했습니다.");
		} finally {
			setSlotSubmitting(false);
		}
	};

	/* ===== 레거시(시간 직접) 제출 (완전 분리) ===== */
	const handleSubmitLegacy = async (e) => {
		e.preventDefault();
		setLegacyError("");

		if (!manualTime) return setLegacyError("면접 시간을 입력하세요.");
		const payloadTime = toLocalSeconds(manualTime);
		const t = new Date(payloadTime);
		if (!(t > new Date())) {
			return setLegacyError("면접 시간은 미래 시점이어야 합니다.");
		}

		try {
			setLegacySubmitting(true);
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

			if (res.status === 201 || res?.data?.success === true) {
				setSuccess(true);
			} else if (res.status === 400) {
				// 스펙: 면접 시스템 사용 랩실이면 /slot-based 안내 메시지
				const msg = res?.data?.message || "입력 검증에 실패했습니다.";
				if (
					String(msg).includes("/slot-based") ||
					String(msg).includes("면접 시스템")
				) {
					setLegacyError(
						`${msg}\n※ 위의 슬롯 기반 신청 섹션에서 예약을 진행해주세요.`
					);
				} else {
					setLegacyError(msg);
				}
			} else {
				setLegacyError(mapError(res.status, res?.data?.message));
			}
		} catch (e) {
			setLegacyError("네트워크 오류가 발생했습니다.");
		} finally {
			setLegacySubmitting(false);
		}
	};

	/* ===== 성공 화면 ===== */
	if (success) {
		return (
			<div className="joinlab-root">
				<div className="joinlab-success">
					가입 신청이 완료되었습니다!
					<br />
					승인 후 랩실에 참여하실 수 있습니다.
				</div>
			</div>
		);
	}

	return (
		<div className="joinlab-root">
			<h2 className="joinlab-title">랩실 가입 신청</h2>

			{/* ===== 슬롯 기반 신청 섹션 ===== */}
			<section className="joinlab-section">
				<h3 className="joinlab-subtitle">1) 슬롯 기반 신청 (권장)</h3>

				{/* 날짜 */}
				<div className="joinlab-field">
					<label htmlFor="date">면접 날짜</label>
					<input
						id="date"
						name="date"
						type="date"
						value={selectedDate}
						onChange={(e) => setSelectedDate(e.target.value)}
						disabled={intLoading || slotsLoading || slotSubmitting}
					/>
					<small className="joinlab-help">
						날짜를 선택하면 해당 날짜에 가능한 면접만 표시됩니다.
					</small>
				</div>

				{/* 면접 선택 */}
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
								}}
								disabled={slotsLoading || slotSubmitting}
							>
								<option value="">면접을 선택하세요</option>
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

				{/* 슬롯 선택 */}
				<div className="joinlab-field">
					<label htmlFor="slotId">예약 가능한 슬롯</label>
					<select
						id="slotId"
						name="slotId"
						value={selectedSlotId}
						onChange={(e) => setSelectedSlotId(e.target.value)}
						disabled={
							slotSubmitting ||
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
						가능하면 슬롯을 선택해 신청하세요. (신규 면접 시스템)
					</small>
				</div>

				{/* 에러 & 제출 */}
				{slotError && (
					<div className="joinlab-error" style={{ whiteSpace: "pre-line" }}>
						{slotError}
					</div>
				)}
				<form onSubmit={handleSubmitSlot}>
					<button
						className="joinlab-btn"
						type="submit"
						disabled={slotSubmitting}
					>
						{slotSubmitting ? "신청 중..." : "슬롯 기반으로 신청"}
					</button>
				</form>
			</section>

			{/* ===== 구분선 ===== */}
			<hr className="joinlab-divider" />

			{/* ===== 레거시(시간 직접) 신청 섹션 ===== */}
			<section className="joinlab-section">
				<h3 className="joinlab-subtitle">2) 레거시 신청 (시간 직접 입력)</h3>

				<div className="joinlab-field">
					<label htmlFor="manualTime">면접 시간</label>
					<input
						id="manualTime"
						type="datetime-local"
						value={manualTime}
						onChange={(e) => setManualTime(e.target.value)}
						disabled={legacySubmitting}
					/>
					<small className="joinlab-help">
						미래 시점으로 입력해야 하며, 일부 랩실은 슬롯 기반 신청만 허용할 수
						있습니다.
					</small>
				</div>

				{legacyError && (
					<div className="joinlab-error" style={{ whiteSpace: "pre-line" }}>
						{legacyError}
					</div>
				)}

				<form onSubmit={handleSubmitLegacy}>
					<button
						className="joinlab-btn"
						type="submit"
						disabled={legacySubmitting}
					>
						{legacySubmitting ? "신청 중..." : "레거시로 신청"}
					</button>
				</form>
			</section>
		</div>
	);
}

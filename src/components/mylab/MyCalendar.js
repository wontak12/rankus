import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import { useCallback, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";
import "../../styles/Calendar.css";
import "../../styles/Interview.css";

/* ===== 날짜/표시 유틸 ===== */
function fmtDate(v) {
	if (!v) return "(시간 없음)";
	const d = new Date(v);
	if (isNaN(d)) return "(잘못된 시간)";
	return d.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

function todayStr() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/* ===== 디버그 유틸 ===== */
const DEBUG_INT = true;
function shortToken(t, n = 16) {
	return t && t.length > n ? t.substring(0, n) + "..." : t || "(없음)";
}

function MyCalendar() {
	console.log("--- [1] MyCalendar 컴포넌트 렌더링 ---");
	const { labId } = useParams();
	const [events, setEvents] = useState([]);
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [scheduleList, setScheduleList] = useState([]);

	// Interview 관련 상태
	const [interviews, setInterviews] = useState([]);
	const [interviewLoading, setInterviewLoading] = useState(true);
	const [interviewErrMsg, setInterviewErrMsg] = useState("");

	// 면접 생성 폼 상태
	const [createOpen, setCreateOpen] = useState(false);
	const [creating, setCreating] = useState(false);
	const [createErr, setCreateErr] = useState("");
	const [fieldErrs, setFieldErrs] = useState({});
	const [createMsg, setCreateMsg] = useState("");
	const [form, setForm] = useState({
		date: todayStr(),
		durationMinutes: 30,
		maxApplicantsPerSlot: 1,
	});

	// 슬롯 관리 상태
	const [selectedInterview, setSelectedInterview] = useState(null);

	// 면접 목록 불러오기
	const fetchInterviews = async (id) => {
		if (!id) return;
		
		if (DEBUG_INT) {
			const at = localStorage.getItem("accessToken");
			console.groupCollapsed(
				"%c[Interview] GET list",
				"color:#09f;font-weight:bold"
			);
			console.log("Authorization(short):", shortToken(at));
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
			
			const sorted = [...listRaw].sort(
				(a, b) => new Date(a.startDate) - new Date(b.startDate)
			);
			setInterviews(sorted);
			setInterviewErrMsg("");
		} catch (err) {
			console.error(
				"[Interview] GET /api/labs/{labId}/interviews failed:",
				err?.response?.status,
				err?.response?.data || err
			);
			setInterviewErrMsg("면접 일정 목록을 불러오지 못했습니다.");
			setInterviews([]);
		} finally {
			setInterviewLoading(false);
		}
	};

	// 면접 생성 핸들러
	const handleCreateInterview = async (e) => {
		e.preventDefault();
		if (!labId) return;

		setCreateErr("");
		setFieldErrs({});
		setCreateMsg("");

		const payload = {
			startDate: form.date?.trim(),
			endDate: form.date?.trim(),
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
					setInterviews((prev) =>
						[...prev, created].sort(
							(a, b) => new Date(a.startDate) - new Date(b.startDate)
						)
					);
				} else {
					await fetchInterviews(labId);
				}
				// 달력도 새로고침
				await handleDatesSet({ 
					startStr: events[0]?.start?.substring(0, 10) || todayStr(),
					endStr: events[events.length-1]?.end?.substring(0, 10) || todayStr()
				});
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

	const handleDatesSet = useCallback(
		async (dateInfo) => {
			const startDate = dateInfo.startStr.substring(0, 10);
			const endDate = dateInfo.endStr.substring(0, 10);

			console.group(`--- [2] handleDatesSet 실행 (일정 목록 조회) ---`);
			console.log(`요청 기간: ${startDate} ~ ${endDate}`);
			console.log(`대상 랩 ID: ${labId}`);

			try {
				const response = await api.get(
					`/api/labs/${labId}/calendar/interviews`,
					{ params: { startDate, endDate } }
				);
				console.log("서버 원본 응답:", response);

				const interviewSchedules = Array.isArray(response.data.data)
					? response.data.data
					: [];
				console.log("추출된 일정 데이터:", interviewSchedules);
				setScheduleList(interviewSchedules);

				const formattedEvents = interviewSchedules.map((schedule) => ({
					id: schedule.interviewId,
					title: schedule.title || "(제목 없음)",
					start: `${schedule.eventDate}T${schedule.startTime}`,
					end: `${schedule.eventDate}T${schedule.endTime}`,
				}));
				console.log("달력 형식으로 변환된 데이터:", formattedEvents);
				setEvents(formattedEvents);
			} catch (error) {
				console.error("💥 일정 목록 조회 중 에러:", error);
				setScheduleList([]);
				setEvents([]);
			} finally {
				console.groupEnd();
				console.log("--- handleDatesSet 종료 ---");
			}
		},
		[labId]
	);

	const handleEventClick = async (clickInfo) => {
		const interviewId = clickInfo.event.id;

		console.group(`--- [3] handleEventClick 실행 (상세 정보 조회) ---`);
		console.log(`클릭된 이벤트 ID (interviewId): ${interviewId}`);

		try {
			const response = await api.get(
				`/api/labs/${labId}/calendar/interviews/by-interview/${interviewId}`
			);
			console.log("상세 정보 서버 원본 응답:", response);
			console.log("추출된 상세 데이터:", response.data.data);
			setSelectedEvent(response.data.data);
		} catch (error) {
			console.error("💥 상세 정보 조회 중 에러:", error);
			alert("상세 정보를 불러오지 못했습니다.");
		} finally {
			console.groupEnd();
			console.log("--- handleEventClick 종료 ---");
		}
	};

	// 컴포넌트 마운트 시 면접 목록 로드
	useEffect(() => {
		let mounted = true;
		if (!labId) {
			setInterviewErrMsg("랩실 ID가 없습니다.");
			setInterviewLoading(false);
			return;
		}
		(async () => {
			await fetchInterviews(labId);
			if (!mounted) return;
		})();
		return () => {
			mounted = false;
		};
	}, [labId]);

	const displayTime = (timeStr) => (timeStr ? timeStr.substring(0, 5) : "");

	return (
		<div className="calendar-container">
			

			{/* 달력 섹션 */}
			<div className="calendar-card">
				<div className="calendar-header">
					<h1 className="calendar-title">📅 면접 달력</h1>
				</div>
				
				<FullCalendar
					plugins={[dayGridPlugin]}
					initialView="dayGridMonth"
					events={events}
					datesSet={handleDatesSet}
					eventClick={handleEventClick}
					eventDisplay="block"
					height="auto"
					headerToolbar={{
						left: 'prev,next today',
						center: 'title',
						right: 'dayGridMonth'
					}}
				/>
			</div>

			{/* 면접 생성 섹션 */}
			<div className="calendar-card">
				<div className="interview-header-row">
					<h2 className="calendar-title">📅 면접 일정 관리</h2>
					<button
						className="mylab-interview-btn interview-create-toggle"
						onClick={() => setCreateOpen((v) => !v)}
					>
						{createOpen ? "면접 일정 생성 닫기" : "면접 일정 생성"}
					</button>
					<button
						className="mylab-interview-btn interview-refresh"
						onClick={() => fetchInterviews(labId)}
					>
						새로고침
					</button>
				</div>

				{/* 면접 생성 폼 */}
				{createOpen && (
					<form onSubmit={handleCreateInterview} className="interview-create-form">
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
										setForm((f) => ({ 
											...f, 
											durationMinutes: Number(e.target.value) 
										}))
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
								<label>면접당 최대 인원</label>
								<input
									type="number"
									min="1"
									step="1"
									value={form.maxApplicantsPerSlot}
									onChange={(e) =>
										setForm((f) => ({ 
											...f, 
											maxApplicantsPerSlot: Number(e.target.value) 
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
			</div>

			<div className="calendar-card">
				<h2 className="calendar-subtitle">📋 현재 월의 일정 목록</h2>
				{scheduleList.length > 0 ? (
					<ul className="calendar-schedule-list">
						{scheduleList.map((schedule) => (
							<li
								key={schedule.id}
								className="calendar-schedule-item"
								onClick={() => {
									// 일정 항목 클릭 시 상세 정보 조회
									handleEventClick({ event: { id: schedule.interviewId } });
								}}
							>
								<div className="calendar-schedule-title">
									{schedule.title || "(제목 없음)"}
								</div>
								<div className="calendar-schedule-meta">
									<div className="calendar-schedule-date">
										<span>📅</span>
										<span>{schedule.eventDate}</span>
									</div>
									<div className="calendar-schedule-time">
										<span>🕒</span>
										<span>
											{displayTime(schedule.startTime)} ~ {displayTime(schedule.endTime)}
										</span>
									</div>
								</div>
							</li>
						))}
					</ul>
				) : (
					<div className="calendar-empty-state">
						<div className="calendar-empty-icon">📅</div>
						<div className="calendar-empty-message">현재 월에 예정된 면접 일정이 없습니다</div>
						<div className="calendar-empty-description">
							새로운 면접 일정을 추가해보세요
						</div>
					</div>
				)}
			</div>

			{/* 면접 목록 섹션 */}
			<div className="calendar-card">
				<h2 className="calendar-subtitle">📋 등록된 면접 목록</h2>
				{interviewLoading ? (
					<div className="interview-loading">면접 목록을 불러오는 중...</div>
				) : interviewErrMsg ? (
					<div className="interview-error">{interviewErrMsg}</div>
				) : interviews.length === 0 ? (
					<div>등록된 면접 일정이 없습니다.</div>
				) : (
					<ul className="interview-list">
						{interviews.map((it) => (
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

								{/* 슬롯 관리 버튼 */}
								<div style={{ marginTop: 12 }}>
									<button
										className="mylab-interview-btn"
										onClick={() => setSelectedInterview(it)}
									>
										슬롯 관리
									</button>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>

			{selectedEvent && (
				<div
					className="calendar-modal-overlay"
					onClick={() => {
						console.log("--- [4] 팝업 닫기 ---");
						setSelectedEvent(null);
					}}
				>
					<div
						className="calendar-modal"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="calendar-modal-header">
							<h2 className="calendar-modal-title">📋 일정 상세 정보</h2>
						</div>
						
						<div className="calendar-modal-content">
							<div className="calendar-modal-info-grid">
								<div className="calendar-modal-info-row">
									<span className="calendar-modal-label">제목</span>
									<span className="calendar-modal-value">
										{selectedEvent.title || "(제목 없음)"}
									</span>
								</div>
								
								<div className="calendar-modal-info-row">
									<span className="calendar-modal-label">설명</span>
									<span className="calendar-modal-value">
										{selectedEvent.description || "내용 없음"}
									</span>
								</div>
								
								<div className="calendar-modal-info-row">
									<span className="calendar-modal-label">날짜</span>
									<span className="calendar-modal-value">
										📅 {selectedEvent.eventDate}
									</span>
								</div>
								
								<div className="calendar-modal-info-row">
									<span className="calendar-modal-label">시간</span>
									<span className="calendar-modal-value">
										🕒 {displayTime(selectedEvent.startTime)} ~ {displayTime(selectedEvent.endTime)}
									</span>
								</div>
							</div>
						</div>
						
						<div className="calendar-modal-footer">
							<button
								className="calendar-btn calendar-btn-outline"
								onClick={() => {
									console.log("--- [4] 팝업 닫기 ---");
									setSelectedEvent(null);
								}}
							>
								닫기
							</button>
						</div>
					</div>
				</div>
			)}

			{/* 슬롯 관리 모달 */}
			{selectedInterview && (
				<SlotsPanel
					labId={labId}
					interviewId={selectedInterview.id}
					interviewDate={selectedInterview.startDate}
					durationMinutes={selectedInterview.durationMinutes}
					onClose={() => setSelectedInterview(null)}
				/>
			)}
		</div>
	);
}

/* =========================
   면접별 슬롯 패널 (목록 + 생성)
   ========================= */
function SlotsPanel({ labId, interviewId, interviewDate, durationMinutes, onClose }) {
	const [open, setOpen] = useState(true);
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

	// UTC Z(+ms)로 변환
	function toUtcZ(dateTimeLocal) {
		if (!dateTimeLocal) return "";
		const d = new Date(dateTimeLocal);
		return d.toISOString();
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
	}, [open]);

	const handleCreateSlot = async (e) => {
		e.preventDefault();
		setCreateMsg("");
		setCreateErr("");
		setFieldErrs({});

		if (!interviewDate) {
			setCreateErr("면접 날짜가 필요합니다.");
			return;
		}
		if (!slotForm.startTime) {
			setCreateErr("시작 시간을 선택하세요.");
			return;
		}

		const startLocal = `${interviewDate}T${slotForm.startTime}`;
		const startMoment = new Date(startLocal);
		const endMoment = new Date(startMoment.getTime() + durationMinutes * 60000);

		// 같은 날짜 내에서만
		const endDateStr = endMoment.toISOString().substring(0, 10);
		if (endDateStr !== interviewDate) {
			setCreateErr(`면접은 면접 날짜(${interviewDate})를 벗어날 수 없습니다.`);
			return;
		}

		const payload = {
			startTime: toUtcZ(startLocal),
			endTime: toUtcZ(
				`${interviewDate}T${String(endMoment.getHours()).padStart(2, "0")}:${String(
					endMoment.getMinutes()
				).padStart(2, "0")}`
			),
		};

		if (DEBUG_INT) {
			console.groupCollapsed(
				`%c[Slots] POST /api/labs/${labId}/interviews/${interviewId}/slots`,
				"color:#0a0;font-weight:bold"
			);
			console.log("payload:", payload);
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

			if (res.status === 201 || res?.data?.success === true) {
				setCreateMsg("슬롯이 생성되었습니다.");
				await fetchSlots();
				setSlotForm({ startTime: "" });
				return;
			}

			const serverMsg = res?.data?.message || "요청이 거절되었습니다.";
			setCreateErr(serverMsg);
		} catch (err) {
			console.error("슬롯 생성 오류:", err);
			setCreateErr("요청 중 오류가 발생했습니다.");
		} finally {
			setCreating(false);
		}
	};

	if (!open) return null;

	return (
		<div className="calendar-modal-overlay" onClick={onClose}>
			<div className="calendar-modal slots-panel-modal" onClick={(e) => e.stopPropagation()}>
				<div className="calendar-modal-header">
					<h2 className="calendar-modal-title">
						🕒 면접 슬롯 관리 (면접 #{interviewId})
					</h2>
					<button 
						className="calendar-btn calendar-btn-outline"
						onClick={onClose}
					>
						닫기
					</button>
				</div>

				<div className="calendar-modal-content">
					{/* 슬롯 생성 폼 */}
					<form onSubmit={handleCreateSlot} className="interview-create-form">
						<div className="interview-create-grid">
							<div>
								<label>시작 시간</label>
								<input
									type="time"
									value={slotForm.startTime}
									onChange={(e) =>
										setSlotForm({ ...slotForm, startTime: e.target.value })
									}
									required
									disabled={creating}
								/>
								{fieldErrs.startTime && (
									<div className="interview-field-error">
										{fieldErrs.startTime}
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
								{creating ? "생성 중..." : "슬롯 생성하기"}
							</button>
						</div>
					</form>

					{/* 슬롯 목록 */}
					<div style={{ marginTop: 20 }}>
						<h3>등록된 슬롯</h3>
						{loading ? (
							<div>슬롯을 불러오는 중...</div>
						) : errMsg ? (
							<div>{errMsg}</div>
						) : items.length === 0 ? (
							<div>등록된 슬롯이 없습니다.</div>
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
											슬롯 #{s.id ?? idx}
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
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

export default MyCalendar;

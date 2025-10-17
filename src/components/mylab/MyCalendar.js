import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";
import "../../styles/Calendar.css";

function MyCalendar() {
	console.log("--- [1] MyCalendar 컴포넌트 렌더링 ---");
	const { labId } = useParams();
	const [events, setEvents] = useState([]);
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [scheduleList, setScheduleList] = useState([]);

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

	const displayTime = (timeStr) => (timeStr ? timeStr.substring(0, 5) : "");

	return (
		<div className="calendar-container">
			<div className="calendar-card">
				<div className="calendar-header">
					<h1 className="calendar-title">📅 면접 일정</h1>
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
		</div>
	);
}

export default MyCalendar;

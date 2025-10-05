import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

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
		<div style={{ padding: "20px" }}>
			<h1>면접 일정</h1>
			<FullCalendar
				plugins={[dayGridPlugin]}
				initialView="dayGridMonth"
				events={events}
				datesSet={handleDatesSet}
				eventClick={handleEventClick}
				eventDisplay="block"
			/>

			<div style={{ marginTop: "30px" }}>
				<h2>현재 월의 일정 목록</h2>
				{scheduleList.length > 0 ? (
					<ul style={{ listStyleType: "none", padding: 0 }}>
						{scheduleList.map((schedule) => (
							<li
								key={schedule.id}
								style={{
									border: "1px solid #eee",
									padding: "10px",
									marginBottom: "10px",
									borderRadius: "5px",
								}}
							>
								<strong>{schedule.title || "(제목 없음)"}</strong>
								<div style={{ fontSize: "0.9em", color: "#555" }}>
									<span>📅 {schedule.eventDate}</span>
									<span style={{ marginLeft: "15px" }}>
										🕒 {displayTime(schedule.startTime)} ~{" "}
										{displayTime(schedule.endTime)}
									</span>
								</div>
							</li>
						))}
					</ul>
				) : (
					<p>현재 월에 예정된 면접 일정이 없습니다.</p>
				)}
			</div>

			{selectedEvent && (
				<>
					<div
						style={{
							position: "fixed",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							backgroundColor: "rgba(0, 0, 0, 0.5)",
							zIndex: 99,
						}}
						onClick={() => {
							console.log("--- [4] 팝업 닫기 ---");
							setSelectedEvent(null);
						}}
					/>
					<div
						style={{
							position: "fixed",
							top: "50%",
							left: "50%",
							transform: "translate(-50%, -50%)",
							width: "90%",
							maxWidth: "500px",
							background: "white",
							padding: "20px",
							borderRadius: "10px",
							boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
							zIndex: 100,
						}}
					>
						<h2>일정 상세 정보</h2>
						<p>
							<strong>제목:</strong> {selectedEvent.title || "(제목 없음)"}
						</p>
						<p>
							<strong>설명:</strong> {selectedEvent.description || "내용 없음"}
						</p>
						<p>
							<strong>날짜:</strong> {selectedEvent.eventDate}
						</p>
						<p>
							<strong>시간:</strong>
							{` ${displayTime(selectedEvent.startTime)} ~ ${displayTime(
								selectedEvent.endTime
							)}`}
						</p>
						<button
							style={{
								marginTop: "10px",
								padding: "8px 15px",
								border: "none",
								borderRadius: "5px",
								cursor: "pointer",
							}}
							onClick={() => {
								console.log("--- [4] 팝업 닫기 ---");
								setSelectedEvent(null);
							}}
						>
							닫기
						</button>
					</div>
				</>
			)}
		</div>
	);
}

export default MyCalendar;

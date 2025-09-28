import { useCallback, useEffect, useState } from "react";
import api from "../../api";

function Schedule() {
	// --- 상태 관리 ---
	const [view, setView] = useState("list"); // 'list', 'create', 'detail', 'edit'
	const [schedules, setSchedules] = useState([]);
	const [selectedSchedule, setSelectedSchedule] = useState(null);
	const [labId, setLabId] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// 일정 생성/수정 폼 필드 상태
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [eventDate, setEventDate] = useState("");
	const [startTimeHour, setStartTimeHour] = useState("09");
	const [startTimeMinute, setStartTimeMinute] = useState("00");
	const [endTimeHour, setEndTimeHour] = useState("10");
	const [endTimeMinute, setEndTimeMinute] = useState("00");

	// ====================== 🕵️‍♂️ 디버깅 코드 섹션 🕵️‍♂️ ======================
	console.log(
		`%c[Render] Schedule 렌더링... (현재 뷰: ${view})`,
		"color: blue; font-weight: bold;"
	);

	useEffect(() => {
		console.log(
			"%c[State Update] 상태 변경됨:",
			"color: green; font-weight: bold;",
			{
				view,
				labId,
				schedulesCount: schedules.length,
				loading,
				isSubmitting,
				error,
				selectedSchedule: selectedSchedule
					? `ID: ${selectedSchedule.id}`
					: null,
			}
		);
	}, [view, labId, schedules, loading, isSubmitting, error, selectedSchedule]);
	// =================================================================

	// 현재 날짜를 기준으로 이번 달의 시작일과 마지막 일을 구합니다.
	const today = new Date();
	const year = today.getFullYear();
	const month = today.getMonth();
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);

	const formatDate = (date) => {
		const d = new Date(date);
		const y = d.getFullYear();
		const m = (d.getMonth() + 1).toString().padStart(2, "0");
		const day = d.getDate().toString().padStart(2, "0");
		return `${y}-${m}-${day}`;
	};

	const formattedStartDate = formatDate(firstDay);
	const formattedEndDate = formatDate(lastDay);

	// --- 데이터 Fetching ---
	useEffect(() => {
		const fetchUserLabId = async () => {
			console.log(
				"%c🔄 [Fetch] 사용자 labId 가져오기 시작...",
				"color: orange;"
			);
			try {
				const res = await api.get("/api/users/me");
				console.log(
					"%c✅ [API Response] /api/users/me 응답:",
					"color: #28a745;",
					res.data
				);
				const fetchedLabId = res.data?.data?.labId;
				if (fetchedLabId) {
					console.log(`- labId 설정: ${fetchedLabId}`);
					setLabId(fetchedLabId);
				} else {
					console.error("%c- 에러: 응답에 labId가 없습니다.", "color: red;");
					setError("소속된 랩실이 없습니다.");
					setLoading(false);
				}
			} catch (err) {
				console.error(
					"%c❌ [API Error] /api/users/me 요청 실패:",
					"color: red;",
					err
				);
				setError("사용자 정보를 가져오는 데 실패했습니다.");
				setLoading(false);
			}
		};
		fetchUserLabId();
	}, []);

	const fetchSchedules = useCallback(async () => {
		if (!labId) return;
		setLoading(true);
		console.log(
			`%c🔄 [Fetch] 일정 목록 조회 시작 (Lab: ${labId}, 기간: ${formattedStartDate} ~ ${formattedEndDate})`,
			"color: orange;"
		);
		try {
			const response = await api.get(`/api/labs/${labId}/calendar/schedules`, {
				params: {
					startDate: formattedStartDate,
					endDate: formattedEndDate,
				},
			});
			console.log(
				"%c✅ [API Response] 일정 목록 응답:",
				"color: #28a745;",
				response.data
			);
			setSchedules(response.data.data);
			setError(null);
		} catch (err) {
			console.error(
				"%c❌ [API Error] 일정 목록 불러오기 실패:",
				"color: red;",
				err
			);
			if (err.response?.status === 403) {
				setError("일정 조회 권한이 없습니다.");
			} else {
				setError("일정 목록을 불러오는 데 실패했습니다.");
			}
		} finally {
			setLoading(false);
		}
	}, [labId, formattedStartDate, formattedEndDate]);

	useEffect(() => {
		if (labId) {
			fetchSchedules();
		}
	}, [labId, fetchSchedules]);

	// 상세 일정 정보를 가져오는 함수
	const fetchScheduleDetail = async (eventId) => {
		setLoading(true);
		try {
			const response = await api.get(
				`/api/labs/${labId}/calendar/schedules/${eventId}`
			);
			console.log(
				"%c✅ [API Response] 일정 상세 정보 응답:",
				"color: #28a745;",
				response.data
			);
			setSelectedSchedule(response.data.data);
			setView("detail");
		} catch (err) {
			console.error(
				"%c❌ [API Error] 일정 상세 정보 불러오기 실패:",
				"color: red;",
				err
			);
			setError("상세 정보를 불러오는 데 실패했습니다.");
			alert("상세 일정을 불러오는 데 실패했습니다.");
		} finally {
			setLoading(false);
		}
	};

	const handleCreateSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		const newSchedule = {
			title: title,
			description: description,
			eventDate: eventDate,
			startTime: {
				hour: parseInt(startTimeHour),
				minute: parseInt(startTimeMinute),
				second: 0,
				nano: 0,
			},
			endTime: {
				hour: parseInt(endTimeHour),
				minute: parseInt(endTimeMinute),
				second: 0,
				nano: 0,
			},
		};
		console.log(`%c🔄 [Submit] 일정 생성 요청 시작...`, "color: orange;");
		console.log("✅ 서버로 보낼 데이터:", newSchedule);

		try {
			await api.post(`/api/labs/${labId}/calendar/schedules`, newSchedule);
			console.log("%c✅ [API Response] 일정 생성 성공", "color: #28a745;");
			alert("일정이 성공적으로 생성되었습니다.");
			setView("list");
			await fetchSchedules();
			setTitle("");
			setDescription("");
			setEventDate("");
			setStartTimeHour("09");
			setStartTimeMinute("00");
			setEndTimeHour("10");
			setEndTimeMinute("00");
		} catch (err) {
			console.error("%c❌ [API Error] 일정 생성 실패:", "color: red;", err);
			setError("일정 생성에 실패했습니다.");
			alert("일정 생성에 실패했습니다.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleEditSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		const updatedSchedule = {
			title: title,
			description: description,
			eventDate: eventDate,
			startTime: {
				hour: parseInt(startTimeHour),
				minute: parseInt(startTimeMinute),
				second: 0,
				nano: 0,
			},
			endTime: {
				hour: parseInt(endTimeHour),
				minute: parseInt(endTimeMinute),
				second: 0,
				nano: 0,
			},
		};
		const eventId = selectedSchedule.id;

		console.log(
			`%c🔄 [Submit] 일정 수정 요청 시작 (ID: ${eventId})...`,
			"color: orange;"
		);
		console.log("✅ 서버로 보낼 데이터:", updatedSchedule);

		try {
			await api.put(
				`/api/labs/${labId}/calendar/schedules/${eventId}`,
				updatedSchedule
			);
			console.log("%c✅ [API Response] 일정 수정 성공", "color: #28a745;");
			alert("일정이 성공적으로 수정되었습니다.");
			setView("list");
			setSelectedSchedule(null);
			await fetchSchedules();
		} catch (err) {
			console.error("%c❌ [API Error] 일정 수정 실패:", "color: red;", err);
			setError("일정 수정에 실패했습니다.");
			alert("일정 수정에 실패했습니다.");
		} finally {
			setIsSubmitting(false);
		}
	};

	// ✅ 삭제 기능 핸들러
	const handleDelete = async () => {
		if (
			!selectedSchedule ||
			!window.confirm("정말로 이 일정을 삭제하시겠습니까?")
		) {
			return;
		}

		console.log(
			`%c🔄 [Delete] 일정 삭제 요청 시작 (ID: ${selectedSchedule.id})...`,
			"color: orange;"
		);
		try {
			await api.delete(
				`/api/labs/${labId}/calendar/schedules/${selectedSchedule.id}`
			);
			console.log("%c✅ [API Response] 일정 삭제 성공", "color: #28a745;");
			alert("일정이 성공적으로 삭제되었습니다.");
			setView("list");
			setSelectedSchedule(null);
			await fetchSchedules();
		} catch (err) {
			console.error("%c❌ [API Error] 일정 삭제 실패:", "color: red;", err);
			if (err.response?.status === 403) {
				alert("일정 삭제 권한이 없습니다.");
			} else {
				alert("일정 삭제에 실패했습니다.");
			}
		}
	};

	const formattedTime = (time) => {
		if (!time) {
			return "시간 미정";
		}
		return `${String(time.hour).padStart(2, "0")}:${String(
			time.minute
		).padStart(2, "0")}`;
	};

	// --- 뷰 렌더링 함수 ---
	const renderListView = () => {
		console.log("🎨 [Render] 렌더링: 목록 뷰");
		return (
			<div>
				<div>
					<h2>📅 일반 일정</h2>
					<button onClick={() => setView("create")}>+ 새 일정</button>
				</div>
				{loading ? (
					<div>로딩 중...</div>
				) : error ? (
					<div>오류: {error}</div>
				) : schedules.length > 0 ? (
					<ul>
						{schedules.map((schedule) => (
							<li
								key={schedule.id}
								onClick={() => fetchScheduleDetail(schedule.id)}
							>
								<p>
									<strong>{schedule.title}</strong>
								</p>
								<p>
									{new Date(schedule.eventDate).toLocaleDateString()}
									{schedule.startTime &&
										` ${formattedTime(schedule.startTime)}`}
									{schedule.endTime && ` ~ ${formattedTime(schedule.endTime)}`}
								</p>
							</li>
						))}
					</ul>
				) : (
					<div>등록된 일정이 없습니다.</div>
				)}
			</div>
		);
	};

	const renderDetailView = () => {
		console.log("🎨 [Render] 렌더링: 상세 뷰");
		if (!selectedSchedule) {
			return <div>상세 일정을 찾을 수 없습니다.</div>;
		}

		const formattedStartTime = selectedSchedule.startTime
			? formattedTime(selectedSchedule.startTime)
			: "시간 미정";
		const formattedEndTime = selectedSchedule.endTime
			? formattedTime(selectedSchedule.endTime)
			: "시간 미정";

		return (
			<div>
				<button
					onClick={() => {
						console.log("🖱️ [Event] '목록으로' 클릭");
						setView("list");
						setSelectedSchedule(null);
					}}
				>
					← 목록으로
				</button>
				<button
					onClick={() => {
						console.log("🖱️ [Event] '수정하기' 클릭");
						setTitle(selectedSchedule.title);
						setDescription(selectedSchedule.description);
						setEventDate(selectedSchedule.eventDate);
						if (selectedSchedule.startTime) {
							setStartTimeHour(
								String(selectedSchedule.startTime.hour).padStart(2, "0")
							);
							setStartTimeMinute(
								String(selectedSchedule.startTime.minute).padStart(2, "0")
							);
						} else {
							setStartTimeHour("09");
							setStartTimeMinute("00");
						}
						if (selectedSchedule.endTime) {
							setEndTimeHour(
								String(selectedSchedule.endTime.hour).padStart(2, "0")
							);
							setEndTimeMinute(
								String(selectedSchedule.endTime.minute).padStart(2, "0")
							);
						} else {
							setEndTimeHour("10");
							setEndTimeMinute("00");
						}
						setView("edit");
					}}
				>
					수정하기
				</button>
				{/* ✅ 삭제 버튼 추가 */}
				<button onClick={handleDelete}>삭제하기</button>
				<h3>{selectedSchedule.title}</h3>
				<p>
					<strong>날짜:</strong> {selectedSchedule.eventDate}
				</p>
				<p>
					<strong>시간:</strong> {formattedStartTime} ~ {formattedEndTime}
				</p>
				<p>
					<strong>내용:</strong> {selectedSchedule.description}
				</p>
			</div>
		);
	};

	const renderCreateForm = () => {
		console.log("🎨 [Render] 렌더링: 생성 폼");
		const hours = Array.from({ length: 24 }, (_, i) =>
			i.toString().padStart(2, "0")
		);
		const minutes = Array.from({ length: 60 }, (_, i) =>
			i.toString().padStart(2, "0")
		);

		return (
			<div>
				<h3>새 일정 생성</h3>
				<form onSubmit={handleCreateSubmit}>
					<input
						type="text"
						name="title"
						placeholder="제목"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						required
					/>
					<textarea
						name="description"
						placeholder="내용"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						required
					></textarea>

					<div>
						<label>날짜:</label>
						<input
							type="date"
							value={eventDate}
							onChange={(e) => setEventDate(e.target.value)}
							required
						/>
					</div>
					<div>
						<label>시작 시간:</label>
						<select
							value={startTimeHour}
							onChange={(e) => setStartTimeHour(e.target.value)}
						>
							{hours.map((h) => (
								<option key={h} value={h}>
									{h}
								</option>
							))}
						</select>
						:
						<select
							value={startTimeMinute}
							onChange={(e) => setStartTimeMinute(e.target.value)}
						>
							{minutes.map((m) => (
								<option key={m} value={m}>
									{m}
								</option>
							))}
						</select>
					</div>
					<div>
						<label>종료 시간:</label>
						<select
							value={endTimeHour}
							onChange={(e) => setEndTimeHour(e.target.value)}
						>
							{hours.map((h) => (
								<option key={h} value={h}>
									{h}
								</option>
							))}
						</select>
						:
						<select
							value={endTimeMinute}
							onChange={(e) => setEndTimeMinute(e.target.value)}
						>
							{minutes.map((m) => (
								<option key={m} value={m}>
									{m}
								</option>
							))}
						</select>
					</div>

					<button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "생성 중..." : "생성하기"}
					</button>
					<button
						type="button"
						onClick={() => setView("list")}
						disabled={isSubmitting}
					>
						취소
					</button>
				</form>
			</div>
		);
	};

	const renderEditForm = () => {
		console.log("🎨 [Render] 렌더링: 수정 폼");
		const hours = Array.from({ length: 24 }, (_, i) =>
			i.toString().padStart(2, "0")
		);
		const minutes = Array.from({ length: 60 }, (_, i) =>
			i.toString().padStart(2, "0")
		);

		return (
			<div>
				<h3>일정 수정</h3>
				<form onSubmit={handleEditSubmit}>
					<input
						type="text"
						name="title"
						placeholder="제목"
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						required
					/>
					<textarea
						name="description"
						placeholder="내용"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						required
					></textarea>

					<div>
						<label>날짜:</label>
						<input
							type="date"
							value={eventDate}
							onChange={(e) => setEventDate(e.target.value)}
							required
						/>
					</div>
					<div>
						<label>시작 시간:</label>
						<select
							value={startTimeHour}
							onChange={(e) => setStartTimeHour(e.target.value)}
						>
							{hours.map((h) => (
								<option key={h} value={h}>
									{h}
								</option>
							))}
						</select>
						:
						<select
							value={startTimeMinute}
							onChange={(e) => setStartTimeMinute(e.target.value)}
						>
							{minutes.map((m) => (
								<option key={m} value={m}>
									{m}
								</option>
							))}
						</select>
					</div>
					<div>
						<label>종료 시간:</label>
						<select
							value={endTimeHour}
							onChange={(e) => setEndTimeHour(e.target.value)}
						>
							{hours.map((h) => (
								<option key={h} value={h}>
									{h}
								</option>
							))}
						</select>
						:
						<select
							value={endTimeMinute}
							onChange={(e) => setEndTimeMinute(e.target.value)}
						>
							{minutes.map((m) => (
								<option key={m} value={m}>
									{m}
								</option>
							))}
						</select>
					</div>

					<button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "수정 중..." : "수정하기"}
					</button>
					<button
						type="button"
						onClick={() => {
							setView("detail");
						}}
						disabled={isSubmitting}
					>
						취소
					</button>
				</form>
			</div>
		);
	};

	// --- 최종 렌더링 ---
	const renderContent = () => {
		switch (view) {
			case "detail":
				return renderDetailView();
			case "create":
				return renderCreateForm();
			case "edit":
				return renderEditForm();
			case "list":
			default:
				return renderListView();
		}
	};

	return <div>{renderContent()}</div>;
}

export default Schedule;

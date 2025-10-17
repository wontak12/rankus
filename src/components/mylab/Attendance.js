import { QRCodeSVG as QRCode } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import api from "../../api";
import "../../styles/Attendance.css";

function Attendance() {
	// --- 기존 코드 부분 (관리자 화면용) ---
	const { labId } = useParams();
	const [selectedSessionId, setSelectedSessionId] = useState(null);
	const [sessions, setSessions] = useState([]);
	const [listLoading, setListLoading] = useState(true);
	const [listError, setListError] = useState(null);
	const [title, setTitle] = useState("");
	const [qrMinutes, setQrMinutes] = useState(10);
	const [createLoading, setCreateLoading] = useState(false);
	const [createError, setCreateError] = useState(null);
	const [successMessage, setSuccessMessage] = useState("");
	const [sessionDetails, setSessionDetails] = useState(null);
	const [detailLoading, setDetailLoading] = useState(false);
	const [detailError, setDetailError] = useState(null);
	const [qrCodeData, setQrCodeData] = useState("");
	const [isQrLoading, setIsQrLoading] = useState(false);

	// --- 사용자 출석 처리용 코드 ---
	const location = useLocation();
	const queryParams = new URLSearchParams(location.search);
	const qrToken = queryParams.get("qt");

	const [attendLoading, setAttendLoading] = useState(true);
	const [attendError, setAttendError] = useState(null);
	const [attendSuccess, setAttendSuccess] = useState(null);

	// ==========================================================
	// ✨ 여기가 디버깅 코드가 추가된 useEffect 부분입니다.
	// ==========================================================
	useEffect(() => {
		if (!qrToken) return;

		const processAttendance = async () => {
			console.log("1. 출석 처리 로직을 시작합니다.");
			try {
				const accessToken = localStorage.getItem("accessToken");
				if (!accessToken) {
					console.log("2. 로그인이 되어있지 않아 로그인 페이지로 이동합니다.");
					const currentUrl = window.location.href;
					window.location.href = `/login?redirectUrl=${encodeURIComponent(
						currentUrl
					)}`;
					return;
				}
				console.log("2. 로그인 상태가 확인되었습니다.");

				const resolveResponse = await api.get(
					`/api/attendance/qr/resolve?token=${qrToken}`
				);
				console.log("3. QR 토큰 유효성 검사 완료:", resolveResponse.data);
				if (!resolveResponse.data?.data?.valid) {
					throw new Error(
						resolveResponse.data?.data?.reason || "유효하지 않은 QR 코드입니다."
					);
				}

				console.log("4. 최종 출석 체크 API를 호출합니다.");
				await api.post(
					"/api/attendance/check",
					{ token: qrToken },
					{
						headers: { Authorization: `Bearer ${accessToken}` },
					}
				);
				console.log("5. 출석 체크 API 호출 성공!");

				setAttendSuccess("✅ 출석 처리가 성공적으로 완료되었습니다!");

				console.log("6. Alert를 띄우기 직전입니다.");
				alert("출석 체크가 완료되었습니다.");
				console.log("7. Alert를 확인했습니다.");
			} catch (err) {
				const errorMessage =
					err.response?.data?.message ||
					err.message ||
					"알 수 없는 오류가 발생했습니다.";
				console.error("💥 출석 처리 중 에러 발생:", errorMessage);
				setAttendError(`오류: ${errorMessage}`);
			} finally {
				console.log("8. 모든 출석 로직을 마칩니다.");
				setAttendLoading(false);
			}
		};

		processAttendance();
	}, [qrToken]);

	// --- 기존 관리자 화면용 함수들 (이하 동일) ---
	const fetchData = useCallback(async () => {
		setListLoading(true);
		setListError(null);
		const token = localStorage.getItem("accessToken");
		try {
			const response = await api.get(`/api/labs/${labId}/attendance/sessions`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			setSessions(response.data.data || []);
		} catch (err) {
			setListError(
				err.response?.data?.message ||
					err.message ||
					"목록을 불러오는 데 실패했습니다."
			);
		} finally {
			setListLoading(false);
		}
	}, [labId]);

	useEffect(() => {
		if (qrToken) return;
		fetchData();
	}, [fetchData, qrToken]);

	useEffect(() => {
		if (qrToken || !selectedSessionId) return;
		const fetchDetails = async () => {
			setDetailLoading(true);
			setDetailError(null);
			setQrCodeData("");
			const token = localStorage.getItem("accessToken");
			try {
				const response = await api.get(
					`/api/labs/${labId}/attendance/sessions/${selectedSessionId}`,
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);
				setSessionDetails(response.data.data);
			} catch (err) {
				setDetailError("세션 상세 정보를 불러오는 데 실패했습니다.");
			} finally {
				setDetailLoading(false);
			}
		};
		fetchDetails();
	}, [selectedSessionId, labId, qrToken]);

	const handleCreateSubmit = async (e) => {
		e.preventDefault();
		const token = localStorage.getItem("accessToken");
		if (!title.trim() || qrMinutes < 1 || !token) {
			setCreateError("입력값을 확인해주세요.");
			return;
		}
		setCreateLoading(true);
		setCreateError(null);
		setSuccessMessage("");
		const requestBody = { title, qrValidityMinutes: parseInt(qrMinutes, 10) };
		try {
			const response = await api.post(
				`/api/labs/${labId}/attendance/sessions`,
				requestBody,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);
			if (response.status === 201) {
				setSuccessMessage("✅ 출석 세션이 성공적으로 생성되었습니다!");
				setTitle("");
				setQrMinutes(10);
				fetchData();
			}
		} catch (err) {
			setCreateError(err.response?.data?.message || err.message);
		} finally {
			setCreateLoading(false);
		}
	};

	const handleGenerateQr = async () => {
		setIsQrLoading(true);
		setDetailError(null);
		setQrCodeData("");
		const token = localStorage.getItem("accessToken");

		try {
			const response = await api.post(
				`/api/labs/${labId}/attendance/sessions/${selectedSessionId}/qr/secure`,
				{},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			const attendanceUrl = response.data?.data?.attendanceUrl;

			if (attendanceUrl) {
				setQrCodeData(attendanceUrl);
			} else {
				throw new Error("서버 응답에서 attendanceUrl을 찾을 수 없습니다.");
			}
		} catch (err) {
			const errorMessage =
				err.response?.data?.message || err.message || "알 수 없는 에러 발생";
			setDetailError(`QR 코드 생성 실패: ${errorMessage}`);
		} finally {
			setIsQrLoading(false);
		}
	};

	if (qrToken) {
		return (
			<div className="attendance-check-container">
				<div className="attendance-check-icon">✅</div>
				<h1 className="attendance-check-title">출석 체크</h1>
				{attendLoading && (
					<div className="attendance-loading">출석 정보를 확인하는 중입니다...</div>
				)}
				{attendError && (
					<div className="attendance-message attendance-message-error">
						{attendError}
					</div>
				)}
				{attendSuccess && (
					<div className="attendance-message attendance-message-success">
						{attendSuccess}
					</div>
				)}
			</div>
		);
	}

	const renderDetailView = () => {
		if (detailLoading) return (
			<div className="attendance-loading">세부 정보를 불러오는 중...</div>
		);
		if (!sessionDetails) return (
			<div className="attendance-empty-state">
				<div className="attendance-empty-icon">📋</div>
				<div className="attendance-empty-message">세션 정보를 찾을 수 없습니다.</div>
			</div>
		);
		
		return (
			<div className="attendance-card">
				<div className="attendance-header">
					<button 
						className="attendance-btn attendance-btn-outline"
						onClick={() => setSelectedSessionId(null)}
					>
						← 목록으로 돌아가기
					</button>
				</div>
				
				<h1 className="attendance-title">📋 세션 상세 정보</h1>
				
				<div className="attendance-card-small">
					<div className="attendance-form-grid">
						<div className="attendance-form-row">
							<div className="attendance-form-group">
								<span className="attendance-form-label">세션 제목</span>
								<span>{sessionDetails.title}</span>
							</div>
							<div className="attendance-form-group">
								<span className="attendance-form-label">상태</span>
								<span className={`attendance-status-badge ${
									sessionDetails.status === 'ACTIVE' ? 'attendance-status-active' :
									sessionDetails.status === 'COMPLETED' ? 'attendance-status-completed' :
									'attendance-status-inactive'
								}`}>
									{sessionDetails.status}
								</span>
							</div>
						</div>
						<div className="attendance-form-row">
							<div className="attendance-form-group">
								<span className="attendance-form-label">생성일</span>
								<span>{new Date(sessionDetails.createdAt).toLocaleString("ko-KR")}</span>
							</div>
							<div className="attendance-form-group">
								<span className="attendance-form-label">QR 유효시간</span>
								<span>{sessionDetails.qrValidityMinutes}분</span>
							</div>
						</div>
					</div>
				</div>

				<div className="attendance-qr-section">
					<h2 className="attendance-subtitle">QR 코드 생성</h2>
					<button
						className={`attendance-btn ${sessionDetails.status !== "ACTIVE" ? 'attendance-btn-secondary' : ''}`}
						onClick={handleGenerateQr}
						disabled={isQrLoading || sessionDetails.status !== "ACTIVE"}
					>
						{isQrLoading ? "⏳ 생성 중..." : "📱 QR 코드 생성하기"}
					</button>
					
					{detailError && (
						<div className="attendance-message attendance-message-error">
							{detailError}
						</div>
					)}
					
					{qrCodeData && (
						<div className="attendance-qr-container">
							<QRCode value={qrCodeData} size={256} />
							<div className="attendance-qr-info">
								<strong>QR 값:</strong> {qrCodeData}
							</div>
						</div>
					)}
				</div>
			</div>
		);
	};

	const renderListView = () => (
		<div className="attendance-card">
			<div className="attendance-header">
				<h1 className="attendance-title">📊 출석 관리</h1>
			</div>

			{/* 새 출석 세션 생성 폼 */}
			<div className="attendance-form">
				<h2 className="attendance-subtitle">새 출석 세션 생성</h2>
				<form onSubmit={handleCreateSubmit}>
					<div className="attendance-form-grid">
						<div className="attendance-form-row">
							<div className="attendance-form-group">
								<label htmlFor="title" className="attendance-form-label">
									세션 제목
								</label>
								<input
									id="title"
									type="text"
									className="attendance-form-input"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="예: 2025-10-16 정기 미팅"
									required
								/>
							</div>
							<div className="attendance-form-group">
								<label htmlFor="qrMinutes" className="attendance-form-label">
									QR 유효시간 (분)
								</label>
								<input
									id="qrMinutes"
									type="number"
									className="attendance-form-input"
									value={qrMinutes}
									onChange={(e) => setQrMinutes(e.target.value)}
									min="1"
									max="60"
									required
								/>
							</div>
						</div>
						<div className="attendance-form-row">
							<button 
								type="submit" 
								className="attendance-btn"
								disabled={createLoading}
							>
								{createLoading ? "⏳ 생성 중..." : "✨ 생성하기"}
							</button>
						</div>
					</div>
				</form>
				
				{successMessage && (
					<div className="attendance-message attendance-message-success">
						{successMessage}
					</div>
				)}
				{createError && (
					<div className="attendance-message attendance-message-error">
						{createError}
					</div>
				)}
			</div>

			{/* 출석 세션 목록 */}
			<div>
				<h2 className="attendance-subtitle">📋 출석 세션 목록</h2>
				{listError && (
					<div className="attendance-message attendance-message-error">
						{listError}
					</div>
				)}
				
				{listLoading ? (
					<div className="attendance-loading">목록을 불러오는 중...</div>
				) : sessions.length > 0 ? (
					<table className="attendance-table">
						<thead>
							<tr>
								<th>세션 ID</th>
								<th>제목</th>
								<th>상태</th>
								<th>생성일</th>
							</tr>
						</thead>
						<tbody>
							{sessions.map((session) => (
								<tr
									key={session.sessionId}
									onClick={() => setSelectedSessionId(session.sessionId)}
								>
									<td>#{session.sessionId}</td>
									<td>{session.title}</td>
									<td>
										<span className={`attendance-status-badge ${
											session.status === 'ACTIVE' ? 'attendance-status-active' :
											session.status === 'COMPLETED' ? 'attendance-status-completed' :
											'attendance-status-inactive'
										}`}>
											{session.status}
										</span>
									</td>
									<td>{new Date(session.createdAt).toLocaleString("ko-KR")}</td>
								</tr>
							))}
						</tbody>
					</table>
				) : (
					<div className="attendance-empty-state">
						<div className="attendance-empty-icon">📝</div>
						<div className="attendance-empty-message">아직 생성된 출석 세션이 없습니다</div>
						<div className="attendance-empty-description">
							위의 폼을 사용하여 첫 번째 출석 세션을 생성해보세요
						</div>
					</div>
				)}
			</div>
		</div>
	);

	return (
		<div className="attendance-container">
			{selectedSessionId ? renderDetailView() : renderListView()}
		</div>
	);
}

export default Attendance;

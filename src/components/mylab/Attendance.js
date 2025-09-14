import { QRCodeSVG as QRCode } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";

function Attendance() {
	// ... (모든 state와 함수 로직은 이전과 동일) ...
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

	const fetchData = useCallback(async () => {
		setListLoading(true);
		setListError(null);
		const token = localStorage.getItem("accessToken");
		try {
			const response = await api.get(`/api/labs/${labId}/attendance/sessions`, {
				headers: { Authorization: `Bearer ${token}` },
				validateStatus: () => true,
			});
			if (response.status >= 200 && response.status < 300) {
				setSessions(response.data.data || []);
			} else {
				throw new Error(
					response.data.message || `에러 발생: ${response.status}`
				);
			}
		} catch (err) {
			setListError(err.message);
		} finally {
			setListLoading(false);
		}
	}, [labId]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	useEffect(() => {
		if (!selectedSessionId) return;
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
	}, [selectedSessionId, labId]);

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
			} else {
				throw new Error(
					response.data.message || `에러 발생: ${response.status}`
				);
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
		const token = localStorage.getItem("accessToken");

		try {
			// --- [디버깅 1] --- 요청을 보내기 직전의 모든 정보 확인
			console.log("--- QR 코드 생성 요청 시작 ---");
			console.log(
				`요청 URL: /api/labs/${labId}/attendance/sessions/${selectedSessionId}/qr`
			);
			console.log(
				`사용된 토큰 (앞 10자리): ${
					token ? token.substring(0, 10) + "..." : "토큰 없음"
				}`
			);
			console.log("-----------------------------");

			const response = await api.post(
				`/api/labs/${labId}/attendance/sessions/${selectedSessionId}/qr`,
				{},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			console.log("QR 코드 생성 응답:", response);

			if (response.data && response.data.data && response.data.data.token) {
				setQrCodeData(response.data.data.token);
			} else {
				setDetailError("서버 응답에서 QR 토큰을 찾을 수 없습니다.");
			}
		} catch (err) {
			// --- [디버깅 2] --- 에러 발생 시 전체 에러 객체 확인
			console.error("💥 QR 코드 생성 API 호출 실패:", err);

			// --- [디버깅 3] --- 서버가 응답을 보냈다면(err.response가 있다면), 그 내용 상세 확인
			if (err.response) {
				console.error("➡️ 서버 응답 상태:", err.response.status); // 예: 500
				console.error("➡️ 서버 응답 데이터:", err.response.data); // 가장 중요! 서버의 실제 에러 메시지
				console.error("➡️ 서버 응답 헤더:", err.response.headers);
			}

			// 화면에 표시될 에러 메시지 설정
			const errorMessage =
				err.response?.data?.message || err.message || "알 수 없는 에러 발생";
			setDetailError(`QR 코드 생성 실패: ${errorMessage}`);
		} finally {
			setIsQrLoading(false);
		}
	};
	const renderDetailView = () => {
		// ... (상세 뷰 렌더링 함수는 이전과 동일) ...
		if (detailLoading) return <div>세부 정보 로딩 중...</div>;
		if (detailError) return <div style={{ color: "red" }}>{detailError}</div>;
		if (!sessionDetails) return <div>세션 정보를 찾을 수 없습니다.</div>;
		return (
			<div>
				<button onClick={() => setSelectedSessionId(null)}>
					← 목록으로 돌아가기
				</button>
				<hr />
				<h1>세션 상세 정보</h1>
				<p>
					<strong>세션 제목:</strong> {sessionDetails.title}
				</p>
				<p>
					<strong>상태:</strong> {sessionDetails.status}
				</p>
				<p>
					<strong>생성일:</strong>{" "}
					{new Date(sessionDetails.createdAt).toLocaleString("ko-KR")}
				</p>
				<p>
					<strong>QR 유효시간:</strong> {sessionDetails.qrValidityMinutes}분
				</p>
				<hr />
				<h2>QR 코드 생성</h2>
				<button
					onClick={handleGenerateQr}
					disabled={isQrLoading || sessionDetails.status !== "ACTIVE"}
				>
					{isQrLoading ? "생성 중..." : "QR 코드 생성하기"}
				</button>
				{qrCodeData && (
					<div style={{ marginTop: "1rem" }}>
						<QRCode value={qrCodeData} size={256} />
					</div>
				)}
			</div>
		);
	};

	// --- 렌더링 함수: 목록 뷰 ---
	const renderListView = () => (
		<div>
			<div
				style={{
					marginBottom: "40px",
					paddingBottom: "20px",
					borderBottom: "2px solid #eee",
				}}
			>
				<h2>새 출석 세션 생성</h2>
				{/* ✅ 여기에 누락된 Form 내용이 다시 추가되었습니다. */}
				<form onSubmit={handleCreateSubmit}>
					<div>
						<label htmlFor="title">세션 제목: </label>
						<input
							id="title"
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							placeholder="예: 2025-09-14 정기 미팅"
						/>
					</div>
					<div style={{ margin: "10px 0" }}>
						<label htmlFor="qrMinutes">QR 유효시간 (분): </label>
						<input
							id="qrMinutes"
							type="number"
							value={qrMinutes}
							onChange={(e) => setQrMinutes(e.target.value)}
							min="1"
						/>
					</div>
					<button type="submit" disabled={createLoading}>
						{createLoading ? "생성 중..." : "생성하기"}
					</button>
				</form>
				{successMessage && <p style={{ color: "green" }}>{successMessage}</p>}
				{createError && <p style={{ color: "red" }}>{createError}</p>}
			</div>

			<h1>출석 세션 목록 (Lab ID: {labId})</h1>
			<table>
				<thead>
					<tr>
						<th>세션 ID</th>
						<th>제목</th>
						<th>상태</th>
						<th>생성일</th>
					</tr>
				</thead>
				<tbody>
					{listLoading ? (
						<tr>
							<td colSpan="4">목록 로딩 중...</td>
						</tr>
					) : sessions.length > 0 ? (
						sessions.map((session) => (
							<tr
								key={session.sessionId}
								onClick={() => setSelectedSessionId(session.sessionId)}
								style={{ cursor: "pointer" }}
							>
								<td>{session.sessionId}</td>
								<td>{session.title}</td>
								<td>{session.status}</td>
								<td>{new Date(session.createdAt).toLocaleString("ko-KR")}</td>
							</tr>
						))
					) : (
						<tr>
							<td colSpan="4">데이터가 없습니다.</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);

	// --- 최종 렌더링 ---
	return (
		<div style={{ padding: "2rem" }}>
			{selectedSessionId ? renderDetailView() : renderListView()}
		</div>
	);
}

export default Attendance;

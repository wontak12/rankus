import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function NoticePreview({ labId }) {
	const navigate = useNavigate();
	const [notices, setNotices] = useState([]);

	// 컴포넌트 렌더링 시점과 상태를 추적
	console.log("🚀 NoticePreview 컴포넌트 렌더링 시작");
	console.log("➡️ 현재 notices 상태:", notices);

	useEffect(() => {
		// useEffect 실행 시점과 labId 값 확인
		console.log("🔧 useEffect 실행. labId:", labId);

		if (!labId) {
			console.error("❌ labId가 제공되지 않았습니다. API 호출을 건너뜁니다.");
			return;
		}

		const token = localStorage.getItem("accessToken");
		console.log("🔑 저장된 토큰:", token ? "존재함" : "없음");

		if (!token) {
			console.error("❌ 인증 토큰이 없습니다. 로그인 상태를 확인해주세요.");
			return;
		}

		const fetchNotices = async () => {
			console.log("⏳ API 호출 시작...");
			try {
				const response = await axios.get(`/api/labs/${labId}/notices`, {
					params: {
						page: 0,
						size: 3,
						sort: "createdAt,desc",
					},
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				// API 응답 데이터 로깅
				console.log("✅ API 호출 성공! 응답 데이터:", response.data);
				const fetchedNotices = response.data.data.content;
				console.log("➡️ 가져온 공지사항 목록:", fetchedNotices);

				// ✅ 여기서 최신 3개만 잘라냅니다.
				const top3Notices = fetchedNotices.slice(0, 2);
				setNotices(top3Notices);

				if (top3Notices.length === 0) {
					console.log(
						"⚠️ 가져온 데이터가 비어 있습니다. '공지사항이 없습니다' 메시지가 표시될 것입니다."
					);
				}
			} catch (error) {
				// console.error는 기본적으로 빨간색으로 표시됩니다.
				console.error("❌ 공지사항을 불러오는 중 오류 발생:", error);
				// 에러 상세 정보 로깅
				if (error.response) {
					console.error("➡️ 서버 응답 오류 상태 코드:", error.response.status);
					console.error("➡️ 서버 응답 오류 데이터:", error.response.data);
				} else if (error.request) {
					console.error("➡️ 요청 오류: 서버로부터 응답을 받지 못했습니다.");
				} else {
					console.error("➡️ 요청 설정 오류:", error.message);
				}
			}
		};

		fetchNotices();
	}, [labId]);

	return (
		<div className="mainlab-card">
			<div className="mylab-card-title">📢 공지사항</div>
			<ul style={{ padding: 0, listStyle: "none" }}>
				{notices.length > 0 ? (
					notices.map((notice) => (
						<li
							key={notice.id}
							className="notice-item"
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								cursor: "pointer",
								marginBottom: "0.5rem",
							}}
							// onClick 이벤트 핸들러는 필요 없다는 요청에 따라 주석 처리했습니다.
							// onClick={() => navigate(`/notices/${labId}/${notice.id}`)}
						>
							<span style={{ fontWeight: 600 }}>{notice.title}</span>
							<span
								className="notice-date"
								style={{ color: "#b6c6e3", fontSize: "0.97rem" }}
							>
								{notice.createdAt
									? new Date(notice.createdAt).toLocaleDateString()
									: "날짜 없음"}
							</span>
						</li>
					))
				) : (
					<li style={{ color: "#b6c6e3", textAlign: "center" }}>
						공지사항이 없습니다.
					</li>
				)}
			</ul>
			<div
				className="see-more"
				style={{
					color: "#67509C",
					cursor: "pointer",
					fontWeight: 700,
					marginTop: "0.7rem",
				}}
				onClick={() => navigate("/notice")}
			>
				➕ 전체 보기
			</div>
		</div>
	);
}

export default NoticePreview;

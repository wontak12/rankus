// src/components/NoticeDetail.js
import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function NoticeDetail() {
	// URL에서 labId와 noticeId를 추출합니다.
	const { labId, noticeId } = useParams();
	const [notice, setNotice] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// 컴포넌트 렌더링 시점과 상태를 추적
	console.log("🚀 NoticeDetail 컴포넌트 렌더링 시작");
	console.log(`➡️ 현재 URL 파라미터: labId=${labId}, noticeId=${noticeId}`);

	useEffect(() => {
		// useEffect 실행 시점과 URL 파라미터 값 확인
		console.log("🔧 useEffect 실행.");

		if (!labId || !noticeId) {
			console.error("❌ 잘못된 접근입니다. 랩실 또는 공지사항 ID가 없습니다.");
			setError("잘못된 접근입니다. 랩실 또는 공지사항 ID가 없습니다.");
			setLoading(false);
			return;
		}

		const token = localStorage.getItem("accessToken");
		console.log("🔑 저장된 토큰:", token ? "존재함" : "없음");

		if (!token) {
			console.error("❌ 인증 토큰이 없습니다. 로그인 상태를 확인해주세요.");
			setError("인증 토큰이 없습니다. 로그인 상태를 확인해주세요.");
			setLoading(false);
			return;
		}

		const fetchNotice = async () => {
			console.log(`⏳ API 호출 시작: /api/labs/${labId}/notices/${noticeId}`);
			try {
				setLoading(true);
				const response = await axios.get(
					`/api/labs/${labId}/notices/${noticeId}`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				// API 응답 데이터 로깅
				console.log("✅ API 호출 성공! 응답 데이터:", response.data);
				const fetchedNotice = response.data.data;

				if (!fetchedNotice) {
					console.log(
						"⚠️ 가져온 데이터가 null입니다. '공지사항을 찾을 수 없습니다' 메시지가 표시될 것입니다."
					);
				}

				setNotice(fetchedNotice);
				setError(null);
			} catch (err) {
				console.error("❌ 공지사항 상세 정보를 불러오는 중 오류 발생:", err);
				// 에러 상세 정보 로깅
				if (err.response) {
					console.error("➡️ 서버 응답 오류 상태 코드:", err.response.status);
					console.error("➡️ 서버 응답 오류 데이터:", err.response.data);
				} else if (err.request) {
					console.error("➡️ 요청 오류: 서버로부터 응답을 받지 못했습니다.");
				} else {
					console.error("➡️ 요청 설정 오류:", err.message);
				}
				setError("공지사항을 불러오는 데 실패했습니다.");
			} finally {
				setLoading(false);
			}
		};

		fetchNotice();
	}, [labId, noticeId]);

	if (loading) {
		console.log("⏳ 화면: 로딩 중...");
		return <div>로딩 중...</div>;
	}

	if (error) {
		console.log("⚠️ 화면: 오류 발생 -", error);
		return <div>오류: {error}</div>;
	}

	if (!notice) {
		console.log(
			"ℹ️ 화면: notice 상태가 null입니다. '공지사항을 찾을 수 없습니다' 표시."
		);
		return <div>공지사항을 찾을 수 없습니다.</div>;
	}

	console.log("✅ 화면: 공지사항 데이터를 성공적으로 표시합니다.");
	return (
		<div className="notice-detail-container">
			<h1 className="notice-detail-title">{notice.title}</h1>
			<div className="notice-meta">
				<span className="notice-author">작성자: {notice.authorName}</span>
				<span className="notice-date">
					작성일:{" "}
					{notice.createdAt
						? new Date(notice.createdAt).toLocaleDateString()
						: "날짜 없음"}
				</span>
			</div>
			<div
				className="notice-content"
				dangerouslySetInnerHTML={{ __html: notice.content }}
			/>
		</div>
	);
}

export default NoticeDetail;

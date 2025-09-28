import { useCallback, useEffect, useState } from "react";
import api from "../api";
import "../styles/NoticePage.css";

function NoticePage() {
	// --- 상태 관리 ---
	// 'list': 목록 보기, 'detail': 상세 보기, 'create': 공지 작성, 'update': 공지 수정
	const [view, setView] = useState("list");
	const [notices, setNotices] = useState([]);
	const [selectedNotice, setSelectedNotice] = useState(null);
	const [labId, setLabId] = useState(null);
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);

	// ====================== 🕵️‍♂️ 디버깅 코드 섹션 🕵️‍♂️ ======================
	console.log(
		`%c[Render] NoticePage 렌더링... (현재 뷰: ${view})`,
		"color: blue;"
	);

	useEffect(() => {
		console.log(
			"%c[State Update] 상태 변경됨:",
			"color: green; font-weight: bold;",
			{
				view,
				labId,
				noticesCount: notices.length,
				page,
				hasMore,
				loading,
				isSubmitting,
				error: error,
				selectedNotice: selectedNotice ? `ID: ${selectedNotice.id}` : null,
			}
		);
	}, [
		view,
		notices,
		selectedNotice,
		labId,
		page,
		hasMore,
		loading,
		isSubmitting,
		error,
	]);
	// =================================================================

	// --- 데이터 Fetching ---
	useEffect(() => {
		const fetchUserLabId = async () => {
			console.log("🔄 [Fetch] 사용자 labId 가져오기 시작...");
			try {
				const res = await api.get("/api/users/me");
				console.log("✅ [API Response] /api/users/me 응답:", res.data);
				const fetchedLabId = res.data?.data?.labId;
				if (fetchedLabId) {
					console.log(`- labId 설정: ${fetchedLabId}`);
					setLabId(fetchedLabId);
				} else {
					console.error("- 에러: 응답에 labId가 없습니다.");
					setError("소속된 랩실이 없습니다.");
					setLoading(false);
				}
			} catch (err) {
				console.error("❌ [API Error] /api/users/me 요청 실패:", err);
				setError("사용자 정보를 가져오는 데 실패했습니다.");
				setLoading(false);
			}
		};
		fetchUserLabId();
	}, []);

	const fetchNotices = useCallback(
		async (currentPage) => {
			if (!labId) return;
			setLoading(true);
			console.log(
				`🔄 [Fetch] 공지사항 목록 조회 시작 (Lab: ${labId}, Page: ${currentPage})`
			);
			try {
				const res = await api.get(`/api/labs/${labId}/notices`, {
					/* ... */
				});
				console.log("✅ [API Response] /api/labs/.../notices 응답:", res.data);
				const data = res.data?.data;
				setNotices((prev) =>
					currentPage === 0 ? data.content : [...prev, ...data.content]
				);
				setHasMore(!data.last);
				setPage(currentPage);
			} catch (err) {
				console.error("❌ [API Error] /api/labs/.../notices 요청 실패:", err);
				setError("공지사항을 불러오는 데 실패했습니다.");
			} finally {
				setLoading(false);
			}
		},
		[labId]
	);

	useEffect(() => {
		if (labId) {
			fetchNotices(0);
		}
	}, [labId, fetchNotices]);

	// --- 이벤트 핸들러 ---
	const handleViewDetail = (notice) => {
		console.log("🖱️ [Event] 공지 클릭 -> 상세 보기로 전환", notice);
		setSelectedNotice(notice);
		setView("detail");
	};

	const handleViewCreate = () => {
		console.log("🖱️ [Event] '새 공지 작성' 클릭 -> 생성 폼으로 전환");
		setView("create");
	};

	const handleViewUpdate = () => {
		console.log("🖱️ [Event] '수정하기' 클릭 -> 수정 폼으로 전환");
		setView("update");
	};

	const handleBackToList = () => {
		console.log("🖱️ [Event] '목록으로' 클릭 -> 목록 뷰로 전환");
		setView("list");
		setSelectedNotice(null);
	};

	const handleLoadMore = () => {
		console.log("🖱️ [Event] '더보기' 클릭");
		if (!loading && hasMore) {
			fetchNotices(page + 1);
		}
	};

	const handleCreateSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		const title = e.target.title.value;
		const content = e.target.content.value;
		console.log(`🔄 [Submit] 공지 생성 요청 시작 (제목: ${title})`);
		const requestBody = {
			title: title,
			content: content,
			type: "NORMAL",
			pinned: false,
		};
		console.log("✅ [Submit] 서버로 보낼 데이터:", requestBody);

		try {
			const res = await api.post(`/api/labs/${labId}/notices`, requestBody);
			console.log("✅ [API Response] 공지 생성 응답:", res.data);
			alert("공지가 성공적으로 등록되었습니다.");
			await fetchNotices(0);
			handleBackToList();
		} catch (err) {
			console.error("❌ [API Error] 공지 생성 실패:", err);
			if (err.response?.status === 403) {
				alert("공지를 생성할 권한이 없습니다.");
			} else {
				const serverMessage =
					err.response?.data?.message ||
					"공지 생성에 실패했습니다. 다시 시도해 주세요.";
				alert(serverMessage);
			}
		} finally {
			setIsSubmitting(false);
			console.log("🏁 [Submit] 공지 생성 종료");
		}
	};

	const handleUpdateSubmit = async (e) => {
		e.preventDefault();
		setIsSubmitting(true);
		const title = e.target.title.value;
		const content = e.target.content.value;
		console.log(`🔄 [Submit] 공지 수정 요청 시작 (ID: ${selectedNotice.id})`);
		const requestBody = {
			title: title,
			content: content,
			type: selectedNotice.type,
			pinned: selectedNotice.pinned,
		};
		console.log("✅ [Submit] 서버로 보낼 데이터:", requestBody);

		try {
			const res = await api.put(
				`/api/labs/${labId}/notices/${selectedNotice.id}`,
				requestBody
			);
			console.log("✅ [API Response] 공지 수정 응답:", res.data);
			alert("공지가 성공적으로 수정되었습니다.");
			await fetchNotices(0);
			handleViewDetail(res.data.data);
		} catch (err) {
			console.error("❌ [API Error] 공지 수정 실패:", err);
			if (err.response?.status === 403) {
				alert("공지를 수정할 권한이 없습니다.");
			} else {
				const serverMessage =
					err.response?.data?.message ||
					"공지 수정에 실패했습니다. 다시 시도해 주세요.";
				alert(serverMessage);
			}
		} finally {
			setIsSubmitting(false);
			console.log("🏁 [Submit] 공지 수정 종료");
		}
	};

	// ✅ 삭제 기능 추가
	const handleDelete = async () => {
		console.log("🖱️ [Event] '삭제하기' 클릭");
		if (!selectedNotice) return;

		if (window.confirm("정말로 이 공지를 삭제하시겠습니까?")) {
			try {
				// DELETE API 호출
				await api.delete(`/api/labs/${labId}/notices/${selectedNotice.id}`);
				alert("공지가 성공적으로 삭제되었습니다.");
				// 목록을 새로고침하고 목록 뷰로 돌아갑니다.
				await fetchNotices(0);
				handleBackToList();
			} catch (err) {
				console.error("❌ [API Error] 공지 삭제 실패:", err);
				if (err.response?.status === 403) {
					alert("공지를 삭제할 권한이 없습니다.");
				} else {
					const serverMessage =
						err.response?.data?.message || "공지 삭제에 실패했습니다.";
					alert(serverMessage);
				}
			}
		}
	};

	// --- 뷰 렌더링 함수 ---
	const renderListView = () => {
		console.log("🎨 [Render] 렌더링: 목록 뷰");
		return (
			<>
				<div className="notice-header">
					<h2 className="notice-title">📋 전체 공지사항</h2>
					<button onClick={handleViewCreate} className="action-button">
						📌 새 공지 작성
					</button>
				</div>
				{error && <div className="status-indicator error">{error}</div>}
				{!loading && notices.length === 0 && !error && (
					<div className="status-indicator">등록된 공지사항이 없습니다.</div>
				)}
				{notices.length > 0 && (
					<ul className="notice-list">
						{notices.map((notice) => (
							<li
								key={notice.id}
								className="notice-item"
								onClick={() => handleViewDetail(notice)}
							>
								<div className="notice-item-content">
									{notice.pinned && <span className="notice-pinned">고정</span>}
									<span className="notice-item-title">{notice.title}</span>
								</div>
								<span className="notice-item-date">
									{new Date(notice.createdAt).toLocaleDateString("ko-KR")}
								</span>
							</li>
						))}
					</ul>
				)}
				{loading && page === 0 && (
					<div className="status-indicator">로딩 중...</div>
				)}
				{!loading && hasMore && notices.length > 0 && (
					<button onClick={handleLoadMore} className="load-more-btn">
						{loading ? "로딩 중..." : "더보기"}
					</button>
				)}
			</>
		);
	};

	const renderDetailView = () => {
		console.log("🎨 [Render] 렌더링: 상세 뷰");
		if (!selectedNotice) return null;
		return (
			<div className="notice-detail">
				<div className="notice-header">
					<button onClick={handleBackToList} className="back-button">
						← 목록으로
					</button>
					<div className="notice-actions">
						<button
							onClick={handleViewUpdate}
							style={{ marginRight: "1rem" }} // ✅ 이 부분을 추가했습니다.
							className="action-button"
						>
							수정하기
						</button>
						{/* ✅ 삭제 버튼 추가 */}
						<button
							style={{ backgroundColor: "red" }}
							onClick={handleDelete}
							className="action-button delete-button"
						>
							삭제하기
						</button>
					</div>
				</div>
				<h2 className="notice-detail-title">{selectedNotice.title}</h2>
				<div className="notice-detail-meta">
					<span>작성자: {selectedNotice.authorName}</span>
					<span>
						작성일: {new Date(selectedNotice.createdAt).toLocaleString("ko-KR")}
					</span>
				</div>
				<div className="notice-detail-content">
					<p style={{ whiteSpace: "pre-wrap" }}>{selectedNotice.content}</p>
				</div>
			</div>
		);
	};

	const renderCreateForm = () => {
		console.log("🎨 [Render] 렌더링: 생성 폼");
		return (
			<div className="notice-create">
				<button
					onClick={handleBackToList}
					className="back-button"
					disabled={isSubmitting}
				>
					← 취소
				</button>
				<h2 className="notice-create-title">새 공지 작성</h2>
				<form className="notice-form" onSubmit={handleCreateSubmit}>
					<input
						type="text"
						name="title"
						placeholder="제목을 입력하세요"
						required
					/>
					<textarea
						name="content"
						rows="15"
						placeholder="내용을 입력하세요"
						required
					></textarea>
					<button
						type="submit"
						className="action-button"
						disabled={isSubmitting}
					>
						{isSubmitting ? "저장 중..." : "저장하기"}
					</button>
				</form>
			</div>
		);
	};

	const renderUpdateForm = () => {
		console.log("🎨 [Render] 렌더링: 수정 폼");
		if (!selectedNotice) return null;
		return (
			<div className="notice-create">
				<button
					onClick={handleBackToList}
					className="back-button"
					disabled={isSubmitting}
				>
					← 취소
				</button>
				<h2 className="notice-create-title">공지 수정</h2>
				<form className="notice-form" onSubmit={handleUpdateSubmit}>
					<input
						type="text"
						name="title"
						defaultValue={selectedNotice.title}
						required
					/>
					<textarea
						name="content"
						rows="15"
						defaultValue={selectedNotice.content}
						required
					></textarea>
					<button
						type="submit"
						className="action-button"
						disabled={isSubmitting}
					>
						{isSubmitting ? "수정 중..." : "수정하기"}
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
			case "update":
				return renderUpdateForm();
			case "list":
			default:
				return renderListView();
		}
	};

	return <div className="notice-page">{renderContent()}</div>;
}

export default NoticePage;

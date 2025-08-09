// src/components/Header.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Header.css";
import { logout } from "../utils/logout";

/* ===================== 디버깅 유틸 (파일 내장) ===================== */
function showJwt() {
	const at = localStorage.getItem("accessToken");
	if (!at) {
		console.log("[JWT] no accessToken in localStorage");
		return;
	}
	const [, p] = at.split(".");
	const b64 = (p || "").replace(/-/g, "+").replace(/_/g, "/");
	const pad = "=".repeat((4 - (b64.length % 4)) % 4);
	try {
		const payload = JSON.parse(atob(b64 + pad));
		const now = Math.floor(Date.now() / 1000);
		console.log("[JWT] payload:", payload);
		console.log(
			"[JWT] exp:",
			payload.exp,
			"now:",
			now,
			"secondsLeft:",
			payload.exp - now
		);
	} catch (e) {
		console.warn("[JWT] failed to decode payload", e);
	}
}

function buildCurlForPending() {
	const at = localStorage.getItem("accessToken");
	const curl =
		`curl -i -X GET 'http://3.34.229.56:8080/api/lab-creation-requests/admin/pending' \\\n` +
		`  -H 'accept: application/json'` +
		(at ? ` \\\n  -H 'Authorization: Bearer ${at}'` : "");
	console.log("[cURL]\n" + curl);
	return curl;
}

async function rawFetchPending() {
	const at = localStorage.getItem("accessToken");
	const res = await fetch(
		"http://3.34.229.56:8080/api/lab-creation-requests/admin/pending",
		{
			method: "GET",
			headers: {
				accept: "application/json",
				...(at ? { Authorization: `Bearer ${at}` } : {}),
			},
		}
	);
	const text = await res.text();
	console.log("[rawFetch] status:", res.status);
	console.log("[rawFetch] body:", text);
	return { status: res.status, body: text };
}
/* ================================================================ */

export default function Header() {
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useAuth();

	const isAuthPage = ["/", "/login", "/signup"].includes(location.pathname);

	const [showModal, setShowModal] = useState(false);
	const [pendingLabs, setPendingLabs] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [processingId, setProcessingId] = useState(null);

	// 목록 열기
	const handleOpenModal = async () => {
		setIsLoading(true);

		// 🔎 디버그: 토큰 및 cURL 출력
		const at = localStorage.getItem("accessToken");
		console.log("[pending] has accessToken:", !!at, at?.slice(0, 20) + "...");
		showJwt();
		buildCurlForPending();

		try {
			// 인터셉터가 있어도 디버깅용으로 명시적으로 헤더 부착
			const res = await api.get("/api/lab-creation-requests/admin/pending", {
				headers: at ? { Authorization: `Bearer ${at}` } : {},
			});

			const list = res?.data?.data ?? res?.data ?? [];
			if (!Array.isArray(list)) {
				console.warn("Unexpected response shape:", res?.data);
				setPendingLabs([]);
			} else {
				setPendingLabs(list);
			}
			setShowModal(true);
		} catch (err) {
			const status = err.response?.status;
			const data = err.response?.data;
			console.error("⚠️ pending 목록 조회 실패:", { status, data, err });

			// axios 외에 fetch로도 즉시 재확인(원문 확보)
			try {
				await rawFetchPending();
			} catch (e) {
				console.error("⚠️ rawFetch 실패:", e);
			}

			if (status === 401) {
				alert("로그인이 필요합니다. 다시 로그인 해주세요.");
				try {
					logout();
				} finally {
					navigate("/login", { replace: true });
				}
			} else if (status === 403) {
				alert("권한이 없습니다. (관리자 전용)");
			} else {
				alert(`목록을 불러올 수 없습니다. (status: ${status ?? "unknown"})`);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleCloseModal = () => setShowModal(false);

	// 승인
	const handleApprove = async (id) => {
		try {
			setProcessingId(id);
			await api.put(`/api/lab-creation-requests/${id}/approve`);
			setPendingLabs((prev) => prev.filter((lab) => lab.id !== id));
			alert("✅ 승인되었습니다.");
		} catch (err) {
			const status = err.response?.status;
			if (status === 403) alert("⚠️ 권한이 없습니다.");
			else if (status === 422) alert("⚠️ 승인할 수 없는 상태입니다.");
			else alert("⚠️ 승인 중 오류가 발생했습니다.");
		} finally {
			setProcessingId(null);
		}
	};

	// 거절
	const handleReject = async (id) => {
		try {
			setProcessingId(id);
			await api.put(`/api/lab-creation-requests/${id}/reject`);
			setPendingLabs((prev) => prev.filter((lab) => lab.id !== id));
			alert("✅ 거절되었습니다.");
		} catch (err) {
			const status = err.response?.status;
			if (status === 403) alert("⚠️ 권한이 없습니다.");
			else if (status === 422) alert("⚠️ 거절할 수 없는 상태입니다.");
			else alert("⚠️ 거절 중 오류가 발생했습니다.");
		} finally {
			setProcessingId(null);
		}
	};

	return (
		<header className="rankus-header">
			<div className="rankus-header-inner">
				<span
					className="rankus-header-logo-text"
					onClick={() => navigate("/home")}
				>
					RANKUS
				</span>

				{!isAuthPage && (
					<div className="rankus-header-profile-group">
						<button
							className="rankus-header-pending-btn"
							onClick={handleOpenModal}
							disabled={isLoading}
						>
							{isLoading ? "불러오는 중..." : "🧪 승인 대기 랩실 보기"}
						</button>

						<div
							className="rankus-header-profile"
							onClick={() => navigate("/profile")}
						>
							<span className="rankus-header-profile-name">
								{user?.name ?? "Unknown"}
							</span>
						</div>

						<button className="rankus-header-logout-btn" onClick={logout}>
							로그아웃
						</button>
					</div>
				)}
			</div>

			{showModal && (
				<div className="modal-overlay" onClick={handleCloseModal}>
					<div
						className="modal-content"
						onClick={(e) => e.stopPropagation()}
						style={{
							background: "red",
							color: "white",
							border: "3px solid black",
						}}
					>
						<h3>✅ 승인 대기 중인 랩실 목록</h3>

						{!pendingLabs.length ? (
							<p>대기 중인 요청이 없습니다.</p>
						) : (
							<ul>
								{pendingLabs.map((lab) => (
									<li key={lab.id} style={{ marginBottom: 12 }}>
										<strong>{lab.requestedLabName}</strong> (
										{lab.requestedCategory})
										<br />
										<small>{lab.requestedDescription}</small>
										<br />
										<em>
											신청자: {lab.requester?.name} ({lab.requester?.email})
										</em>
										<br />
										<button
											onClick={() => handleApprove(lab.id)}
											style={{ marginRight: 8 }}
											disabled={processingId === lab.id}
										>
											{processingId === lab.id ? "처리 중..." : "승인"}
										</button>
										<button
											onClick={() => handleReject(lab.id)}
											disabled={processingId === lab.id}
										>
											{processingId === lab.id ? "처리 중..." : "거절"}
										</button>
									</li>
								))}
							</ul>
						)}

						<button onClick={handleCloseModal}>닫기</button>
					</div>
				</div>
			)}
		</header>
	);
}

import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Header.css";
import { logout } from "../utils/logout";

function Header() {
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useAuth();
	const isAuthPage = ["/", "/login", "/signup"].includes(location.pathname);

	const [showModal, setShowModal] = useState(false);
	const [pendingLabs, setPendingLabs] = useState([]);

	const handleOpenModal = async () => {
		try {
			const res = await api.get("/api/lab-creation-requests/admin/pending");
			setPendingLabs(res.data.data);
			setShowModal(true);
		} catch (err) {
			console.error(err);
			alert("목록을 불러올 수 없습니다. 권한이 없거나 서버 오류입니다.");
		}
	};

	const handleCloseModal = () => setShowModal(false);

	// 승인
	const handleApprove = async (id) => {
		try {
			await api.put(`/api/lab-creation-requests/${id}/approve`);
			setPendingLabs((prev) => prev.filter((lab) => lab.id !== id));
			alert("✅ 승인되었습니다.");
		} catch (err) {
			const status = err.response?.status;
			if (status === 403) alert("⚠️ 권한이 없습니다.");
			else if (status === 422) alert("⚠️ 승인할 수 없는 상태입니다.");
			else alert("⚠️ 승인 중 오류가 발생했습니다.");
		}
	};

	// 거절
	const handleReject = async (id) => {
		try {
			await api.put(`/api/lab-creation-requests/${id}/reject`);
			setPendingLabs((prev) => prev.filter((lab) => lab.id !== id));
			alert("✅ 거절되었습니다.");
		} catch (err) {
			const status = err.response?.status;
			if (status === 403) alert("⚠️ 권한이 없습니다.");
			else if (status === 422) alert("⚠️ 거절할 수 없는 상태입니다.");
			else alert("⚠️ 거절 중 오류가 발생했습니다.");
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
						>
							🧪 승인 대기 랩실 보기 (테스트용)
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

						<ul>
							{pendingLabs.length === 0 ? (
								<li>대기 중인 요청이 없습니다.</li>
							) : (
								pendingLabs.map((lab) => (
									<li key={lab.id} style={{ marginBottom: "12px" }}>
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
											style={{ marginRight: "8px" }}
										>
											승인
										</button>
										<button onClick={() => handleReject(lab.id)}>거절</button>
									</li>
								))
							)}
						</ul>

						<button onClick={handleCloseModal}>닫기</button>
					</div>
				</div>
			)}
		</header>
	);
}

export default Header;

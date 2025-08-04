import { useEffect, useState } from "react";

function LabRequestsModal({ onClose }) {
	const [requests, setRequests] = useState([]);
	const [loading, setLoading] = useState(true);

	// 목록 불러오기
	useEffect(() => {
		const fetchRequests = async () => {
			try {
				const res = await fetch("/api/lab-creation-requests/admin/pending");
				if (!res.ok) throw new Error("목록 불러오기 실패");
				const data = await res.json();
				setRequests(data);
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		};
		fetchRequests();
	}, []);

	// 승인 처리
	const handleApprove = async (id) => {
		try {
			const res = await fetch(`/api/lab-creation-requests/${id}/approve`, {
				method: "PUT",
			});
			if (!res.ok) throw new Error("승인 실패");
			setRequests((prev) => prev.filter((r) => r.id !== id));
		} catch (error) {
			console.error(error);
		}
	};

	// 거절 처리
	const handleReject = async (id) => {
		try {
			const res = await fetch(`/api/lab-creation-requests/${id}/reject`, {
				method: "PUT",
			});
			if (!res.ok) throw new Error("거절 실패");
			setRequests((prev) => prev.filter((r) => r.id !== id));
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div className="modal-overlay">
			<div className="modal-content">
				<h2>랩실 가입 신청 목록</h2>
				<button onClick={onClose} className="close-btn">
					X
				</button>

				{loading ? (
					<p>불러오는 중...</p>
				) : requests.length === 0 ? (
					<p>대기중인 신청이 없습니다.</p>
				) : (
					<ul>
						{requests.map((req) => (
							<li key={req.id} className="request-item">
								<span>
									{req.labName} - {req.requesterName}
								</span>
								<div>
									<button onClick={() => handleApprove(req.id)}>승인</button>
									<button onClick={() => handleReject(req.id)}>거절</button>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

export default LabRequestsModal;

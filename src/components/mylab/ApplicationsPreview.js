// src/components/ApplicationsPreview.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api";

/**
 * 면접 신청자 미리보기 카드 (+ 모달 무한스크롤 & 모달 내부 상세 보기 + 승인/거절)
 * - props: labId (number | string)
 * - 스타일: "mylab-card", "mylab-card-title" 필수 적용
 */
export default function ApplicationsPreview({ labId }) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [apps, setApps] = useState([]);

	// 모달 / 상세 / 인피니트 스크롤 상태
	const [open, setOpen] = useState(false);
	const [selectedApp, setSelectedApp] = useState(null); // 모달 내부 상세 선택
	const [visibleCount, setVisibleCount] = useState(20); // 모달 목록에서 초기 20개
	const loaderRef = useRef(null);

	useEffect(() => {
		if (!labId) return;
		let mounted = true;
		(async () => {
			setLoading(true);
			setError("");
			try {
				const res = await api.get(`/api/labs/${labId}/applications`, {
					headers: { Accept: "application/json" },
					validateStatus: () => true,
				});

				if (res.status === 200) {
					const list = Array.isArray(res?.data?.data) ? res.data.data : [];
					// 최신 신청이 위로 오게 (appliedAt 내림차순)
					list.sort(
						(a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0)
					);
					if (mounted) setApps(list);
				} else {
					if (mounted) {
						setError(
							res?.data?.message || "신청서 목록을 불러오지 못했습니다."
						);
						setApps([]);
					}
				}
			} catch (e) {
				if (mounted) {
					setError("신청서 목록 조회 중 오류가 발생했습니다.");
					setApps([]);
				}
			} finally {
				if (mounted) setLoading(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [labId]);

	// 카드용 상위 5개
	const topApps = useMemo(() => apps.slice(0, 5), [apps]);

	// 포맷터
	const fmtDateTime = (v) => {
		if (!v) return "-";
		const d = new Date(v);
		if (isNaN(d)) return v;
		const date = d.toLocaleDateString("ko-KR");
		const time = d
			.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
			.replace(" ", "");
		return `${date} ${time}`;
	};
	const statusBadge = (s) => {
		const map = { PENDING: "대기", APPROVED: "승인", REJECTED: "거절" };
		return map[s] || s || "-";
	};
	const applicantLabelOf = (app) =>
		app?.user?.name ||
		app?.userName ||
		app?.applicantName ||
		app?.user?.email ||
		app?.userEmail ||
		(app?.userId ? `신청자 #${app.userId}` : `신청 #${app?.id}`);

	// 모달 열릴 때 초기화
	useEffect(() => {
		if (open) {
			setVisibleCount(20);
			setSelectedApp(null); // 새로 열면 목록부터
		}
	}, [open]);

	// 무한스크롤: 모달이 열려 있고, 상세가 아닐 때만 동작
	useEffect(() => {
		if (!open || selectedApp) return;
		const el = loaderRef.current;
		if (!el) return;

		const obs = new IntersectionObserver(
			(entries) => {
				const target = entries[0];
				if (target.isIntersecting) {
					setVisibleCount((prev) => {
						const next = prev + 20;
						return next > apps.length ? apps.length : next;
					});
				}
			},
			{ root: null, rootMargin: "200px", threshold: 0 }
		);

		obs.observe(el);
		return () => obs.disconnect();
	}, [open, selectedApp, apps.length]);

	// 모달에서 실제 렌더링 할 슬라이스
	const modalSlice = useMemo(
		() => apps.slice(0, visibleCount),
		[apps, visibleCount]
	);

	// 카드 전체 클릭으로도 모달 열기(신청자가 1명 이상일 때)
	const canOpen = apps.length > 0;

	// 공통 아이템 렌더러
	const renderItem = (app, opts = { compact: false, onClick: null }) => {
		const interviewTime =
			app.interviewTime || app.slotStartTime || app.slot?.startTime;
		const when = interviewTime ? fmtDateTime(interviewTime) : "-";
		const applied = app.appliedAt ? fmtDateTime(app.appliedAt) : "-";
		const applicant = applicantLabelOf(app);

		return (
			<li
				key={app.id}
				className="application-item"
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					padding: opts.compact ? 0 : "8px 0",
					borderBottom: opts.compact
						? "none"
						: "1px solid rgba(255,255,255,0.06)",
					marginBottom: opts.compact ? "0.5rem" : 0,
					gap: "0.75rem",
					cursor: "pointer",
				}}
				onClick={opts.onClick}
				title="신청 상세 보기"
			>
				<div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
					{!opts.compact && (
						<div
							aria-hidden
							style={{
								width: 28,
								height: 28,
								borderRadius: "50%",
								background: "#2b2f4a",
								display: "grid",
								placeItems: "center",
								fontSize: 12,
								color: "#d6e1ff",
								fontWeight: 700,
								flexShrink: 0,
							}}
						>
							{String(applicant).trim().charAt(0).toUpperCase()}
						</div>
					)}

					<div style={{ display: "flex", flexDirection: "column" }}>
						<span style={{ fontWeight: 600 }}>
							{opts.compact ? `👤 ${applicant}` : `👤 ${applicant}`}
						</span>
						<span style={{ color: "#b6c6e3", fontSize: "0.92rem" }}>
							면접 {when} • 신청 {applied}
						</span>
					</div>
				</div>

				<span
					style={{
						fontWeight: 700,
						fontSize: "0.95rem",
						color:
							app.status === "APPROVED"
								? "#00b894"
								: app.status === "REJECTED"
								? "#d63031"
								: "#b6c6e3",
						whiteSpace: "nowrap",
					}}
				>
					{statusBadge(app.status)}
				</span>
			</li>
		);
	};

	// ===== 승인/거절 핸들러 =====
	const [actionLoading, setActionLoading] = useState(false);
	const [actionError, setActionError] = useState("");

	const approveApp = async (app) => {
		if (!app) return;
		setActionError("");
		setActionLoading(true);
		try {
			const res = await api.put(
				`/api/labs/${labId}/applications/${app.id}/approve`,
				undefined,
				{
					headers: { Accept: "*/*" },
					validateStatus: () => true,
				}
			);
			if (res.status === 204) {
				// 로컬 상태 업데이트
				setApps((prev) =>
					prev.map((x) => (x.id === app.id ? { ...x, status: "APPROVED" } : x))
				);
				setSelectedApp((prev) =>
					prev ? { ...prev, status: "APPROVED" } : prev
				);
			} else if (res.status === 403) {
				setActionError("권한이 없습니다.");
			} else {
				setActionError("승인에 실패했습니다.");
			}
		} catch (e) {
			setActionError("네트워크 오류로 승인에 실패했습니다.");
		} finally {
			setActionLoading(false);
		}
	};

	const rejectApp = async (app) => {
		if (!app) return;
		setActionError("");
		setActionLoading(true);
		try {
			const res = await api.put(
				`/api/labs/${labId}/applications/${app.id}/reject`,
				undefined,
				{
					headers: { Accept: "*/*" },
					validateStatus: () => true,
				}
			);
			if (res.status === 204) {
				// 로컬 상태 업데이트
				setApps((prev) =>
					prev.map((x) => (x.id === app.id ? { ...x, status: "REJECTED" } : x))
				);
				setSelectedApp((prev) =>
					prev ? { ...prev, status: "REJECTED" } : prev
				);
			} else if (res.status === 403) {
				setActionError("권한이 없습니다.");
			} else {
				setActionError("거절에 실패했습니다.");
			}
		} catch (e) {
			setActionError("네트워크 오류로 거절에 실패했습니다.");
		} finally {
			setActionLoading(false);
		}
	};

	return (
		<>
			{/* 카드 (미리보기 5명, 클릭 시 모달 오픈) */}
			<div
				className="mainlab-card"
				onClick={() => {
					if (canOpen) setOpen(true);
				}}
				style={{ cursor: canOpen ? "pointer" : "default" }}
			>
				<div className="mylab-card-title">📝 면접 신청자</div>

				{loading ? (
					<div style={{ color: "#b6c6e3" }}>불러오는 중…</div>
				) : error ? (
					<div style={{ color: "#d66" }}>{error}</div>
				) : topApps.length === 0 ? (
					<div style={{ color: "#b6c6e3" }}>현재 신청 내역이 없습니다.</div>
				) : (
					<ul style={{ padding: 0, listStyle: "none", margin: 0 }}>
						{topApps.map((app) =>
							renderItem(app, {
								compact: true,
								onClick: (e) => {
									e.stopPropagation();
									setOpen(true);
									setSelectedApp(app); // 모달 상세
								},
							})
						)}
					</ul>
				)}

				<div
					className="see-more"
					style={{ color: "#67509C", fontWeight: 700, marginTop: "0.7rem" }}
					onClick={(e) => {
						e.stopPropagation();
						if (canOpen) setOpen(true);
					}}
				>
					➕ 전체 보기
				</div>
			</div>

			{/* 모달 */}
			{open && (
				<div
					role="dialog"
					aria-modal="true"
					onClick={() => setOpen(false)}
					style={{
						position: "fixed",
						inset: 0,
						background: "rgba(0,0,0,0.5)",
						zIndex: 9999,
						display: "grid",
						placeItems: "center",
						padding: 16,
					}}
				>
					<div
						className="mylab-card"
						onClick={(e) => e.stopPropagation()}
						style={{
							width: "min(880px, 96vw)",
							maxHeight: "80vh",
							overflow: "hidden",
							display: "flex",
							flexDirection: "column",
						}}
					>
						<div
							className="mylab-card-title"
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<span>
								{selectedApp ? "📝 신청자 상세" : "📝 면접 신청자 전체 목록"}
							</span>
							<button
								onClick={() => {
									if (selectedApp) setSelectedApp(null); // 상세 → 목록
									else setOpen(false); // 목록 → 모달 닫기
								}}
								style={{
									border: "none",
									background: "transparent",
									fontSize: 18,
									fontWeight: 700,
									color: "#b6c6e3",
									cursor: "pointer",
								}}
								aria-label="닫기"
								title="닫기"
							>
								✕
							</button>
						</div>

						{/* 스크롤 영역 */}
						<div
							style={{
								overflowY: "auto",
								padding: "8px 12px 12px",
								borderTop: "1px solid rgba(255,255,255,0.06)",
								flex: 1,
							}}
						>
							{selectedApp ? (
								<AppDetail
									app={selectedApp}
									fmtDateTime={fmtDateTime}
									statusBadge={statusBadge}
									applicantLabelOf={applicantLabelOf}
									onBack={() => setSelectedApp(null)}
									onApprove={() => approveApp(selectedApp)}
									onReject={() => rejectApp(selectedApp)}
									actionLoading={actionLoading}
									actionError={actionError}
								/>
							) : (
								<>
									{apps.length === 0 ? (
										<div style={{ color: "#b6c6e3" }}>
											신청 내역이 없습니다.
										</div>
									) : (
										<ul style={{ padding: 0, listStyle: "none", margin: 0 }}>
											{modalSlice.map((app) =>
												renderItem(app, {
													compact: false,
													onClick: () => setSelectedApp(app),
												})
											)}
										</ul>
									)}

									{visibleCount < apps.length && (
										<div
											ref={loaderRef}
											style={{
												padding: "12px 0",
												textAlign: "center",
												color: "#b6c6e3",
												fontSize: "0.92rem",
											}}
										>
											더 불러오는 중…
										</div>
									)}
								</>
							)}
						</div>
					</div>
				</div>
			)}
		</>
	);
}

/* ===== 상세 표시용 서브컴포넌트 (승인/거절 버튼 포함) ===== */
function AppDetail({
	app,
	fmtDateTime,
	statusBadge,
	applicantLabelOf,
	onBack,
	onApprove,
	onReject,
	actionLoading,
	actionError,
}) {
	const interviewTime =
		app.interviewTime || app.slotStartTime || app.slot?.startTime;
	const when = interviewTime ? fmtDateTime(interviewTime) : "-";
	const applied = app.appliedAt ? fmtDateTime(app.appliedAt) : "-";
	const applicant = applicantLabelOf(app);

	const disabledAll =
		actionLoading || app.status === "APPROVED" || app.status === "REJECTED";

	return (
		<div style={{ padding: "4px 2px" }}>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 12,
					marginBottom: 8,
				}}
			>
				<div
					aria-hidden
					style={{
						width: 36,
						height: 36,
						borderRadius: "50%",
						background: "#2b2f4a",
						display: "grid",
						placeItems: "center",
						fontSize: 14,
						color: "#d6e1ff",
						fontWeight: 700,
						flexShrink: 0,
					}}
				>
					{String(applicant).trim().charAt(0).toUpperCase()}
				</div>
				<div style={{ display: "flex", flexDirection: "column" }}>
					<div style={{ fontWeight: 700, fontSize: 18 }}>👤 {applicant}</div>
					<div style={{ color: "#b6c6e3", fontSize: 14 }}>
						상태: <b>{statusBadge(app.status)}</b>
					</div>
				</div>
			</div>

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "120px 1fr",
					rowGap: 8,
					columnGap: 12,
					fontSize: 14,
				}}
			>
				<div style={{ color: "#b6c6e3" }}>면접 시간</div>
				<div>{when}</div>

				<div style={{ color: "#b6c6e3" }}>신청일</div>
				<div>{applied}</div>

				{"slotId" in app && (
					<>
						<div style={{ color: "#b6c6e3" }}>슬롯 ID</div>
						<div>{app.slotId ?? "-"}</div>
					</>
				)}

				{"interviewTime" in app && (
					<>
						<div style={{ color: "#b6c6e3" }}>interviewTime</div>
						<div>{app.interviewTime ?? "-"}</div>
					</>
				)}

				{"notes" in app && (
					<>
						<div style={{ color: "#b6c6e3" }}>메모</div>
						<div style={{ whiteSpace: "pre-wrap" }}>{app.notes || "-"}</div>
					</>
				)}
			</div>

			{/* 승인/거절 액션 */}
			<div
				style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center" }}
			>
				<button
					onClick={onApprove}
					disabled={disabledAll}
					className="btn-approve"
					style={{
						border: "1px solid rgba(0,184,148,0.4)",
						background:
							app.status === "APPROVED"
								? "rgba(0,184,148,0.15)"
								: "transparent",
						padding: "6px 10px",
						borderRadius: 8,
						color: "#00b894",
						cursor: disabledAll ? "not-allowed" : "pointer",
						fontWeight: 700,
					}}
					title="승인"
				>
					{actionLoading && app.status !== "APPROVED" ? "처리 중…" : "승인"}
				</button>

				<button
					onClick={onReject}
					disabled={disabledAll}
					className="btn-reject"
					style={{
						border: "1px solid rgba(214,48,49,0.4)",
						background:
							app.status === "REJECTED"
								? "rgba(214,48,49,0.15)"
								: "transparent",
						padding: "6px 10px",
						borderRadius: 8,
						color: "#d63031",
						cursor: disabledAll ? "not-allowed" : "pointer",
						fontWeight: 700,
					}}
					title="거절"
				>
					{actionLoading && app.status !== "REJECTED" ? "처리 중…" : "거절"}
				</button>

				<button
					onClick={onBack}
					className="btn-back"
					style={{
						border: "1px solid rgba(255,255,255,0.12)",
						background: "transparent",
						padding: "6px 10px",
						borderRadius: 8,
						color: "#d6e1ff",
						cursor: "pointer",
						fontWeight: 700,
						marginLeft: "auto",
					}}
					title="목록으로"
				>
					← 목록으로
				</button>
			</div>

			{actionError && (
				<div style={{ marginTop: 8, color: "#d63031", fontSize: 14 }}>
					{actionError}
				</div>
			)}
		</div>
	);
}

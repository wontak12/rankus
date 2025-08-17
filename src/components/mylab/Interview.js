// src/pages/Interview.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api";
import "../../styles/MyLab.css";

/* ===== 날짜/표시 유틸 ===== */
function fmtDate(v) {
	if (!v) return "-";
	const d = new Date(v);
	if (Number.isNaN(d.getTime())) return v;
	return d.toLocaleString("ko-KR", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}
function todayStr() {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}
// datetime-local -> ISO8601(+offset)
function toIsoWithOffset(local) {
	if (!local) return "";
	const [date, t] = local.split("T");
	if (!date || !t) return local;
	const [hh = "00", mm = "00"] = t.split(":");
	const ss = "00";
	const dt = new Date(`${date}T${hh}:${mm}:${ss}`);
	const offsetMin = -dt.getTimezoneOffset(); // KST: +540
	const sign = offsetMin >= 0 ? "+" : "-";
	const abs = Math.abs(offsetMin);
	const offHH = String(Math.floor(abs / 60)).padStart(2, "0");
	const offMM = String(abs % 60).padStart(2, "0");
	return `${date}T${hh}:${mm}:${ss}${sign}${offHH}:${offMM}`;
}

/* ===== 디버그 유틸 ===== */
const DEBUG_INT = true;
function shortToken(t, n = 16) {
	return t ? `${t.slice(0, n)}…` : "∅";
}
function curlGetInterviews(id, base = "http://3.34.229.56:8080") {
	const at = localStorage.getItem("accessToken");
	return [
		`curl -i -X GET '${base}/api/labs/${id}/interviews'`,
		`  -H 'accept: application/json'`,
		at ? `  -H 'Authorization: Bearer ${at}'` : null,
	]
		.filter(Boolean)
		.join(" \\\n");
}
function curlPostInterview(id, body, base = "http://3.34.229.56:8080") {
	const at = localStorage.getItem("accessToken");
	const data = JSON.stringify(body).replace(/"/g, '\\"');
	return [
		`curl -i -X POST '${base}/api/labs/${id}/interviews'`,
		`  -H 'accept: application/json'`,
		`  -H 'content-type: application/json'`,
		at ? `  -H 'Authorization: Bearer ${at}'` : null,
		`  -d "${data}"`,
	]
		.filter(Boolean)
		.join(" \\\n");
}

/* ===== 슬롯용 디버그 유틸 ===== */
function curlGetSlots(labId, interviewId, base = "http://3.34.229.56:8080") {
	const at = localStorage.getItem("accessToken");
	return [
		`curl -i -X GET '${base}/api/labs/${labId}/interviews/${interviewId}/slots'`,
		`  -H 'accept: application/json'`,
		at ? `  -H 'Authorization: Bearer ${at}'` : null,
	]
		.filter(Boolean)
		.join(" \\\n");
}
function curlPostSlot(
	labId,
	interviewId,
	body,
	base = "http://3.34.229.56:8080"
) {
	const at = localStorage.getItem("accessToken");
	const data = JSON.stringify(body).replace(/"/g, '\\"');
	return [
		`curl -i -X POST '${base}/api/labs/${labId}/interviews/${interviewId}/slots'`,
		`  -H 'accept: application/json'`,
		`  -H 'content-type: application/json'`,
		at ? `  -H 'Authorization: Bearer ${at}'` : null,
		`  -d "${data}"`,
	]
		.filter(Boolean)
		.join(" \\\n");
}

export default function Interview({ labId: propLabId }) {
	const { labId: paramLabId, id: paramId } = useParams();
	const labId = propLabId ?? paramLabId ?? paramId;

	const [loading, setLoading] = useState(true);
	const [errMsg, setErrMsg] = useState("");
	const [items, setItems] = useState([]);

	// 생성 폼 상태(면접 자체)
	const [createOpen, setCreateOpen] = useState(false);
	const [creating, setCreating] = useState(false);
	const [createErr, setCreateErr] = useState("");
	const [fieldErrs, setFieldErrs] = useState({});
	const [createMsg, setCreateMsg] = useState("");
	const [form, setForm] = useState({
		startDate: todayStr(),
		endDate: todayStr(),
		durationMinutes: 30,
		maxApplicantsPerSlot: 1,
	});

	// 목록 불러오기(면접)
	const fetchList = async (id) => {
		if (!id) return;
		if (DEBUG_INT) {
			const at = localStorage.getItem("accessToken");
			console.groupCollapsed(
				"%c[Interview] GET list",
				"color:#09f;font-weight:bold"
			);
			console.log("Authorization(short):", shortToken(at));
			console.log("cURL:\n" + curlGetInterviews(id));
			console.groupEnd();
		}

		try {
			const res = await api.get(`/api/labs/${id}/interviews`, {
				headers: { Accept: "application/json" },
			});
			const payload = res?.data;
			const listRaw = Array.isArray(payload?.data)
				? payload.data
				: payload?.data
				? [payload.data]
				: [];
			const sorted = [...listRaw].sort(
				(a, b) => new Date(a.startDate) - new Date(b.startDate)
			);
			setItems(sorted);
			setErrMsg("");
		} catch (err) {
			console.error(
				"[Interview] GET /api/labs/{labId}/interviews failed:",
				err?.response?.status,
				err?.response?.data || err
			);
			setErrMsg("면접 일정 목록을 불러오지 못했습니다.");
			setItems([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		let mounted = true;
		if (!labId) {
			setErrMsg("랩실 ID가 없습니다.");
			setLoading(false);
			return;
		}
		(async () => {
			await fetchList(labId);
			if (!mounted) return;
		})();
		return () => {
			mounted = false;
		};
	}, [labId]);

	// 폼 보조: 종료일 최소 = 시작일
	useEffect(() => {
		if (form.endDate && form.startDate && form.endDate < form.startDate) {
			setForm((f) => ({ ...f, endDate: f.startDate }));
		}
	}, [form.startDate]); // eslint-disable-line

	// 면접 생성 핸들러
	const handleCreate = async (e) => {
		e.preventDefault();
		if (!labId) return;

		setCreateErr("");
		setFieldErrs({});
		setCreateMsg("");

		const payload = {
			startDate: form.startDate?.trim(),
			endDate: form.endDate?.trim(),
			durationMinutes: Number(form.durationMinutes),
			maxApplicantsPerSlot: Number(form.maxApplicantsPerSlot),
		};

		// 최소 검증
		if (!payload.startDate || !payload.endDate) {
			setCreateErr("시작일/종료일을 선택하세요.");
			return;
		}
		if (payload.startDate > payload.endDate) {
			setCreateErr("종료일은 시작일 이후여야 합니다.");
			return;
		}
		if (
			!Number.isFinite(payload.durationMinutes) ||
			payload.durationMinutes < 1
		) {
			setCreateErr("슬롯 길이는 1분 이상이어야 합니다.");
			return;
		}
		if (
			!Number.isFinite(payload.maxApplicantsPerSlot) ||
			payload.maxApplicantsPerSlot < 1
		) {
			setCreateErr("슬롯당 최대 인원은 1명 이상이어야 합니다.");
			return;
		}

		if (DEBUG_INT) {
			const at = localStorage.getItem("accessToken");
			console.groupCollapsed(
				`%c[Interview] POST /api/labs/${labId}/interviews`,
				"color:#0a0;font-weight:bold"
			);
			console.log("Authorization(short):", shortToken(at));
			console.log("payload:", payload);
			console.log("cURL:\n" + curlPostInterview(labId, payload));
			console.groupEnd();
		}

		setCreating(true);
		try {
			const res = await api.post(`/api/labs/${labId}/interviews`, payload, {
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				validateStatus: () => true,
			});

			console.log("[Interview] create status:", res.status, "data:", res?.data);
			window.__interview_create__ = {
				status: res.status,
				data: res?.data,
				payload,
			};

			if (res.status === 201 || res?.data?.success === true) {
				setCreateMsg("면접 일정이 생성되었습니다.");
				const created = res?.data?.data;
				if (created && typeof created === "object") {
					setItems((prev) =>
						[...prev, created].sort(
							(a, b) => new Date(a.startDate) - new Date(b.startDate)
						)
					);
				} else {
					await fetchList(labId);
				}
				return;
			}

			const serverMsg = res?.data?.message || "요청이 거절되었습니다.";
			const serverErrors = res?.data?.errors;
			let fields = {};
			if (Array.isArray(serverErrors)) {
				serverErrors.forEach((e) => {
					if (e?.field) fields[e.field] = e?.message;
				});
			}
			setCreateErr(serverMsg);
			setFieldErrs(fields);

			console.groupCollapsed(
				"%c[Interview] create -> error detail",
				"color:#f80"
			);
			console.log("server.message:", serverMsg);
			console.log("server.errors:", serverErrors);
			console.groupEnd();
		} catch (err) {
			console.error(
				"[Interview] create error:",
				err?.response?.status,
				err?.response?.data || err
			);
			setCreateErr("요청 중 오류가 발생했습니다.");
		} finally {
			setCreating(false);
		}
	};

	if (loading) return <div style={{ padding: 16 }}>불러오는 중...</div>;
	if (errMsg) return <div style={{ padding: 16 }}>{errMsg}</div>;

	return (
		<div className="mylab-card">
			<div style={{ padding: 16 }}>
				<div
					style={{
						display: "flex",
						gap: 8,
						alignItems: "center",
						marginBottom: 12,
					}}
				>
					<h2 style={{ margin: 0, flex: "0 0 auto" }}>면접 일정</h2>
					<button
						className="mylab-interview-btn"
						onClick={() => setCreateOpen((v) => !v)}
						style={{ marginLeft: "auto" }}
					>
						{createOpen ? "면접 일정 생성 닫기" : "면접 일정 생성"}
					</button>
					<button
						className="mylab-interview-btn"
						onClick={() => fetchList(labId)}
					>
						새로고침
					</button>
				</div>

				{/* 면접 생성 폼 */}
				{createOpen && (
					<form
						onSubmit={handleCreate}
						style={{
							border: "1px solid #eee",
							borderRadius: 12,
							padding: 12,
							marginBottom: 16,
							background: "#fafafa",
						}}
					>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: 12,
							}}
						>
							<div>
								<label>시작일</label>
								<input
									type="date"
									value={form.startDate}
									min={todayStr()}
									onChange={(e) =>
										setForm((f) => ({ ...f, startDate: e.target.value }))
									}
									required
									disabled={creating}
								/>
								{fieldErrs.startDate && (
									<div style={{ color: "#b00020" }}>{fieldErrs.startDate}</div>
								)}
							</div>
							<div>
								<label>종료일</label>
								<input
									type="date"
									value={form.endDate}
									min={form.startDate || todayStr()}
									onChange={(e) =>
										setForm((f) => ({ ...f, endDate: e.target.value }))
									}
									required
									disabled={creating}
								/>
								{fieldErrs.endDate && (
									<div style={{ color: "#b00020" }}>{fieldErrs.endDate}</div>
								)}
							</div>
							<div>
								<label>슬롯 길이(분)</label>
								<input
									type="number"
									min="1"
									step="1"
									value={form.durationMinutes}
									onChange={(e) =>
										setForm((f) => ({ ...f, durationMinutes: e.target.value }))
									}
									required
									disabled={creating}
								/>
								{fieldErrs.durationMinutes && (
									<div style={{ color: "#b00020" }}>
										{fieldErrs.durationMinutes}
									</div>
								)}
							</div>
							<div>
								<label>슬롯당 최대 인원(명)</label>
								<input
									type="number"
									min="1"
									step="1"
									value={form.maxApplicantsPerSlot}
									onChange={(e) =>
										setForm((f) => ({
											...f,
											maxApplicantsPerSlot: e.target.value,
										}))
									}
									required
									disabled={creating}
								/>
								{fieldErrs.maxApplicantsPerSlot && (
									<div style={{ color: "#b00020" }}>
										{fieldErrs.maxApplicantsPerSlot}
									</div>
								)}
							</div>
						</div>

						{createErr && (
							<div
								style={{
									color: "#b00020",
									marginTop: 8,
									whiteSpace: "pre-line",
								}}
							>
								{createErr}
							</div>
						)}
						{createMsg && (
							<div style={{ color: "#0a7", marginTop: 8 }}>{createMsg}</div>
						)}

						<div
							style={{
								marginTop: 12,
								display: "flex",
								gap: 8,
								alignItems: "center",
							}}
						>
							<button
								className="mylab-interview-btn"
								type="submit"
								disabled={creating}
							>
								{creating ? "생성 중..." : "면접 일정 생성하기"}
							</button>
							<button
								type="button"
								onClick={() =>
									setForm((f) => ({
										...f,
										startDate: todayStr(),
										endDate: todayStr(),
										durationMinutes: 30,
										maxApplicantsPerSlot: 2,
									}))
								}
								disabled={creating}
							>
								예시값(오늘·30분·2명)
							</button>
						</div>
					</form>
				)}

				{/* 면접 목록 + 각 면접의 슬롯 패널 */}
				{items.length === 0 ? (
					<div>등록된 면접 일정이 없습니다.</div>
				) : (
					<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
						{items.map((it) => (
							<li
								key={
									it.id ?? `${it.startDate}-${it.endDate}-${it.durationMinutes}`
								}
								style={{
									border: "1px solid #eee",
									borderRadius: 12,
									padding: 12,
									marginBottom: 16,
								}}
							>
								<div style={{ fontWeight: 700, marginBottom: 6 }}>
									{it.labName || `랩실 #${it.labId || labId}`} — 면접 #{it.id}
								</div>
								<div>
									기간: {it.startDate} ~ {it.endDate}
								</div>
								<div>슬롯 길이: {it.durationMinutes ?? 0}분</div>
								<div>슬롯당 최대 인원: {it.maxApplicantsPerSlot ?? 0}명</div>
								<div>상태: {it.status ?? "-"}</div>
								<div style={{ color: "#666", marginTop: 6 }}>
									생성: {fmtDate(it.createdAt)} / 수정: {fmtDate(it.updatedAt)}
								</div>

								{/* ▼▼ 면접별 슬롯 패널 ▼▼ */}
								<SlotsPanel labId={labId} interviewId={it.id} />
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

/* =========================
   면접별 슬롯 패널 (목록 + 생성)
   ========================= */
function SlotsPanel({ labId, interviewId, interviewMeta }) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [items, setItems] = useState([]);
	const [errMsg, setErrMsg] = useState("");

	// 생성 폼
	const [creating, setCreating] = useState(false);
	const [createMsg, setCreateMsg] = useState("");
	const [createErr, setCreateErr] = useState("");
	const [fieldErrs, setFieldErrs] = useState({});
	const [slotForm, setSlotForm] = useState({
		startLocal: "",
		endLocal: "",
		maxApplicants: 1,
	});

	// ✅ UTC Z(+밀리초)로 변환: 2025-08-17T06:25:50.000Z
	function toUtcZ(local) {
		if (!local) return "";
		const d = new Date(local); // datetime-local은 로컬시간으로 해석됨
		const yyyy = d.getUTCFullYear();
		const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
		const dd = String(d.getUTCDate()).padStart(2, "0");
		const HH = String(d.getUTCHours()).padStart(2, "0");
		const MM = String(d.getUTCMinutes()).padStart(2, "0");
		const SS = String(d.getUTCSeconds()).padStart(2, "0");
		const ms = String(d.getUTCMilliseconds()).padStart(3, "0");
		return `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}.${ms}Z`;
	}

	// 면접 기간/길이 제약(있으면 적용)
	const interviewStartDate = interviewMeta?.startDate; // 'YYYY-MM-DD'
	const interviewEndDate = interviewMeta?.endDate; // 'YYYY-MM-DD'
	const durationMinExpected = interviewMeta?.durationMinutes;

	// 입력 min/max 보조: 면접기간이 있으면 그 범위로 제한
	const minLocal = interviewStartDate
		? `${interviewStartDate}T00:00`
		: undefined;
	const maxLocal = interviewEndDate ? `${interviewEndDate}T23:59` : undefined;

	// GET 슬롯 목록
	const fetchSlots = async () => {
		setLoading(true);
		if (DEBUG_INT) {
			const at = localStorage.getItem("accessToken");
			console.groupCollapsed(
				"%c[Slots] GET list",
				"color:#09f;font-weight:bold"
			);
			console.log("labId, interviewId:", labId, interviewId);
			console.log("Authorization(short):", shortToken(at));
			console.log("cURL:\n" + curlGetSlots(labId, interviewId));
			console.groupEnd();
		}
		try {
			const res = await api.get(
				`/api/labs/${labId}/interviews/${interviewId}/slots`,
				{ headers: { Accept: "application/json" } }
			);
			const payload = res?.data;
			const list = Array.isArray(payload?.data)
				? payload.data
				: payload?.data
				? [payload.data]
				: [];
			setItems(list);
			setErrMsg("");
		} catch (err) {
			console.error(
				"[Slots] GET failed:",
				err?.response?.status,
				err?.response?.data || err
			);
			setErrMsg("슬롯 목록을 불러오지 못했습니다.");
			setItems([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (open && items.length === 0 && !loading) {
			fetchSlots();
		}
		// eslint-disable-next-line
	}, [open]);

	const handleCreateSlot = async (e) => {
		e.preventDefault();
		setCreateMsg("");
		setCreateErr("");
		setFieldErrs({});

		if (!slotForm.startLocal || !slotForm.endLocal) {
			setCreateErr("시작/종료 시각을 입력하세요.");
			return;
		}
		const start = new Date(slotForm.startLocal);
		const end = new Date(slotForm.endLocal);
		if (
			!(start instanceof Date) ||
			isNaN(start) ||
			!(end instanceof Date) ||
			isNaN(end)
		) {
			setCreateErr("잘못된 날짜/시간 형식입니다.");
			return;
		}
		if (end <= start) {
			setCreateErr("종료 시각은 시작 시각 이후여야 합니다.");
			return;
		}

		// ✅ 면접 기간 범위 체크(있을 때만)
		if (interviewStartDate && interviewEndDate) {
			const startBound = new Date(`${interviewStartDate}T00:00`);
			const endBound = new Date(`${interviewEndDate}T23:59:59.999`);
			if (start < startBound || end > endBound) {
				setCreateErr(
					`슬롯은 면접 기간(${interviewStartDate} ~ ${interviewEndDate}) 안에 있어야 합니다.`
				);
				return;
			}
		}

		// ✅ 길이 일치 체크(있을 때만)
		if (Number.isFinite(durationMinExpected)) {
			const diffMin = Math.round((end - start) / 60000);
			if (diffMin !== Number(durationMinExpected)) {
				setCreateErr(
					`슬롯 길이는 ${durationMinExpected}분이어야 합니다. (현재 ${diffMin}분)`
				);
				return;
			}
		}

		const cap = Number(slotForm.maxApplicants);
		if (!Number.isFinite(cap) || cap < 1) {
			setCreateErr("정원은 1 이상이어야 합니다.");
			return;
		}

		// 🔁 서버가 Z(UTC) 형식을 선호하는 것으로 보이므로 UTC Z로 전송
		const payload = {
			startTime: toUtcZ(slotForm.startLocal),
			endTime: toUtcZ(slotForm.endLocal),
			maxApplicants: cap,
		};

		if (DEBUG_INT) {
			const at = localStorage.getItem("accessToken");
			console.groupCollapsed(
				"%c[Slots] POST create",
				"color:#0a0;font-weight:bold"
			);
			console.log("payload:", payload);
			console.log("Authorization(short):", shortToken(at));
			console.log("cURL:\n" + curlPostSlot(labId, interviewId, payload));
			console.groupEnd();
		}

		setCreating(true);
		try {
			const res = await api.post(
				`/api/labs/${labId}/interviews/${interviewId}/slots`,
				payload,
				{
					headers: {
						Accept: "application/json",
						"Content-Type": "application/json",
					},
					validateStatus: () => true,
				}
			);

			console.log("[Slots] create ->", res.status, res?.data);
			window.__slots_create__ = {
				status: res.status,
				data: res?.data,
				payload,
			};

			// Swagger 예시가 200 OK 이므로 200/201/성공=true 모두 허용
			if (
				res.status === 200 ||
				res.status === 201 ||
				res?.data?.success === true
			) {
				setCreateMsg("슬롯이 생성되었습니다.");
				await fetchSlots();
			} else {
				const msg =
					res?.data?.message || `실패했습니다. (status: ${res.status})`;
				setCreateErr(msg);
				const errs = res?.data?.errors;
				if (Array.isArray(errs)) {
					const map = {};
					errs.forEach((e) => {
						if (e?.field) map[e.field] = e?.message;
					});
					setFieldErrs(map);
				}
			}
		} catch (err) {
			console.error(
				"[Slots] create error:",
				err?.response?.status,
				err?.response?.data || err
			);
			setCreateErr("요청 중 오류가 발생했습니다.");
		} finally {
			setCreating(false);
		}
	};

	return (
		<div style={{ marginTop: 12 }}>
			<button
				className="mylab-interview-btn"
				onClick={() => setOpen((v) => !v)}
				style={{ marginBottom: 8 }}
			>
				{open ? "슬롯 닫기" : "슬롯 보기/추가"}
			</button>

			{open && (
				<div
					style={{
						border: "1px solid #eee",
						borderRadius: 12,
						padding: 12,
						background: "#fafafa",
					}}
				>
					{/* 생성 폼 */}
					<form onSubmit={handleCreateSlot} style={{ marginBottom: 12 }}>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr 0.8fr",
								gap: 12,
								alignItems: "end",
							}}
						>
							<div>
								<label>시작 시각</label>
								<input
									type="datetime-local"
									value={slotForm.startLocal}
									onChange={(e) =>
										setSlotForm((s) => ({ ...s, startLocal: e.target.value }))
									}
									required
									disabled={creating}
								/>
								{fieldErrs.startTime && (
									<div style={{ color: "#b00020" }}>{fieldErrs.startTime}</div>
								)}
							</div>
							<div>
								<label>종료 시각</label>
								<input
									type="datetime-local"
									value={slotForm.endLocal}
									onChange={(e) =>
										setSlotForm((s) => ({ ...s, endLocal: e.target.value }))
									}
									required
									disabled={creating}
								/>
								{fieldErrs.endTime && (
									<div style={{ color: "#b00020" }}>{fieldErrs.endTime}</div>
								)}
							</div>
							<div>
								<label>정원</label>
								<input
									type="number"
									min="1"
									step="1"
									value={slotForm.maxApplicants}
									onChange={(e) =>
										setSlotForm((s) => ({
											...s,
											maxApplicants: e.target.value,
										}))
									}
									required
									disabled={creating}
								/>
								{fieldErrs.maxApplicants && (
									<div style={{ color: "#b00020" }}>
										{fieldErrs.maxApplicants}
									</div>
								)}
							</div>
						</div>

						{createErr && (
							<div
								style={{
									color: "#b00020",
									marginTop: 8,
									whiteSpace: "pre-line",
								}}
							>
								{createErr}
							</div>
						)}
						{createMsg && (
							<div style={{ color: "#0a7", marginTop: 8 }}>{createMsg}</div>
						)}

						<div style={{ marginTop: 10 }}>
							<button
								className="mylab-interview-btn"
								type="submit"
								disabled={creating}
							>
								{creating ? "슬롯 생성 중..." : "슬롯 생성"}
							</button>
						</div>
					</form>

					{/* 슬롯 목록 */}
					{loading ? (
						<div>슬롯 불러오는 중...</div>
					) : errMsg ? (
						<div>{errMsg}</div>
					) : items.length === 0 ? (
						<div>등록된 슬롯이 없습니다.</div>
					) : (
						<ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
							{items.map((s, idx) => (
								<li
									key={s.id ?? idx}
									style={{
										border: "1px solid #e6e6e6",
										borderRadius: 10,
										padding: 10,
										marginBottom: 8,
										background: "#fff",
									}}
								>
									<div style={{ fontWeight: 600, marginBottom: 4 }}>
										슬롯 #{s.id ?? idx}
									</div>
									<div>시작: {fmtDate(s.startTime)}</div>
									<div>종료: {fmtDate(s.endTime)}</div>
									<div>
										정원/신청/남은자리: {s.maxApplicants} /{" "}
										{s.currentApplicants} / {s.availableSpots}
									</div>
									<div>
										상태: {String(s.status ?? "-")} / 이용가능:{" "}
										{String(s.isAvailable)}
									</div>
									<div style={{ color: "#666", marginTop: 4 }}>
										생성: {fmtDate(s.createdAt)} / 수정: {fmtDate(s.updatedAt)}
									</div>
									<details style={{ marginTop: 6 }}>
										<summary>RAW</summary>
										<pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
											{JSON.stringify(s, null, 2)}
										</pre>
									</details>
								</li>
							))}
						</ul>
					)}

					{/* 수동 새로고침 */}
					<div style={{ marginTop: 8 }}>
						<button className="mylab-interview-btn" onClick={fetchSlots}>
							슬롯 목록 새로고침
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

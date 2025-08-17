// src/pages/JoinLab.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import "../styles/JoinLab.css";

// "YYYY-MM-DDTHH:mm" -> "YYYY-MM-DDTHH:mm:00"
// "YYYY-MM-DDTHH:mm:ss+..." -> "YYYY-MM-DDTHH:mm:ss" 로 자르기
function toLocalSeconds(v) {
	if (!v) return "";
	if (v.length === 16) return `${v}:00`;
	if (v.length >= 19) return v.slice(0, 19);
	return v;
}
// "YYYY-MM-DDTHH:mm[:ss]" -> "YYYY-MM-DD HH:mm[:ss]"
function toSpaceFormat(v) {
	if (!v) return "";
	const s = toLocalSeconds(v);
	return s.replace("T", " ");
}
// "YYYY-MM-DDTHH:mm[:ss]" -> "YYYY-MM-DDTHH:mm"
function toLocalMinutes(v) {
	if (!v) return "";
	return v.slice(0, 16);
}

export default function JoinLab() {
	const { id, labId: id2 } = useParams();
	const labId = id ?? id2;
	const navigate = useNavigate();

	const [interviewTime, setInterviewTime] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (success) {
			const t = setTimeout(() => navigate("/home"), 1500);
			return () => clearTimeout(t);
		}
	}, [success, navigate]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!labId) {
			setError("잘못된 경로입니다. 랩실 ID가 없습니다.");
			return;
		}
		if (!interviewTime) {
			setError("면접 시간을 선택하세요.");
			return;
		}

		// 최소 +1분 여유
		const chosen = new Date(interviewTime);
		if (
			Number.isNaN(chosen.getTime()) ||
			chosen <= new Date(Date.now() + 60 * 1000)
		) {
			setError("면접 시간은 현재 시각 이후여야 합니다. (최소 1분 이상)");
			return;
		}

		const url = `/api/labs/${labId}/applications`;
		setLoading(true);

		// 재시도 시나리오들
		const attempts = [
			{
				kind: "json_t_ss",
				data: { interviewTime: toLocalSeconds(interviewTime) },
				headers: { "Content-Type": "application/json" },
			},
			{
				kind: "json_space_ss",
				data: { interviewTime: toSpaceFormat(interviewTime) },
				headers: { "Content-Type": "application/json" },
			},
			{
				kind: "json_t_min",
				data: { interviewTime: toLocalMinutes(interviewTime) },
				headers: { "Content-Type": "application/json" },
			},
			(() => {
				const form = new URLSearchParams();
				form.set("interviewTime", toLocalSeconds(interviewTime));
				return {
					kind: "form_t_ss",
					data: form,
					headers: { "Content-Type": "application/x-www-form-urlencoded" },
				};
			})(),
		];

		try {
			for (const attempt of attempts) {
				const res = await api.post(url, attempt.data, {
					headers: {
						Accept: "application/json",
						...attempt.headers,
					},
					validateStatus: () => true,
				});

				// 성공
				if (res.status === 201 || res?.data?.success === true) {
					setSuccess(true);
					return;
				}

				// 400이 아닌 경우(404/409 등)는 즉시 에러 표시하고 종료
				if (res.status && res.status !== 400) {
					const msg =
						res?.data?.message ||
						(res.status === 404
							? "해당 랩실을 찾을 수 없습니다."
							: res.status === 409
							? "이미 이 랩실에 신청하셨습니다."
							: "요청에 실패했습니다.");
					setError(msg);
					// 디버그
					console.groupCollapsed(
						`%c[JoinLab] ${attempt.kind} -> ${res.status}`,
						"color:#f80;font-weight:bold"
					);
					console.log(
						"payload:",
						attempt.data instanceof URLSearchParams
							? attempt.data.toString()
							: attempt.data
					);
					console.log("response:", res?.data);
					console.groupEnd();
					return;
				}

				// 400이면 다음 포맷으로 재시도
				console.groupCollapsed(
					`%c[JoinLab] ${attempt.kind} -> 400 (retrying)`,
					"color:#999"
				);
				console.log(
					"payload:",
					attempt.data instanceof URLSearchParams
						? attempt.data.toString()
						: attempt.data
				);
				console.log("response:", res?.data);
				console.groupEnd();

				// 슬롯 기반 메시지면 더 시도해도 소용없으니 바로 표시하고 종료
				const m = String(res?.data?.message || "").toLowerCase();
				if (m.includes("slot") || m.includes("슬롯")) {
					setError(
						`${res?.data?.message}\n※ 슬롯 기반 페이지(/slot-based)로 신청해야 할 수 있습니다.`
					);
					return;
				}
			}

			// 모든 시도가 400 → 서버 메시지/필드 에러를 보여줌
			setError(
				"입력값이 유효하지 않습니다. 면접 시간 형식을 다시 선택해주세요."
			);
		} catch (err) {
			const status = err?.response?.status;
			const msg = err?.response?.data?.message;
			if (status === 401) setError("로그인이 필요합니다. 다시 로그인해주세요.");
			else if (status === 403) setError("권한이 없습니다.");
			else if (status === 404) setError("해당 랩실을 찾을 수 없습니다.");
			else if (status === 409) setError("이미 이 랩실에 신청하셨습니다.");
			else setError(msg || "알 수 없는 오류가 발생했습니다.");
			console.error(
				"[JoinLab] submit error:",
				status,
				err?.response?.data || err
			);
		} finally {
			setLoading(false);
		}
	};

	// datetime-local min: 지금 + 5분
	const now5 = new Date(Date.now() + 5 * 60 * 1000);
	const yyyy = now5.getFullYear();
	const mm = String(now5.getMonth() + 1).padStart(2, "0");
	const dd = String(now5.getDate()).padStart(2, "0");
	const HH = String(now5.getHours()).padStart(2, "0");
	const MM = String(now5.getMinutes()).padStart(2, "0");
	const minLocal = `${yyyy}-${mm}-${dd}T${HH}:${MM}`;

	if (success) {
		return (
			<div className="joinlab-root">
				<div className="joinlab-success">
					가입 신청이 완료되었습니다!
					<br />
					승인 후 랩실에 참여하실 수 있습니다.
					<br />
					잠시 후 홈으로 이동합니다.
				</div>
			</div>
		);
	}

	return (
		<div className="joinlab-root">
			<h2 className="joinlab-title">랩실 가입 신청</h2>
			<form className="joinlab-form" onSubmit={handleSubmit}>
				<div className="joinlab-field">
					<label htmlFor="interviewTime">면접 시간</label>
					<input
						id="interviewTime"
						name="interviewTime"
						type="datetime-local"
						value={interviewTime}
						onChange={(e) => setInterviewTime(e.target.value)}
						required
						disabled={loading}
						min={minLocal}
						step="60" // 분 단위
					/>
					<small className="joinlab-help">미래 시각으로 선택하세요.</small>
				</div>

				{error && <div className="joinlab-error">{error}</div>}

				<button className="joinlab-btn" type="submit" disabled={loading}>
					{loading ? "신청 중..." : "가입 신청"}
				</button>
			</form>
		</div>
	);
}

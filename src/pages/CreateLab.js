// src/pages/CreateLab.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // ✅ axios 인스턴스 사용
import "../styles/CreateLab.css";

export default function CreateLab() {
	const navigate = useNavigate();

	const [fields, setFields] = useState({
		name: "",
		category: "",
		description: "",
		professor: "",
		image: "",
		isPublic: true,
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	// 인증 체크: 토큰 없으면 로그인
	useEffect(() => {
		if (!localStorage.getItem("accessToken")) {
			navigate("/login", { replace: true });
		}
	}, [navigate]);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFields((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const payload = {
				requestedLabName: fields.name,
				requestedCategory: fields.category,
				requestedDescription: fields.description,
			};
			console.log("[CreateLab] 요청 바디:", payload);

			// 항상 POST /api/lab-creation-requests
			const res = await api.post("/api/lab-creation-requests", payload);
			console.log("[CreateLab] HTTP", res.status, res.data);

			setSuccess(true);
			setTimeout(() => navigate("/promo"), 1500);
		} catch (err) {
			const status = err.response?.status;
			const msg = err.response?.data?.message || err.message;
			console.error("[CreateLab] 오류", status, err.response?.data || err);

			if (status === 400) setError("입력값을 확인해주세요.");
			else if (status === 409) setError("이미 신청된 랩실입니다.");
			else if (status === 401) setError("로그인이 필요합니다.");
			else if (status >= 500)
				setError("서버 오류입니다. 잠시 후 다시 시도해주세요.");
			else setError(msg);
		} finally {
			setLoading(false);
		}
	};

	if (success) {
		return (
			<div className="createlab-root">
				<div className="createlab-success">
					랩실이 성공적으로 개설되었습니다!
					<br />
					잠시 후 내 랩실로 이동합니다.
				</div>
			</div>
		);
	}

	return (
		<div className="createlab-root">
			<h2 className="createlab-title">랩실 개설</h2>
			<form className="createlab-form" onSubmit={handleSubmit}>
				{/* 랩실 이름 */}
				<div className="createlab-field">
					<label htmlFor="name">랩실 이름 *</label>
					<input
						id="name"
						name="name"
						value={fields.name}
						onChange={handleChange}
						required
						disabled={loading}
						placeholder="랩실명을 입력하세요"
					/>
				</div>

				{/* 카테고리 */}
				<div className="createlab-field">
					<label htmlFor="category">카테고리 *</label>
					<select
						id="category"
						name="category"
						value={fields.category}
						onChange={handleChange}
						required
						disabled={loading}
					>
						<option value="">카테고리를 선택하세요</option>
						<option value="AI">AI</option>
						<option value="IoT">IoT</option>
						<option value="Bio">Bio</option>
						<option value="Robotics">Robotics</option>
						<option value="Other">기타</option>
					</select>
				</div>

				{/* 설명 */}
				<div className="createlab-field">
					<label htmlFor="description">랩실 소개</label>
					<textarea
						id="description"
						name="description"
						value={fields.description}
						onChange={handleChange}
						disabled={loading}
						placeholder="연구실 소개를 입력하세요"
					/>
				</div>

				{/* 담당 교수 (선택 필드) */}
				<div className="createlab-field">
					<label htmlFor="professor">담당 교수</label>
					<input
						id="professor"
						name="professor"
						value={fields.professor}
						onChange={handleChange}
						disabled={loading}
						placeholder="교수명을 입력하세요"
					/>
				</div>

				{/* 대표 이미지 URL (선택 필드) */}
				<div className="createlab-field">
					<label htmlFor="image">대표 이미지 (URL)</label>
					<input
						id="image"
						name="image"
						value={fields.image}
						onChange={handleChange}
						disabled={loading}
						placeholder="이미지 URL을 입력하세요 (선택)"
					/>
				</div>

				{/* 공개 여부 */}
				<div className="createlab-field-checkbox">
					<input
						type="checkbox"
						id="isPublic"
						name="isPublic"
						checked={fields.isPublic}
						onChange={handleChange}
						disabled={loading}
					/>
					<label htmlFor="isPublic">공개 랩실로 등록</label>
				</div>

				{error && <div className="createlab-error">{error}</div>}

				<button className="createlab-btn" type="submit" disabled={loading}>
					개설 신청
				</button>
			</form>
		</div>
	);
}

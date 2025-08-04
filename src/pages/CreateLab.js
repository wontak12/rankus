// src/pages/CreateLab.js
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api"; // ✅ axios 인스턴스 사용
import "../styles/CreateLab.css";

export default function CreateLab() {
	const navigate = useNavigate();
	const { id } = useParams();
	const isEdit = Boolean(id);

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

			// axios 인스턴스로 POST 요청 (인터셉터가 토큰을 붙여줌)
			const res = await api.post(
				isEdit
					? `/api/lab-creation-requests/${id}`
					: "/api/lab-creation-requests",
				payload
			);
			console.log("[CreateLab] HTTP", res.status, res.data);

			// 201 Created
			setSuccess(true);
			setTimeout(() => navigate("/promo"), 1500);
		} catch (err) {
			// axios 에러는 err.response 에 담겨 있음
			const status = err.response?.status;
			const msg = err.response?.data?.message || err.message;
			console.error("[CreateLab] 오류", status, err.response?.data || err);

			if (status === 400) setError("입력값을 확인해주세요.");
			else if (status === 409) setError("이미 신청된 랩실입니다.");
			else if (status === 401) setError("로그인이 필요합니다.");
			else setError(msg);
		} finally {
			setLoading(false);
		}
	};

	if (success) {
		return (
			<div className="createlab-root">
				<div className="createlab-success">
					랩실이 성공적으로 {isEdit ? "수정" : "개설"}되었습니다!
					<br />
					잠시 후 내 랩실로 이동합니다.
				</div>
			</div>
		);
	}

	return (
		<div className="createlab-root">
			<h2 className="createlab-title">
				{isEdit ? "랩실 정보 수정" : "랩실 개설"}
			</h2>
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
					{isEdit ? "수정" : "개설"} 신청
				</button>
			</form>
		</div>
	);
}

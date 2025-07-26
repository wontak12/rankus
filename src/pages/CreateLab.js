import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api"; // ✅ axios 인스턴스 불러오기
import "../styles/CreateLab.css";

function CreateLab() {
	const navigate = useNavigate();
	const { id } = useParams();
	const [fields, setFields] = useState({
		name: "",
		description: "",
		professor: "",
		image: "",
		isPublic: true,
		category: "", // ✅ 카테고리 추가
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFields({
			...fields,
			[name]: type === "checkbox" ? checked : value,
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			await api.post("/api/lab-creation-requests", {
				requestedLabName: fields.name,
				requestedCategory: fields.category,
				requestedDescription: fields.description,
			});

			setSuccess(true);
			setTimeout(() => navigate("/promo"), 1500);
		} catch (err) {
			console.error("랩실 등록 실패:", err);
			setError("랩실 등록에 실패했습니다. 다시 시도해주세요.");
		} finally {
			setLoading(false);
		}
	};

	if (success) {
		return (
			<div className="createlab-root">
				<div className="createlab-success">
					랩실이 성공적으로 {id ? "수정" : "개설"}되었습니다!
					<br />
					잠시 후 내 랩실로 이동합니다.
				</div>
			</div>
		);
	}

	return (
		<div className="createlab-root">
			<h2 className="createlab-title">{id ? "랩실 정보 수정" : "랩실 개설"}</h2>
			<form className="createlab-form" onSubmit={handleSubmit}>
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

				{/* ✅ 카테고리 선택 추가 */}
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
					{id ? "수정" : "개설"} 신청
				</button>
			</form>
		</div>
	);
}

export default CreateLab;

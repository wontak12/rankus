import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api"; // ✅ axios 인스턴스 import
import { useAuth } from "../contexts/AuthContext";
import "../styles/AuthForm.css";

function AuthForm({ mode }) {
	const navigate = useNavigate();
	const { setUser } = useAuth();

	const [fields, setFields] = useState({
		name: "",
		email: "",
		password: "",
		confirm: "",
		studentNumber: "",
		phoneNumber: "",
		grade: "",
		enrollmentStatus: "ENROLLED",
	});

	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFields((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			console.log("📤 제출된 필드 값:", fields);

			if (mode === "login") {
				const { email, password } = fields;

				if (!email || !password) {
					setError("이메일과 비밀번호를 입력하세요.");
					setLoading(false);
					return;
				}

				const res = await api.post(
					"/api/auth/login/v2",
					{ email, password },
					{ headers: { "Content-Type": "application/json" } }
				);

				console.log("✅ 로그인 응답:", res.data);

				if (res.status === 200) {
					const { accessToken, refreshToken, data } = res.data.data;

					console.log("✅ 로그인 응답 토큰 확인:", accessToken, refreshToken);

					const apiUser = data?.user ?? {
						name: data?.name,
						email: data?.email,
					};

					setUser(apiUser);

					try {
						localStorage.setItem("accessToken", accessToken);
						localStorage.setItem("refreshToken", refreshToken);

						console.log(
							"📦 저장된 accessToken:",
							localStorage.getItem("accessToken")
						);
						console.log(
							"📦 저장된 refreshToken:",
							localStorage.getItem("refreshToken")
						);
					} catch (e) {
						console.error("❌ localStorage 저장 오류:", e);
					}

					navigate("/home");
				} else {
					setError(res.data.message || "로그인에 실패했습니다.");
				}
			} else {
				const {
					name,
					email,
					password,
					confirm,
					studentNumber,
					phoneNumber,
					grade,
					enrollmentStatus,
				} = fields;

				if (
					!name ||
					!email ||
					!password ||
					!confirm ||
					!studentNumber ||
					!phoneNumber ||
					!grade ||
					!enrollmentStatus
				) {
					setError("모든 필드를 입력하세요.");
					setLoading(false);
					return;
				}

				if (password.length < 8) {
					setError("비밀번호는 8자 이상이어야 합니다.");
					setLoading(false);
					return;
				}

				if (password !== confirm) {
					setError("비밀번호가 일치하지 않습니다.");
					setLoading(false);
					return;
				}

				if (!/^\d{8,20}$/.test(studentNumber)) {
					setError("학번은 8~20자리 숫자여야 합니다.");
					setLoading(false);
					return;
				}

				const payload = {
					name,
					email,
					password,
					studentNumber,
					phoneNumber,
					grade: Number(grade),
					enrollmentStatus,
				};

				console.log("📤 회원가입 요청 바디:", payload);

				const res = await api.post("/api/auth/signup", payload, {
					headers: {
						"Content-Type": "application/json",
					},
				});

				console.log("✅ 회원가입 응답:", res.data);

				if ([200, 201].includes(res.status)) {
					navigate("/login");
				} else {
					setError(res.data.message || "회원가입에 실패했습니다.");
				}
			}
		} catch (err) {
			console.error("❌ 오류 발생:", err);

			if (err.response) {
				console.error("📨 서버 응답 메시지:", err.response.data);
				setError(err.response.data.message || "요청이 잘못되었습니다.");
			} else {
				console.error("❌ 서버 응답 없음:", err);
				setError("서버 오류가 발생했습니다.");
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className="auth-form-root" onSubmit={handleSubmit}>
			<h2 className="auth-form-title">
				{mode === "login" ? "로그인" : "회원가입"}
			</h2>

			{error && <div className="auth-form-error">{error}</div>}

			{mode === "signup" && (
				<>
					<div className="auth-form-field">
						<label htmlFor="name">이름</label>
						<input
							id="name"
							name="name"
							type="text"
							value={fields.name}
							onChange={handleChange}
							disabled={loading}
						/>
					</div>

					<div className="auth-form-field">
						<label htmlFor="studentNumber">학번</label>
						<input
							id="studentNumber"
							name="studentNumber"
							type="text"
							value={fields.studentNumber}
							onChange={handleChange}
							placeholder="8~20자리 숫자"
							disabled={loading}
						/>
					</div>

					<div className="auth-form-field">
						<label htmlFor="phoneNumber">전화번호</label>
						<input
							id="phoneNumber"
							name="phoneNumber"
							type="text"
							value={fields.phoneNumber}
							onChange={handleChange}
							placeholder="010-1234-5678"
							disabled={loading}
						/>
					</div>

					<div className="auth-form-field">
						<label htmlFor="grade">학년</label>
						<input
							id="grade"
							name="grade"
							type="number"
							value={fields.grade}
							onChange={handleChange}
							placeholder="1~4"
							disabled={loading}
						/>
					</div>

					<div className="auth-form-field">
						<label htmlFor="enrollmentStatus">재학상태</label>
						<select
							id="enrollmentStatus"
							name="enrollmentStatus"
							value={fields.enrollmentStatus}
							onChange={handleChange}
							disabled={loading}
						>
							<option value="ENROLLED">재학</option>
							<option value="LEAVE">휴학</option>
							<option value="GRADUATED">졸업</option>
						</select>
					</div>
				</>
			)}

			<div className="auth-form-field">
				<label htmlFor="email">이메일</label>
				<input
					id="email"
					name="email"
					type="email"
					value={fields.email}
					onChange={handleChange}
					placeholder="이메일을 입력하세요"
					disabled={loading}
				/>
			</div>

			<div className="auth-form-field">
				<label htmlFor="password">비밀번호</label>
				<input
					id="password"
					name="password"
					type="password"
					value={fields.password}
					onChange={handleChange}
					placeholder="비밀번호를 입력하세요"
					disabled={loading}
				/>
			</div>

			{mode === "signup" && (
				<div className="auth-form-field">
					<label htmlFor="confirm">비밀번호 확인</label>
					<input
						id="confirm"
						name="confirm"
						type="password"
						value={fields.confirm}
						onChange={handleChange}
						placeholder="비밀번호를 다시 입력하세요"
						disabled={loading}
					/>
				</div>
			)}

			<button className="auth-form-btn" type="submit" disabled={loading}>
				{mode === "login" ? "로그인" : "회원가입"}
			</button>

			<div
				className="auth-form-link"
				onClick={() => navigate(mode === "login" ? "/signup" : "/login")}
			>
				{mode === "login"
					? "회원가입이 필요하신가요?"
					: "이미 계정이 있으신가요? 로그인"}
			</div>
		</form>
	);
}

export default AuthForm;

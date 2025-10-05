import { useState } from "react";
// useLocation을 추가로 import 합니다.
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/AuthForm.css";

// ✅ 1. BASE_URL 상수를 제거하거나 빈 문자열로 설정합니다.
// const BASE_URL = "http://3.34.229.56:8080"; // ❌ 이 코드를 제거해야 합니다.

export default function AuthForm({ mode }) {
	const navigate = useNavigate();
	// location 객체를 사용하기 위해 useLocation hook을 호출합니다.
	const location = useLocation();
	const { setUser } = useAuth();
	const isLogin = mode === "login";

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
			if (isLogin) {
				// ▶ 로그인
				const { email, password } = fields;
				if (!email || !password) {
					throw new Error("이메일과 비밀번호를 입력하세요.");
				}

				const payload = { email, password };
				console.log("[AuthForm] 로그인 요청 페이로드:", payload); // ✅ 2. BASE_URL을 제거하고 상대 경로(`/api/auth/login`)만 사용합니다.

				const res = await fetch(`/api/auth/login`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const json = await res.json();
				console.log(`[AuthForm] 로그인 HTTP ${res.status}`, json);

				if (!res.ok) {
					throw new Error(json.message || "로그인 실패");
				} // ▶ 토큰 저장

				localStorage.setItem("accessToken", json.data.accessToken);
				localStorage.setItem("refreshToken", json.data.refreshToken);
				console.log(
					"[AuthForm] 저장된 accessToken:",
					localStorage.getItem("accessToken")
				);
				console.log(
					"[AuthForm] 저장된 refreshToken:",
					localStorage.getItem("refreshToken")
				); // ▶ 유저 컨텍스트 저장

				console.log("[AuthForm] setUser 호출, user 정보:", json.data.user);
				setUser(json.data.user);

				// ==========================================================
				// ✨ 여기가 기능이 추가된 부분입니다. ✨
				// ==========================================================

				// 1. URL 쿼리에서 'redirectUrl' 값을 찾아봅니다.
				const params = new URLSearchParams(location.search);
				const redirectUrl = params.get("redirectUrl");

				// 2. 만약 redirectUrl이 있으면 그 주소로 이동시키고,
				if (redirectUrl) {
					// 페이지를 새로고침하며 이동시켜야 출석 페이지의 로직이 다시 실행됩니다.
					window.location.href = redirectUrl;
				} else {
					// redirectUrl이 없으면 원래 코드처럼 /home으로 보냅니다.
					navigate("/home");
				}
			} else {
				// ▶ 회원가입
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
					!grade
				) {
					throw new Error("모든 필드를 입력하세요.");
				}
				if (password.length < 8) {
					throw new Error("비밀번호는 8자 이상이어야 합니다.");
				}
				if (password !== confirm) {
					throw new Error("비밀번호가 일치하지 않습니다.");
				}
				if (!/^\d{8,20}$/.test(studentNumber)) {
					throw new Error("학번은 8~20자리 숫자여야 합니다.");
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
				console.log("[AuthForm] 회원가입 요청 페이로드:", payload); // ✅ 2. BASE_URL을 제거하고 상대 경로(`/api/auth/signup`)만 사용합니다.

				const res = await fetch(`/api/auth/signup`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});
				const json = await res.json();
				console.log(`[AuthForm] 회원가입 HTTP ${res.status}`, json);

				if (!res.ok) {
					throw new Error(json.message || "회원가입 실패");
				}

				navigate("/login");
			}
		} catch (err) {
			console.error("[AuthForm] 오류 발생:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className="auth-form-root" onSubmit={handleSubmit}>
			{" "}
			<h2 className="auth-form-title">{isLogin ? "로그인" : "회원가입"}</h2>
			{error && <div className="auth-form-error">{error}</div>}{" "}
			{!isLogin && (
				<>
					{" "}
					<div className="auth-form-field">
						{" "}
						<label htmlFor="name">이름</label>{" "}
						<input
							id="name"
							name="name"
							value={fields.name}
							onChange={handleChange}
							disabled={loading}
						/>{" "}
					</div>{" "}
					<div className="auth-form-field">
						{" "}
						<label htmlFor="studentNumber">학번</label>{" "}
						<input
							id="studentNumber"
							name="studentNumber"
							placeholder="8~20자리 숫자"
							value={fields.studentNumber}
							onChange={handleChange}
							disabled={loading}
						/>{" "}
					</div>{" "}
					<div className="auth-form-field">
						{" "}
						<label htmlFor="phoneNumber">전화번호</label>{" "}
						<input
							id="phoneNumber"
							name="phoneNumber"
							placeholder="010-1234-5678"
							value={fields.phoneNumber}
							onChange={handleChange}
							disabled={loading}
						/>{" "}
					</div>{" "}
					<div className="auth-form-field">
						{" "}
						<label htmlFor="grade">학년</label>{" "}
						<input
							id="grade"
							name="grade"
							type="number"
							placeholder="1~4"
							value={fields.grade}
							onChange={handleChange}
							disabled={loading}
						/>{" "}
					</div>{" "}
					<div className="auth-form-field">
						{" "}
						<label htmlFor="enrollmentStatus">재학상태</label>{" "}
						<select
							id="enrollmentStatus"
							name="enrollmentStatus"
							value={fields.enrollmentStatus}
							onChange={handleChange}
							disabled={loading}
						>
							<option value="ENROLLED">재학</option>
							<option value="LEAVE">휴학</option>
							<option value="GRADUATED">졸업</option>{" "}
						</select>{" "}
					</div>{" "}
				</>
			)}{" "}
			<div className="auth-form-field">
				{" "}
				<label htmlFor="email">이메일</label>{" "}
				<input
					id="email"
					name="email"
					type="email"
					value={fields.email}
					onChange={handleChange}
					disabled={loading}
				/>{" "}
			</div>{" "}
			<div className="auth-form-field">
				{" "}
				<label htmlFor="password">비밀번호</label>{" "}
				<input
					id="password"
					name="password"
					type="password"
					value={fields.password}
					onChange={handleChange}
					disabled={loading}
				/>{" "}
			</div>{" "}
			{!isLogin && (
				<div className="auth-form-field">
					{" "}
					<label htmlFor="confirm">비밀번호 확인</label>{" "}
					<input
						id="confirm"
						name="confirm"
						type="password"
						value={fields.confirm}
						onChange={handleChange}
						disabled={loading}
					/>{" "}
				</div>
			)}{" "}
			<button className="auth-form-btn" type="submit" disabled={loading}>
				{" "}
				{isLogin ? "로그인" : "회원가입"}{" "}
			</button>{" "}
			<div
				className="auth-form-link"
				onClick={() => navigate(isLogin ? "/signup" : "/login")}
			>
				{" "}
				{isLogin
					? "회원가입이 필요하신가요?"
					: "이미 계정이 있으신가요? 로그인"}{" "}
			</div>{" "}
		</form>
	);
}

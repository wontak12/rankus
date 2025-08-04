import axios from "axios";
import api from "./api";

const BASE_URL = "http://3.34.229.56:8080";

// 🔹 로그인 - /api/auth/login/v2
export async function login(username, password) {
	try {
		const res = await axios.post(`${BASE_URL}/api/auth/login/v2`, {
			username,
			password,
		});

		const { accessToken, refreshToken } = res.data;
		if (!accessToken || !refreshToken) {
			throw new Error("토큰 응답이 올바르지 않음");
		}

		// 토큰 저장
		localStorage.setItem("accessToken", accessToken);
		localStorage.setItem("refreshToken", refreshToken);

		console.log("✅ 로그인 성공, 토큰 저장 완료");
		return res.data;
	} catch (err) {
		console.error("❌ 로그인 실패", err);
		throw err;
	}
}

// 🔹 로그아웃 - /api/auth/logout
export async function logout() {
	try {
		await api.post("/api/auth/logout");
	} catch (err) {
		console.warn("⚠️ 서버 로그아웃 실패(무시 가능)", err);
	}

	// 로컬 토큰 삭제
	localStorage.removeItem("accessToken");
	localStorage.removeItem("refreshToken");

	console.log("✅ 로그아웃 완료");
}

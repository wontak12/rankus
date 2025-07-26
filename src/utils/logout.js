// src/utils/logout.js
import api from "../api";

export async function logout() {
	try {
		const res = await api.post("/api/auth/logout"); // ✅ accessToken 자동 포함됨
		console.log("🔒 로그아웃 성공:", res.data);
	} catch (err) {
		console.warn("⚠️ 로그아웃 요청 실패:", err.response?.data || err.message);
	} finally {
		// ✅ 로컬 스토리지 초기화
		localStorage.removeItem("accessToken");
		localStorage.removeItem("refreshToken");
		window.location.href = "/login";
	}
}

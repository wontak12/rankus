// src/api.js
import axios from "axios";

// ✅ 자동 로그아웃 + 강제 리디렉션 함수
function forceLogout() {
	localStorage.removeItem("accessToken");
	localStorage.removeItem("refreshToken");
	window.location.href = "/login";
}

const api = axios.create({
	baseURL: "http://3.34.229.56:8080",
	headers: {
		"Content-Type": "application/json",
	},
});

// ✅ 요청 시 accessToken 자동 첨부
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("accessToken");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// ✅ 응답 인터셉터: accessToken 만료 시 refreshToken으로 재발급 시도
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				const refreshToken = localStorage.getItem("refreshToken");
				if (!refreshToken) throw new Error("refreshToken 없음");

				// ✅ refreshToken으로 새로운 accessToken 요청
				const res = await axios.post(
					"http://3.34.229.56:8080/api/auth/refresh",
					{ refreshToken },
					{
						headers: { "Content-Type": "application/json" },
					}
				);

				const newAccessToken = res.data.accessToken;
				if (!newAccessToken) throw new Error("accessToken 응답 없음");

				// ✅ 새 토큰 저장 및 요청 재시도
				localStorage.setItem("accessToken", newAccessToken);
				originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
				return api(originalRequest);
			} catch (refreshError) {
				console.error("❌ 토큰 재발급 실패:", refreshError);
				forceLogout(); // 🔒 재로그인 필요 시 자동 로그아웃
			}
		}

		return Promise.reject(error);
	}
);

export default api;

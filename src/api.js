// src/api.js
import axios from "axios";

// 강제 로그아웃 + /login 리디렉트
export function forceLogout() {
	console.log("[api] 토큰 없음/만료, 로그아웃 처리");
	localStorage.removeItem("accessToken");
	localStorage.removeItem("refreshToken");
	window.location.href = "/login";
}

const BASE_URL = "http://3.34.229.56:8080";

// 1) 일반 요청 인스턴스
// src/api.js
const api = axios.create({
	baseURL: BASE_URL,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json", // ← 이 줄을 추가
	},
});

// 2) 리프레시 전용 인스턴스
const refreshClient = axios.create({
	baseURL: BASE_URL,
	headers: { "Content-Type": "application/json" },
});

// 요청 인터셉터: 항상 accessToken 헤더에 실어 보냄
api.interceptors.request.use((config) => {
	const token = localStorage.getItem("accessToken");
	console.log("[api.request] 토큰 첨부:", token);
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

// 응답 인터셉터: 401 Unauthorized 시 리프레시 시도
api.interceptors.response.use(
	(res) => res,
	async (err) => {
		const orig = err.config;
		console.warn(
			"[api.response] 에러 응답:",
			err.response?.status,
			err.response?.data
		);
		if (err.response?.status === 401 && !orig._retry) {
			orig._retry = true;
			const rt = localStorage.getItem("refreshToken");
			console.log("[api.response] 리프레시 토큰:", rt);
			if (!rt) {
				forceLogout();
				return Promise.reject(err);
			}
			try {
				const r = await refreshClient.post("/api/auth/refresh", {
					refreshToken: rt,
				});
				console.log("[api.refresh] HTTP", r.status, r.data);
				const newAt = r.data.data.accessToken;
				const newRt = r.data.data.refreshToken;
				localStorage.setItem("accessToken", newAt);
				localStorage.setItem("refreshToken", newRt);
				console.log("[api.refresh] 저장된 accessToken:", newAt);
				orig.headers.Authorization = `Bearer ${newAt}`;
				return api(orig);
			} catch (e) {
				console.error("[api.refresh] 토큰 리프레시 실패:", e);
				forceLogout();
				return Promise.reject(e);
			}
		}
		return Promise.reject(err);
	}
);

export default api;

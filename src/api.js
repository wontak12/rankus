// src/api.js
import axios from "axios";

const BASE_URL = "http://3.34.229.56:8080";

// 1) 일반 요청 인스턴스
const api = axios.create({
	baseURL: BASE_URL,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
});

// 2) 리프레시 전용 인스턴스
const refreshClient = axios.create({
	baseURL: BASE_URL,
	headers: { "Content-Type": "application/json" },
});

// 요청 인터셉터: 항상 accessToken 헤더에 실어 보냄 + 토큰 로깅
api.interceptors.request.use((config) => {
	const accessToken = localStorage.getItem("accessToken");
	const refreshToken = localStorage.getItem("refreshToken");
	console.log("[api.request] accessToken:", accessToken);
	console.log("[api.request] refreshToken:", refreshToken);

	if (accessToken) {
		config.headers.Authorization = `Bearer ${accessToken}`;
	}
	return config;
});

// 응답 인터셉터: 401 Unauthorized 시 리프레시 시도
api.interceptors.response.use(
	(res) => res,
	async (err) => {
		const orig = err.config;
		if (err.response?.status === 401 && !orig._retry) {
			orig._retry = true;
			const rt = localStorage.getItem("refreshToken");
			if (rt) {
				try {
					const r = await refreshClient.post("/api/auth/refresh", {
						refreshToken: rt,
					});
					const {
						data: {
							data: { accessToken: newAt, refreshToken: newRt },
						},
					} = r;
					localStorage.setItem("accessToken", newAt);
					localStorage.setItem("refreshToken", newRt);
					orig.headers.Authorization = `Bearer ${newAt}`;
					return api(orig);
				} catch (refreshError) {
					return Promise.reject(refreshError);
				}
			}
			return Promise.reject(err);
		}
		return Promise.reject(err);
	}
);

export default api;

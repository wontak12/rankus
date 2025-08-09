// src/api.js
import axios from "axios";

const BASE_URL = "http://3.34.229.56:8080";

// -------------------------------
// 옵션: 401 발생 시 동작을 바꾸고 싶으면 setUnauthorizedHandler로 교체하세요.
// 기본 동작: 토큰 제거 후 /login 이동
let onUnauthorized = null;
export function setUnauthorizedHandler(fn) {
	onUnauthorized = typeof fn === "function" ? fn : null;
}
// -------------------------------

const api = axios.create({
	baseURL: BASE_URL,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
});

// 요청 인터셉터: 항상 AT 붙이기
api.interceptors.request.use((config) => {
	const accessToken = localStorage.getItem("accessToken");
	if (accessToken) {
		config.headers.Authorization = `Bearer ${accessToken}`;
	}
	return config;
});

// 응답 인터셉터: 리프레시 없음! 401이면 정리 후 로그인으로.
api.interceptors.response.use(
	(res) => res,
	async (err) => {
		const status = err.response?.status;

		if (status === 401) {
			// 기본 처리: 토큰 제거 + 로그인 페이지로 이동
			if (onUnauthorized) {
				try {
					await onUnauthorized(err);
				} catch (_) {
					// 사용자 핸들러 실패 시에도 기본 안전조치 수행
					localStorage.removeItem("accessToken");
					localStorage.removeItem("refreshToken");
					window.location.assign("/login");
				}
			} else {
				localStorage.removeItem("accessToken");
				localStorage.removeItem("refreshToken");
				window.location.assign("/login");
			}
		}

		// 그 외 상태코드는 그대로 던짐 (403/404/422/500 등)
		return Promise.reject(err);
	}
);

export default api;

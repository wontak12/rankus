// src/api.js
import axios from "axios";

const BASE_URL = "http://3.34.229.56:8080";
// 서버에 맞게 필요 시 바꾸세요
const REFRESH_PATH = "/api/auth/refresh";

/* ========== 훅(선택) ========== */
// 401: 세션 만료 등 → 로그인 이동 전에 커스텀 동작
// 403: 진짜 권한 없음(ROLE 부족)일 때 커스텀 동작
let onUnauthorized = null;
let onForbidden = null;

export function setUnauthorizedHandler(fn) {
	onUnauthorized = typeof fn === "function" ? fn : null;
}
export function setForbiddenHandler(fn) {
	onForbidden = typeof fn === "function" ? fn : null;
}

/* ========== 인스턴스 ========== */
const api = axios.create({
	baseURL: BASE_URL,
	headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// 리프레시 전용(AT 금지)
const refreshClient = axios.create({
	baseURL: BASE_URL,
	headers: { "Content-Type": "application/json", Accept: "application/json" },
});

/* ========== 토큰 유틸 ========== */
const getAT = () => localStorage.getItem("accessToken");
const getRT = () => localStorage.getItem("refreshToken");
const saveTokens = (at, rt) => {
	if (at) localStorage.setItem("accessToken", at);
	if (rt) localStorage.setItem("refreshToken", rt);
};
const clearTokens = () => {
	localStorage.removeItem("accessToken");
	localStorage.removeItem("refreshToken");
};

function gotoLogin() {
	clearTokens();
	if (onUnauthorized) {
		Promise.resolve(onUnauthorized()).catch(() =>
			window.location.assign("/login")
		);
	} else {
		window.location.assign("/login");
	}
}
function handleForbidden() {
	// 토큰은 유지(진짜 권한 부족일 수 있음)
	if (onForbidden) {
		Promise.resolve(onForbidden()).catch(() => {
			alert("권한이 없습니다. (관리자 전용)");
		});
	} else {
		alert("권한이 없습니다. (관리자 전용)");
	}
}

/* ========== 요청 인터셉터: 항상 AT 부착 ========== */
api.interceptors.request.use((config) => {
	const at = getAT();
	if (at) config.headers.Authorization = `Bearer ${at}`;
	return config;
});

/* ========== 401/403 처리 ========== */
let refreshingPromise = null;

async function refreshAccessTokenOnce() {
	if (refreshingPromise) return refreshingPromise;

	const rt = getRT();
	if (!rt) throw new Error("No refresh token");

	refreshingPromise = refreshClient
		.post(REFRESH_PATH, { refreshToken: rt })
		.then((res) => {
			// 서버 응답 스키마에 맞게 파싱 (data or data.data)
			const payload = res?.data?.data ?? res?.data;
			const newAT = payload?.accessToken;
			const newRT = payload?.refreshToken ?? rt;
			if (!newAT) throw new Error("No accessToken in refresh response");
			saveTokens(newAT, newRT);
			return newAT;
		})
		.finally(() => {
			refreshingPromise = null;
		});

	return refreshingPromise;
}

// 403이 JWT 문제일 가능성 판별(간단 휴리스틱)
function looksLikeJwtProblem(err) {
	const msg =
		err?.response?.data?.message ||
		err?.response?.data?.error ||
		err?.response?.data?.detail ||
		"";
	const s = String(msg).toLowerCase();
	return (
		s.includes("jwt") ||
		s.includes("expired") ||
		s.includes("signature") ||
		s.includes("invalid") ||
		s.includes("token")
	);
}

api.interceptors.response.use(
	(res) => res,
	async (err) => {
		const status = err?.response?.status;
		const original = err?.config;
		if (!original) return Promise.reject(err);

		const isRefreshCall =
			original?.url?.includes(REFRESH_PATH) ||
			original?.baseURL + original?.url === BASE_URL + REFRESH_PATH;

		// === 401: 표준 리프레시 1회 후 재시도 ===
		if (status === 401 && !isRefreshCall && !original._retry401) {
			original._retry401 = true;
			try {
				const newAT = await refreshAccessTokenOnce();
				original.headers = original.headers || {};
				original.headers.Authorization = `Bearer ${newAT}`;
				return api(original);
			} catch {
				gotoLogin();
				return Promise.reject(err);
			}
		}

		// === 403: 권한 없음 or 서버가 403으로 JWT 문제를 반환하는 케이스 ===
		if (status === 403 && !isRefreshCall && !original._retry403) {
			original._retry403 = true;

			// 1) 혹시 Authorization 누락이면 한 번 더 붙여서 재시도
			if (!original.headers?.Authorization && getAT()) {
				original.headers = original.headers || {};
				original.headers.Authorization = `Bearer ${getAT()}`;
				return api(original);
			}

			// 2) 메시지가 JWT 문제 같으면 1회 리프레시 후 재시도
			if (looksLikeJwtProblem(err) && !original._triedRefreshOn403) {
				original._triedRefreshOn403 = true;
				try {
					const newAT = await refreshAccessTokenOnce();
					original.headers = original.headers || {};
					original.headers.Authorization = `Bearer ${newAT}`;
					return api(original);
				} catch {
					// 망가진 토큰이 계속 남아있는 증상 방지: 정리 후 로그인
					gotoLogin();
					return Promise.reject(err);
				}
			}

			// 3) 진짜 권한 부족 → 사용자 안내
			handleForbidden();
			return Promise.reject(err);
		}

		// 그 외 상태코드는 그대로 던짐 (404/422/500 등)
		return Promise.reject(err);
	}
);

export default api;

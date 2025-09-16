// src/api.js
import axios from "axios";

// 1. BASE_URL 상수를 제거하고, 환경 변수를 사용하도록 수정합니다.
const REFRESH_PATH = "/api/auth/refresh";

/* ========== 훅(선택) ========== */
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
    // 2. 개발 환경에서는 proxy를 사용하고, 운영(배포) 환경에서는 .env의 주소를 사용합니다.
    baseURL: process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_URL : '/',
    headers: { "Content-Type": "application/json", Accept: "application/json" },
});

const refreshClient = axios.create({
    // 3. 리프레시 클라이언트도 동일하게 수정합니다.
    baseURL: process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_URL : '/',
    headers: { "Content-Type": "application/json", Accept: "application/json" },
});


/* ========== 토큰 유틸 (이하 코드는 원본과 동일) ========== */
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
    if (onForbidden) {
        Promise.resolve(onForbidden()).catch(() => {
            alert("권한이 없습니다.");
        });
    } else {
        alert("권한이 없습니다.");
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

        const isRefreshCall = original?.url?.includes(REFRESH_PATH);

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

        if (status === 403 && !isRefreshCall && !original._retry403) {
            original._retry403 = true;

            if (!original.headers?.Authorization && getAT()) {
                original.headers = original.headers || {};
                original.headers.Authorization = `Bearer ${getAT()}`;
                return api(original);
            }
            if (looksLikeJwtProblem(err) && !original._triedRefreshOn403) {
                original._triedRefreshOn403 = true;
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
            handleForbidden();
            return Promise.reject(err);
        }
        
        return Promise.reject(err);
    }
);

export default api;
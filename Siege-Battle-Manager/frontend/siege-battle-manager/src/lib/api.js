const rawApiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
export const API_BASE = rawApiBase.endsWith("/api")
  ? rawApiBase
  : `${rawApiBase.replace(/\/$/, "")}/api`;

export async function apiFetch(url, options = {}) {
  const rawToken = localStorage.getItem("accessToken");
  const token = rawToken?.trim()?.replace(/^"(.+)"$/, "$1");

  const headers = {
    "Content-Type": "application/json",
    ...(token && token !== "undefined"
      ? { Authorization: `Bearer ${token}` }
      : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(API_BASE + url, { ...options, headers });
  const body = await res.json().catch(() => ({}));

  if (res.status === 401) {
    localStorage.removeItem("accessToken");
    throw new Error("인증이 만료되었습니다. 다시 로그인 해주세요.");
  }

  if (!res.ok) {
    const msg = body?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  if (body?.success === false) {
    throw new Error(body?.message || "요청 실패");
  }

  return body;
}

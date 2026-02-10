export const API_BASE = "http://localhost:8080/api";

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

  const authHeader =
  token && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(API_BASE + url, { ...options, headers });
  const body = await res.json().catch(() => ({}));

    // ✅ HTTP 에러면 여기서 실패 처리
  if (!res.ok) {
    // 서버가 ApiResponse 형태면 message를 활용
    const msg = body?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

    // ✅ ApiResponse success=false도 실패 처리 (중요)
  if (body?.success === false) {
    throw new Error(body?.message || "요청 실패");
  }

  if (res.status === 401) {
    localStorage.removeItem("accessToken");
    throw new Error("인증이 만료되었습니다. 다시 로그인 해주세요.");
    window.location.href = "/login";
    return;
  }

  return body;
}

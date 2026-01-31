export const API_BASE = "http://localhost:8080/api";

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("accessToken");

  const res = await fetch(API_BASE + url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
    return;
  }

  return res.json();
}

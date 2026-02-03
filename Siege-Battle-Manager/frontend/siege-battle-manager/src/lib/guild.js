import { apiFetch } from "./api";

export async function fetchMyGuild() {
  try {
    const res = await apiFetch("/guilds/me");
    return res.data; // 길드 있으면 객체
  } catch (e) {
    // 백엔드 메시지로 길드 없음 판단
    if (String(e.message).includes("가입된 길드가 없습니다")) return null;
    if (String(e.message).includes("404")) return null;
    throw e;
  }
}

export async function createGuild(name) {
  const res = await apiFetch("/guilds", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return res.data;
}

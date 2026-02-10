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

// 길드 생성
export async function createGuild(name, description = "") {
  const res = await apiFetch("/guilds", {
    method: "POST",
    body: JSON.stringify({
    name,
    description
   }),
  });
  
  return res.data; // 예 : { guildId: 1} 또는 길드 정보
}

// 길드 멤버 조회
export async function fetchMyGuildMembers() {
  const res = await apiFetch("/guilds/me/members");
  return res.data;
}



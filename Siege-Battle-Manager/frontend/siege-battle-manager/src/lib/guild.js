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

export async function leaveMyGuild() {
  await apiFetch("/guilds/me/membership", {
    method: "DELETE",
  });
}

export async function createVirtualGuildMember(guildId, displayName) {
  await apiFetch(`/guild-members/${guildId}/virtual`, {
    method: "POST",
    body: JSON.stringify({ displayName }),
  });
}

export async function deleteVirtualGuildMember(guildMemberId) {
  await apiFetch(`/guild-members/${guildMemberId}`, {
    method: "DELETE",
  });
}

export async function updateGuildMemberRole(guildMemberId, role) {
  await apiFetch(`/guild-members/${guildMemberId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function kickGuildMember(guildMemberId) {
  await apiFetch(`/guild-members/${guildMemberId}/real`, {
    method: "DELETE",
  });
}

export async function transferGuildMaster(guildMemberId) {
  await apiFetch(`/guild-members/${guildMemberId}/transfer-master`, {
    method: "PATCH",
  });
}

export async function fetchGuildMemberBans() {
  const res = await apiFetch("/guild-members/bans");
  return Array.isArray(res) ? res : res.data;
}

export async function liftGuildMemberBan(banId) {
  await apiFetch(`/guild-members/bans/${banId}/lift`, {
    method: "PATCH",
  });
}

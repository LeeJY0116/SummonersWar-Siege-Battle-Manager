import { apiFetch } from "./api.js";

export async function fetchAdminGuilds() {
  const body = await apiFetch("/admin/guilds");
  return body.data ?? [];
}

export async function fetchAdminGuildMembers(guildId) {
  const body = await apiFetch(`/admin/guilds/${guildId}/members`);
  return body.data ?? [];
}

export async function fetchAdminGuildMemberHistory(guildMemberId) {
  const body = await apiFetch(`/admin/guilds/members/${guildMemberId}/history`);
  return body.data ?? [];
}

export async function fetchAdminNicknameHistories(guildMemberId) {
  const body = await apiFetch(`/admin/guilds/members/${guildMemberId}/nickname-histories`);
  return body.data ?? [];
}

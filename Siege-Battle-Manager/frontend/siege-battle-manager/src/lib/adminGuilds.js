import { apiFetch } from "./api.js";

export async function fetchAdminGuilds() {
  const body = await apiFetch("/admin/guilds");
  return body.data ?? [];
}

export async function fetchAdminGuildMembers(guildId) {
  const body = await apiFetch(`/admin/guilds/${guildId}/members`);
  return body.data ?? [];
}

export async function fetchAdminAllMembers() {
  const body = await apiFetch("/admin/guilds/members");
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

export async function forceLeaveAdminMember(guildMemberId) {
  await apiFetch(`/admin/guilds/members/${guildMemberId}/membership`, {
    method: "DELETE",
  });
}

export async function changeAdminGuildMemberRole(guildMemberId, role) {
  await apiFetch(`/admin/guilds/members/${guildMemberId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function disbandAdminGuild(guildId) {
  await apiFetch(`/admin/guilds/${guildId}`, {
    method: "DELETE",
  });
}

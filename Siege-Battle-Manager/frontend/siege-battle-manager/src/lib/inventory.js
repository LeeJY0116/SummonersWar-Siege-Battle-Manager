import { apiFetch } from "./api";

/**
 * ✅ 추천 API 형태(예시)
 * GET  /guilds/me/members/{memberId}/inventory
 * PUT  /guilds/me/members/{memberId}/inventory   body: { items: [{monsterId,count}, ...] }
 */

export async function fetchMemberInventory(guildMemberId) {
  const res = await apiFetch(`/guild-members/${guildMemberId}/inventory`);
  return res.data; // [{monsterId, count}, ...]
}

export async function upsertMemberInventoryItems(guildMemberId, items) {
  const res = await apiFetch(`/guild-members/${guildMemberId}/inventory`, {
    method: "PUT",
    body: JSON.stringify({ items }),
  });
  return res.data;
}

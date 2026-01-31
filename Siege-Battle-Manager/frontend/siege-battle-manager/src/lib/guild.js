import { apiFetch } from "./api";

export async function fetchMyGuild() {
  const res = await apiFetch("/guilds/me");
  return res.data;
}

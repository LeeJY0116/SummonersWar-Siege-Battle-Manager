import { apiFetch } from "./api";

export async function syncSwarfarmMonsters() {
  const res = await apiFetch("/admin/monsters/sync-swarfarm", {
    method: "POST",
  });

  return res.data;
}

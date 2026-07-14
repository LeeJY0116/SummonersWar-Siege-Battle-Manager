import { apiFetch } from "./api";

export async function syncSwarfarmMonsters() {
  const res = await apiFetch("/admin/monsters/sync-swarfarm", {
    method: "POST",
  });

  return res.data;
}

export async function getSwarfarmSyncStatus() {
  const res = await apiFetch("/admin/monsters/sync-swarfarm/status");

  return res.data;
}

export async function applyMonsterLocalization() {
  const res = await apiFetch("/admin/monsters/apply-localization", {
    method: "POST",
  });

  return res.data;
}

import { apiFetch } from "./api";

const INVENTORY_CACHE_TTL_MS = 1000 * 30;
const inventoryCache = new Map();
const inventoryRequests = new Map();

function getCacheKey(guildMemberId) {
  return String(guildMemberId ?? "");
}

function cloneItems(items) {
  return (items || []).map((item) => ({ ...item }));
}

function readInventoryCache(guildMemberId) {
  const key = getCacheKey(guildMemberId);
  const cached = inventoryCache.get(key);

  if (!cached) return null;
  if (Date.now() - cached.savedAt > INVENTORY_CACHE_TTL_MS) {
    inventoryCache.delete(key);
    return null;
  }

  return cloneItems(cached.items);
}

export function updateMemberInventoryCache(guildMemberId, items) {
  const key = getCacheKey(guildMemberId);
  inventoryCache.set(key, {
    savedAt: Date.now(),
    items: cloneItems(items),
  });
}

export function clearMemberInventoryCache(guildMemberId) {
  inventoryCache.delete(getCacheKey(guildMemberId));
}

export async function fetchMemberInventory(guildMemberId, options = {}) {
  const forceRefresh = options.forceRefresh === true;
  const key = getCacheKey(guildMemberId);

  if (!forceRefresh) {
    const cached = readInventoryCache(guildMemberId);
    if (cached) return cached;
  } else {
    clearMemberInventoryCache(guildMemberId);
  }

  if (!inventoryRequests.has(key)) {
    const request = apiFetch(`/guild-members/${guildMemberId}/inventory`)
      .then((res) => {
        const items = res.data || [];
        updateMemberInventoryCache(guildMemberId, items);
        return cloneItems(items);
      })
      .finally(() => {
        inventoryRequests.delete(key);
      });

    inventoryRequests.set(key, request);
  }

  return inventoryRequests.get(key);
}

export async function upsertMemberInventoryItems(guildMemberId, items) {
  const res = await apiFetch(`/guild-members/${guildMemberId}/inventory`, {
    method: "PUT",
    body: JSON.stringify({ items }),
  });
  return res.data;
}

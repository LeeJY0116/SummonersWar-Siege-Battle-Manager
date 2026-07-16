import { apiFetch } from "../lib/api.js";
import { formatLeaderEffectText } from "../lib/monsterLabels.js";

const MONSTER_CACHE_KEY = "sw-siege:monsters:v1";
const MONSTER_CACHE_TTL_MS = 1000 * 60 * 60 * 12;

let monsterMemoryCache = null;
let monsterCachePromise = null;

function normalizeMonster(monster) {
  const monsterCode = monster.code ?? monster.monsterCode ?? monster.id;
  const imageUrl = resolveMonsterImageUrl(monster);
  const englishName = monster.name;
  const displayName = monster.koreanName || monster.name;
  const aliases = normalizeMonsterAliases(monster, englishName);

  return {
    ...monster,
    id: monsterCode,
    monsterCode,
    com2usId: monster.com2usId ?? extractCom2usId(monsterCode),
    name: displayName,
    englishName,
    koreanName: monster.koreanName ?? null,
    element: monster.attribute?.toLowerCase?.() ?? monster.element ?? "",
    grade: monster.naturalStars ?? monster.grade ?? null,
    naturalStars: monster.naturalStars ?? null,
    awakeningLevel: monster.awakeningLevel ?? getAwakeningLevel(monsterCode),
    aliases,
    nicknames: aliases,
    iconDataUrl: imageUrl,
    imageUrl,
    enabled: monster.enabled ?? true,
    leaderEffectType: monster.leaderEffectType ?? null,
    leaderEffectAmount: monster.leaderEffectAmount ?? null,
    leaderEffectArea: monster.leaderEffectArea ?? null,
    leaderEffectElement: monster.leaderEffectElement ?? null,
    leaderEffectText: formatLeaderEffectText(monster),
  };
}

function extractCom2usId(monsterCode) {
  const match = String(monsterCode ?? "").match(/^sw_(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function getAwakeningLevel(monsterCode) {
  const com2usId = extractCom2usId(monsterCode);
  const suffix = com2usId % 100;

  if (suffix >= 31 && suffix <= 35) return 2;
  if (suffix >= 11 && suffix <= 15) return 1;
  if (suffix >= 1 && suffix <= 5) return 0;
  return null;
}

function sortMonstersForSelection(monsters) {
  return [...monsters].sort((a, b) => {
    const awakeningDiff = Number(b.awakeningLevel === 2) - Number(a.awakeningLevel === 2);
    if (awakeningDiff !== 0) return awakeningDiff;

    const starsDiff = (b.naturalStars ?? b.grade ?? 0) - (a.naturalStars ?? a.grade ?? 0);
    if (starsDiff !== 0) return starsDiff;

    return (b.com2usId ?? extractCom2usId(b.monsterCode)) - (a.com2usId ?? extractCom2usId(a.monsterCode));
  });
}

function normalizeMonsterAliases(monster, englishName) {
  const aliases = monster.aliases ?? monster.nicknames ?? [];
  const aliasList = Array.isArray(aliases)
    ? aliases
    : String(aliases).split(",");

  return [englishName, ...aliasList]
    .map((alias) => alias?.trim?.() ?? "")
    .filter(Boolean);
}

function resolveMonsterImageUrl(monster) {
  const imageUrl = monster.imageUrl ?? monster.iconDataUrl ?? null;

  if (imageUrl?.startsWith("/monsters/")) {
    return null;
  }

  return imageUrl;
}

function readCachedMonsters() {
  if (monsterMemoryCache?.items?.length > 0) {
    return monsterMemoryCache.items;
  }

  try {
    const raw = localStorage.getItem(MONSTER_CACHE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw);
    const isFresh =
      Array.isArray(cached.items) &&
      Number.isFinite(cached.savedAt) &&
      Date.now() - cached.savedAt < MONSTER_CACHE_TTL_MS;

    if (!isFresh) return null;

    monsterMemoryCache = cached;
    return cached.items;
  } catch (e) {
    console.warn("Failed to read monster cache", e);
    return null;
  }
}

function writeCachedMonsters(items) {
  const cached = {
    savedAt: Date.now(),
    items,
  };

  monsterMemoryCache = cached;

  try {
    localStorage.setItem(MONSTER_CACHE_KEY, JSON.stringify(cached));
  } catch (e) {
    console.warn("Failed to write monster cache", e);
  }
}

export function clearMonsterCache() {
  monsterMemoryCache = null;
  monsterCachePromise = null;

  try {
    localStorage.removeItem(MONSTER_CACHE_KEY);
  } catch (e) {
    console.warn("Failed to clear monster cache", e);
  }
}

async function fetchMonstersFromApi() {
  const body = await apiFetch("/monsters");
  const loadedMonsters = (body.data ?? [])
    .filter((monster) => monster.enabled !== false)
    .map(normalizeMonster);

  return sortMonstersForSelection(loadedMonsters);
}

export async function getMonsters(options = {}) {
  const forceRefresh = options.forceRefresh === true;

  if (!forceRefresh) {
    const cachedMonsters = readCachedMonsters();
    if (cachedMonsters) return cachedMonsters;
  } else {
    clearMonsterCache();
  }

  if (!monsterCachePromise) {
    monsterCachePromise = fetchMonstersFromApi()
      .then((loadedMonsters) => {
        writeCachedMonsters(loadedMonsters);
        return loadedMonsters;
      })
      .finally(() => {
        monsterCachePromise = null;
      });
  }

  try {
    return await monsterCachePromise;
  } catch (e) {
    console.warn("Failed to load monsters from API", e);

    const cachedMonsters = readCachedMonsters();
    if (cachedMonsters) return cachedMonsters;

    return [];
  }
}

import { apiFetch } from "../lib/api.js";

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

const LEADER_EFFECT_LABELS = {
  "Attack Power": "공격력",
  Attack: "공격력",
  "Attack Speed": "공격 속도",
  Speed: "공격 속도",
  "Critical DMG": "치명 피해",
  "Critical Damage": "치명 피해",
  "Critical Rate": "치명 확률",
  Defense: "방어력",
  HP: "체력",
  Accuracy: "효과 적중",
  Resistance: "저항",
};

const LEADER_AREA_LABELS = {
  Arena: "아레나",
  Dungeon: "던전",
  General: "전체",
  Guild: "길드 전투",
  Element: "속성",
  Attribute: "속성",
};

const LEADER_ELEMENT_LABELS = {
  Fire: "불",
  Water: "물",
  Wind: "풍",
  Light: "빛",
  Dark: "암",
};

function isGuildBattleLeaderEffect(monster) {
  return Boolean(
    monster?.leaderEffectType &&
      (["General", "Guild", "Element", "Attribute"].includes(monster.leaderEffectArea) || (!monster.leaderEffectArea && Boolean(monster.leaderEffectElement)))
  );
}

function formatLeaderEffectText(monster) {
  if (!isGuildBattleLeaderEffect(monster)) {
    return "";
  }

  const parts = [
    LEADER_AREA_LABELS[monster.leaderEffectArea] ?? monster.leaderEffectArea,
    LEADER_ELEMENT_LABELS[monster.leaderEffectElement] ?? monster.leaderEffectElement,
    LEADER_EFFECT_LABELS[monster.leaderEffectType] ?? monster.leaderEffectType,
  ].filter(Boolean);

  return `${parts.join(" ")} ${monster.leaderEffectAmount ?? ""}%`.trim();
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

export async function getMonsters() {
  try {
    const body = await apiFetch("/monsters");
    const loadedMonsters = (body.data ?? [])
      .filter((monster) => monster.enabled !== false)
      .map(normalizeMonster);

    return sortMonstersForSelection(loadedMonsters);
  } catch (e) {
    console.warn("Failed to load monsters from API", e);
    return [];
  }
}

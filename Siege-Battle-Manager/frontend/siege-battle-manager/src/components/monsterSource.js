import defaultMonsters from "../data/defaultMonsters.json";
import { apiFetch } from "../lib/api.js";

const localMonsters = [
  ...defaultMonsters.fire,
  ...defaultMonsters.water,
  ...defaultMonsters.wind,
  ...defaultMonsters.light,
  ...defaultMonsters.dark,
];

function normalizeMonster(monster) {
  const monsterCode = monster.code ?? monster.monsterCode ?? monster.id;
  const imageUrl = resolveMonsterImageUrl(monster);

  return {
    ...monster,
    id: monsterCode,
    monsterCode,
    element: monster.attribute?.toLowerCase?.() ?? monster.element ?? "",
    grade: monster.naturalStars ?? monster.grade ?? null,
    iconDataUrl: imageUrl,
    imageUrl,
  };
}

function resolveMonsterImageUrl(monster) {
  const imageUrl = monster.imageUrl ?? monster.iconDataUrl ?? null;

  if (imageUrl?.startsWith("/monsters/")) {
    return null;
  }

  return imageUrl;
}

// 🔥 지금은 JSON, 나중엔 API로 교체
export async function getMonsters() {
  try {
    const body = await apiFetch("/monsters");
    return (body.data ?? []).map(normalizeMonster);
  } catch (e) {
    console.warn("Failed to load monsters from API", e);
    return localMonsters.map(normalizeMonster);
  }
}

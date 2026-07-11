function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!value) {
    return [];
  }

  return String(value).split(",");
}

export function getMonsterSearchText(monster) {
  if (!monster) {
    return "";
  }

  return [
    monster.id,
    monster.code,
    monster.monsterCode,
    monster.name,
    monster.koreanName,
    monster.englishName,
    monster.attribute,
    monster.element,
    ...normalizeList(monster.aliases),
    ...normalizeList(monster.nicknames),
  ]
    .map(normalize)
    .filter(Boolean)
    .join(" ");
}

export function matchesMonsterSearch(monster, query) {
  const keyword = normalize(query);

  if (!keyword) {
    return true;
  }

  return getMonsterSearchText(monster).includes(keyword);
}

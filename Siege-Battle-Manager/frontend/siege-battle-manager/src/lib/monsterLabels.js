const GUILD_BATTLE_LEADER_AREAS = new Set(["General", "Guild", "Element", "Attribute"]);

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

const ELEMENT_LABELS = {
  Fire: "불",
  Water: "물",
  Wind: "풍",
  Light: "빛",
  Dark: "암",
  FIRE: "불",
  WATER: "물",
  WIND: "풍",
  LIGHT: "빛",
  DARK: "암",
  fire: "불",
  water: "물",
  wind: "풍",
  light: "빛",
  dark: "암",
};

export function getLeaderEffectLabel(effect) {
  return LEADER_EFFECT_LABELS[effect] ?? effect;
}

export function getLeaderAreaLabel(area) {
  return LEADER_AREA_LABELS[area] ?? area;
}

export function getElementLabel(element) {
  return ELEMENT_LABELS[element] ?? element;
}

export function isGuildBattleLeaderEffect(monster) {
  return Boolean(
    monster?.leaderEffectType &&
      (GUILD_BATTLE_LEADER_AREAS.has(monster.leaderEffectArea) ||
        (!monster.leaderEffectArea && Boolean(monster.leaderEffectElement)))
  );
}

export function formatLeaderEffectText(monster) {
  if (!isGuildBattleLeaderEffect(monster)) {
    return "";
  }

  const parts = [
    getLeaderAreaLabel(monster.leaderEffectArea),
    getElementLabel(monster.leaderEffectElement),
    getLeaderEffectLabel(monster.leaderEffectType),
  ].filter(Boolean);

  return `${parts.join(" ")} ${monster.leaderEffectAmount ?? ""}%`.trim();
}

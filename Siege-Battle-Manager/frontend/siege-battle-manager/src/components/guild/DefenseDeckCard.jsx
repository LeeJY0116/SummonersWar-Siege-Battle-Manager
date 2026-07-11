const TEXT = {
  deckSuffix: "의 방덱",
  leaderEffect: "리더 효과",
  delete: "삭제",
  leader: "LEADER",
  noImage: "No Img",
  none: "없음",
};

const ELEMENT_LABELS = {
  fire: "불",
  water: "물",
  wind: "풍",
  light: "빛",
  dark: "암",
  FIRE: "불",
  WATER: "물",
  WIND: "풍",
  LIGHT: "빛",
  DARK: "암",
};

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

function getLeaderEffectText(deck, leaderMonster) {
  return (
    leaderMonster?.leaderEffectText ||
    LEADER_EFFECT_LABELS[deck.leaderEffectType] ||
    LEADER_EFFECT_LABELS[leaderMonster?.leaderEffectType] ||
    deck.leaderEffectType ||
    leaderMonster?.leaderEffectType ||
    TEXT.none
  );
}

function getMonsterDisplayName(monster, item) {
  return monster?.name || monster?.koreanName || item.monsterName || item.monsterCode;
}

export default function DefenseDeckCard({ deck, monsters = [], onDelete }) {
  function findMonster(code) {
    return monsters.find((m) => m.id === code || m.monsterCode === code || m.code === code);
  }

  const leaderMonster = findMonster(deck.leaderMonsterCode);
  const leaderEffect = getLeaderEffectText(deck, leaderMonster);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-bold">
            {deck.ownerName}
            {TEXT.deckSuffix}
          </div>
          <div className="text-sm text-gray-500">
            {TEXT.leaderEffect}: {leaderEffect}
          </div>
        </div>

        <button
          onClick={() => onDelete(deck.deckId)}
          className="rounded-xl border border-red-300 px-3 py-1 text-sm text-red-600"
        >
          {TEXT.delete}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {deck.monsters?.map((item, index) => {
          const monster = findMonster(item.monsterCode);
          const isLeader = index === 0;
          const monsterName = getMonsterDisplayName(monster, item);
          const elementLabel = ELEMENT_LABELS[monster?.element] ?? ELEMENT_LABELS[monster?.attribute];

          return (
            <div
              key={item.monsterCode ?? item.monsterId}
              className={`relative rounded-2xl border p-2 text-center ${
                isLeader
                  ? "border-blue-500 bg-blue-50 shadow"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              {isLeader && (
                <div className="absolute left-1/2 top-1 -translate-x-1/2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {TEXT.leader}
                </div>
              )}

              <div className="pt-4">
                {monster?.iconDataUrl ? (
                  <img
                    src={monster.iconDataUrl}
                    alt={monsterName}
                    className="mx-auto h-16 w-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-gray-200 text-xs text-gray-500">
                    {TEXT.noImage}
                  </div>
                )}

                <div className="mt-2 text-sm font-semibold">
                  {monsterName}
                </div>

                {elementLabel && (
                  <div className="text-xs text-gray-500">
                    {elementLabel}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

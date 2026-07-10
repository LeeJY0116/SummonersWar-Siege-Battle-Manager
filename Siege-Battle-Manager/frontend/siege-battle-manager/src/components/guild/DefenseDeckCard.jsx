export default function DefenseDeckCard({ deck, monsters = [], onDelete }) {
  function findMonster(code) {
    return monsters.find((m) => m.id === code);
  }
  

  const leaderMonster = monsters.find(
    (m) => String(m.id) === String(deck.leaderMonsterId) || m.code === deck.leaderMonsterCode
  );

  const leaderEffect =
    deck.leaderEffectType ||
    leaderMonster?.leaderEffectType ||
    "없음";

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-bold">{deck.ownerName}의 방덱</div>
          <div className="text-sm text-gray-500">
            리더 효과: {leaderEffect}
          </div>
        </div>

        <button
          onClick={() => onDelete(deck.deckId)}
          className="rounded-xl border border-red-300 px-3 py-1 text-sm text-red-600"
        >
          삭제
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {deck.monsters?.map((item, index) => {
          const monster = findMonster(item.monsterCode);
          const isLeader = index === 0;

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
                  LEADER
                </div>
              )}

              <div className="pt-4">
                {monster?.iconDataUrl ? (
                  <img
                    src={monster.iconDataUrl}
                    alt={item.monsterName}
                    className="mx-auto h-16 w-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-gray-200 text-xs text-gray-500">
                    No Img
                  </div>
                )}

                <div className="mt-2 text-sm font-semibold">
                  {item.monsterName}
                </div>

                {monster?.element && (
                  <div className="text-xs text-gray-500">
                    {monster.element}
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

import { useState } from "react";
import { getElementLabel, getLeaderEffectLabel } from "../../lib/monsterLabels.js";

const TEXT = {
  leaderEffect: "리더 효과",
  delete: "삭제",
  leader: "LEADER",
  noImage: "No Img",
  none: "없음",
};

function getLeaderEffectText(deck, leaderMonster) {
  return (
    leaderMonster?.leaderEffectText ||
    getLeaderEffectLabel(deck.leaderEffectType) ||
    getLeaderEffectLabel(leaderMonster?.leaderEffectType) ||
    deck.leaderEffectType ||
    leaderMonster?.leaderEffectType ||
    TEXT.none
  );
}

function getMonsterDisplayName(monster, item) {
  return monster?.name || monster?.koreanName || item.monsterName || item.monsterCode;
}

export default function DefenseDeckCard({
  deck,
  group = null,
  monsters = [],
  onDelete,
  canManageGuild = false,
  currentGuildMemberId = null,
}) {
  function findMonster(code) {
    return monsters.find((m) => m.id === code || m.monsterCode === code || m.code === code);
  }

  const representativeDeck = group?.representative ?? deck;
  const groupDecks = group?.decks ?? [deck];
  const ownedCount = groupDecks.length;
  const leaderMonster = findMonster(representativeDeck.leaderMonsterCode);
  const leaderEffect = getLeaderEffectText(representativeDeck, leaderMonster);
  const [expanded, setExpanded] = useState(false);

  function canDeleteDeck(deckItem) {
    return (
      canManageGuild ||
      String(deckItem.ownerMemberId) === String(currentGuildMemberId)
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {ownedCount > 1 && (
            <span className="rounded-full bg-gray-900 px-2 py-0.5 text-xs font-semibold text-white">
              x{ownedCount} 보유
            </span>
          )}
          <div className="text-sm text-gray-500">
            {TEXT.leaderEffect}: {leaderEffect}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="rounded-xl border px-3 py-1 text-sm"
        >
          {expanded ? "접기" : "펼치기"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {representativeDeck.monsters?.map((item, index) => {
          const monster = findMonster(item.monsterCode);
          const isLeader = index === 0;
          const monsterName = getMonsterDisplayName(monster, item);
          const elementLabel = getElementLabel(monster?.element ?? monster?.attribute);

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

      {expanded && (
        <div className="mt-3 rounded-2xl bg-gray-50 p-3 text-sm">
          <div className="mb-2 font-semibold text-gray-700">보유 길드원</div>
          <div className="space-y-2">
            {groupDecks.map((ownedDeck) => (
              <div
                key={ownedDeck.deckId}
                className="flex items-center justify-between rounded-xl bg-white px-3 py-2"
              >
                <span>{ownedDeck.ownerName}</span>
                {canDeleteDeck(ownedDeck) && (
                  <button
                    type="button"
                    onClick={() => onDelete(ownedDeck.deckId)}
                    className="rounded-lg border border-red-300 px-2 py-1 text-xs text-red-600"
                  >
                    {TEXT.delete}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

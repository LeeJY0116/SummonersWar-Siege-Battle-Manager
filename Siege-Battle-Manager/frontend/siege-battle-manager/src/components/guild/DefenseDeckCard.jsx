import { useState } from "react";
import {
  getElementLabel,
  getLeaderEffectLabel,
  isGuildBattleLeaderEffect,
} from "../../lib/monsterLabels.js";

const TEXT = {
  leaderEffect: "리더 효과",
  delete: "삭제",
  leader: "LEADER",
  noImage: "No Img",
  none: "없음",
};

function getLeaderEffectText(deck, leaderMonster) {
  if (!isGuildBattleLeaderEffect(leaderMonster)) {
    return TEXT.none;
  }

  return (
    leaderMonster?.leaderEffectText ||
    getLeaderEffectLabel(leaderMonster?.leaderEffectType) ||
    getLeaderEffectLabel(deck.leaderEffectType) ||
    leaderMonster?.leaderEffectType ||
    deck.leaderEffectType ||
    TEXT.none
  );
}

function getMonsterDisplayName(monster, item) {
  return monster?.name || monster?.koreanName || item.monsterName || item.monsterCode;
}

function getMonsterStars(monster) {
  return Number(monster?.naturalStars ?? monster?.grade ?? 0);
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
  const hasFiveStarMonster = (representativeDeck.monsters ?? []).some((item) =>
    getMonsterStars(findMonster(item.monsterCode)) >= 5
  );
  const deckGradeLabel = hasFiveStarMonster ? "5성" : "4성";
  const [expanded, setExpanded] = useState(false);

  function canDeleteDeck(deckItem) {
    return (
      canManageGuild ||
      String(deckItem.ownerMemberId) === String(currentGuildMemberId)
    );
  }

  return (
    <div className="rounded-xl border border-[#745320] bg-[#211813] p-4 shadow-[inset_0_0_0_1px_rgba(255,237,169,0.12)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {ownedCount > 1 && (
            <span className="rounded-full bg-[#07142a] px-2 py-0.5 text-xs font-semibold text-white">
              x{ownedCount} 보유
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              hasFiveStarMonster
                ? "bg-[#3c1f1a] text-[#ffcf9d]"
                : "bg-[#f3d37b] text-[#2f1f13]"
            }`}
          >
            {deckGradeLabel}
          </span>
          <div className="text-sm font-semibold text-[#d7be80]">
            {TEXT.leaderEffect}: {leaderEffect}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="rounded-xl border border-[#9b743a] bg-[#221913] px-3 py-1 text-sm font-semibold text-[#f8e0ad] hover:border-[#f6c44f]"
        >
          {expanded ? "접기" : "펼치기"}
        </button>
      </div>

      <div className="flex flex-wrap justify-start gap-2">
        {representativeDeck.monsters?.map((item, index) => {
          const monster = findMonster(item.monsterCode);
          const isLeader = index === 0;
          const monsterName = getMonsterDisplayName(monster, item);
          const elementLabel = getElementLabel(monster?.element ?? monster?.attribute);

          return (
            <div
              key={item.monsterCode ?? item.monsterId}
              className={`relative w-24 rounded-md border-2 p-1.5 text-center shadow-[inset_0_0_0_1px_rgba(255,237,169,0.25)] ${
                isLeader
                  ? "border-[#f6c44f] bg-[#2a170c]"
                  : "border-[#b79148] bg-[#4b3421]"
              }`}
            >
              {isLeader && (
                <div className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-[1px] text-[10px] font-bold text-[#ffd96a]">
                  L
                </div>
              )}

              <div>
                {monster?.iconDataUrl ? (
                  <img
                    src={monster.iconDataUrl}
                    alt={monsterName}
                    className="mx-auto h-14 w-14 rounded-sm border border-[#3c2414] object-cover"
                  />
                ) : (
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-sm border border-[#3c2414] bg-[#2f241b] text-[10px] text-[#c8a96a]">
                    {TEXT.noImage}
                  </div>
                )}

                <div className="mt-1 flex min-h-[28px] items-center justify-center px-1 text-xs font-semibold leading-tight text-[#f6deb0] antialiased">
                  {monsterName}
                </div>

                {elementLabel && (
                  <div className="text-[10px] font-semibold text-[#c8a96a]">
                    {elementLabel}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {expanded && (
        <div className="mt-3 rounded-xl border border-[#745320] bg-[#2f241b] p-3 text-sm">
          <div className="mb-2 font-semibold text-[#f6deb0]">보유 길드원</div>
          <div className="space-y-2">
            {groupDecks.map((ownedDeck) => (
              <div
                key={ownedDeck.deckId}
                className="flex items-center justify-between rounded-xl border border-[#745320] bg-[#211813] px-3 py-2 text-[#f6deb0]"
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

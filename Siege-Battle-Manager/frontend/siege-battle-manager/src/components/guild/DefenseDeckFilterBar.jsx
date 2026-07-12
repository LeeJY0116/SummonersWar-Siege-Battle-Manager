import { useMemo } from "react";
import { matchesMonsterSearch } from "../../lib/monsterSearch.js";
import { getLeaderEffectLabel, isGuildBattleLeaderEffect } from "../../lib/monsterLabels.js";

export default function DefenseDeckFilterBar({
  members = [],
  monsters = [],
  showOwnerFilter = true,

  ownerFilterId = "",
  setOwnerFilterId = () => {},

  leaderEffectFilter,
  setLeaderEffectFilter,

  monsterFilterKeyword,
  setMonsterFilterKeyword,

  monsterFilterCodes,
  setMonsterFilterCodes,
}) {

  // 리더효과 목록
  const leaderEffectOptions = useMemo(() => {
    return [
      ...new Set(
        monsters
          .filter(isGuildBattleLeaderEffect)
          .map((m) => m.leaderEffectType)
          .filter(Boolean)
      ),
    ];
  }, [monsters]);

  // 검색 결과 몬스터
  const deckFilterMonsters = useMemo(() => {

    if (!monsterFilterKeyword.trim()) return [];

    return monsters.filter((m) => matchesMonsterSearch(m, monsterFilterKeyword));

  }, [monsterFilterKeyword, monsters]);

  // 몬스터 필터 토글
  function toggleMonsterFilter(code) {

    // 이미 선택됨 → 제거
    if (monsterFilterCodes.includes(code)) {

      setMonsterFilterCodes((prev) =>
        prev.filter((c) => c !== code)
      );

      return;
    }

    // 최대 3개
    if (monsterFilterCodes.length >= 3) {
      return;
    }

    setMonsterFilterCodes((prev) => [
      ...prev,
      code,
    ]);
  }

  // 전체 초기화
  function clearAllFilters() {
    setOwnerFilterId("");
    setLeaderEffectFilter("");
    setMonsterFilterCodes([]);
    setMonsterFilterKeyword("");
  }

  // 선택된 길드원
  const selectedOwnerFilter = useMemo(() => {
    return members.find(
      (m) => String(m.id) === String(ownerFilterId)
    );
  }, [members, ownerFilterId]);

  const hasActiveFilters =
    (showOwnerFilter && Boolean(ownerFilterId)) ||
    Boolean(leaderEffectFilter) ||
    monsterFilterCodes.length > 0;

  return (
    <div className="space-y-4">

      {showOwnerFilter && (
        <select
          value={ownerFilterId}
          onChange={(e) =>
            setOwnerFilterId(e.target.value)
          }
          className="w-full rounded-xl border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] outline-none focus:border-[#f6c44f]"
        >
          <option value="">전체 길드원</option>

          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </select>
      )}

      {/* 리더효과 */}
      <div className="space-y-2">

        <div className="text-sm font-semibold text-[#f6deb0]">
          리더효과 필터
        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() =>
              setLeaderEffectFilter("")
            }
            className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
              !leaderEffectFilter
                ? "border-[#f6c44f] bg-[#f3d37b] text-[#2f1f13]"
                : "border-[#9b743a] bg-[#221913] text-[#f8e0ad] hover:border-[#f6c44f]"
            }`}
          >
            전체
          </button>

          {leaderEffectOptions.map((effect) => (

            <button
              key={getLeaderEffectLabel(effect)}
              type="button"
              onClick={() =>
                setLeaderEffectFilter(effect)
              }
              className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
                leaderEffectFilter === effect
                  ? "border-[#f6c44f] bg-[#f3d37b] text-[#2f1f13]"
                  : "border-[#9b743a] bg-[#221913] text-[#f8e0ad] hover:border-[#f6c44f]"
              }`}
            >
              {getLeaderEffectLabel(effect)}
            </button>

          ))}

        </div>

      </div>

      {/* 몬스터 검색 */}
      <div className="space-y-2">

        <input
          value={monsterFilterKeyword}
          onChange={(e) =>
            setMonsterFilterKeyword(e.target.value)
          }
          placeholder="몬스터 이름 검색"
          className="w-full rounded-xl border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] placeholder:text-[#bda981] outline-none focus:border-[#f6c44f]"
        />

        {monsterFilterKeyword.trim() &&
          deckFilterMonsters.length > 0 && (

          <div className="flex gap-3 overflow-x-auto rounded-xl border border-[#745320] bg-[#211813] p-3 [scrollbar-color:#9b743a_#2f241b] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#9b743a] [&::-webkit-scrollbar-track]:bg-[#2f241b]">

            {deckFilterMonsters.map((m) => {

              const selected =
                monsterFilterCodes.includes(m.id);

              return (

                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    toggleMonsterFilter(m.id)
                  }
                  className={`min-w-[84px] rounded-md border-2 p-1.5 text-[11px] transition hover:border-[#ffd86a] hover:brightness-110 ${
                    selected
                      ? "border-[#f6c44f] bg-[#2a170c] ring-2 ring-[#f6c44f]/40"
                      : "border-[#b79148] bg-[#4b3421]"
                  }`}
                >

                  {m.iconDataUrl ? (
                    <img
                      src={m.iconDataUrl}
                      alt={m.name}
                      className="mx-auto h-14 w-14 rounded-sm border border-[#3c2414] object-cover"
                    />
                  ) : (
                    <div className="mx-auto h-14 w-14 rounded-sm border border-[#3c2414] bg-[#2f241b]" />
                  )}

                  <div className="mt-1 flex min-h-[28px] items-center justify-center px-1 text-center font-semibold leading-tight text-[#f6deb0] antialiased">
                    {m.name}
                  </div>

                </button>

              );

            })}

          </div>

        )}

      </div>

      {/* 활성 필터 */}
      {hasActiveFilters && (

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#745320] bg-[#2f241b] p-3 text-sm">

          <span className="font-semibold text-[#f6deb0]">
            적용 중인 필터:
          </span>

          {showOwnerFilter && selectedOwnerFilter && (

            <button
              type="button"
              onClick={() =>
                setOwnerFilterId("")
              }
              className="rounded-full border border-[#9b743a] bg-[#221913] px-3 py-1 font-semibold text-[#f8e0ad]"
            >
              {selectedOwnerFilter.displayName} ✕
            </button>

          )}

          {leaderEffectFilter && (

            <button
              type="button"
              onClick={() =>
                setLeaderEffectFilter("")
              }
              className="rounded-full border border-[#9b743a] bg-[#221913] px-3 py-1 font-semibold text-[#f8e0ad]"
            >
              리더효과: {getLeaderEffectLabel(leaderEffectFilter)} ✕
            </button>

          )}

          {monsterFilterCodes.map((code) => {

            const monster = monsters.find(
              (m) => m.id === code
            );

            if (!monster) return null;

            return (

              <button
                key={code}
                type="button"
                onClick={() =>
                  toggleMonsterFilter(code)
                }
                className="rounded-full border border-[#9b743a] bg-[#221913] px-3 py-1 font-semibold text-[#f8e0ad]"
              >
                {monster.name} ✕
              </button>

            );

          })}

          <button
            type="button"
            onClick={clearAllFilters}
            className="ml-auto rounded-full bg-gray-900 px-3 py-1 text-white"
          >
            전체 초기화
          </button>

        </div>

      )}

    </div>
  );
}

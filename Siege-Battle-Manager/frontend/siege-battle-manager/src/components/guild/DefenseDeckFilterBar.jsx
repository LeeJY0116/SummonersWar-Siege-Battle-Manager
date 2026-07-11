import { useMemo } from "react";
import { matchesMonsterSearch } from "../../lib/monsterSearch.js";
import { getLeaderEffectLabel, isGuildBattleLeaderEffect } from "../../lib/monsterLabels.js";

export default function DefenseDeckFilterBar({
  members = [],
  monsters = [],

  ownerFilterId,
  setOwnerFilterId,

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
    Boolean(ownerFilterId) ||
    Boolean(leaderEffectFilter) ||
    monsterFilterCodes.length > 0;

  return (
    <div className="space-y-4">

      {/* 길드원 필터 */}
      <select
        value={ownerFilterId}
        onChange={(e) =>
          setOwnerFilterId(e.target.value)
        }
        className="w-full rounded-xl border px-3 py-2"
      >
        <option value="">전체 길드원</option>

        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.displayName}
          </option>
        ))}
      </select>

      {/* 리더효과 */}
      <div className="space-y-2">

        <div className="text-sm font-semibold">
          리더효과 필터
        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() =>
              setLeaderEffectFilter("")
            }
            className={`rounded-full border px-3 py-1 text-sm ${
              !leaderEffectFilter
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600"
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
              className={`rounded-full border px-3 py-1 text-sm ${
                leaderEffectFilter === effect
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-600"
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
          className="w-full rounded-xl border px-3 py-2"
        />

        {monsterFilterKeyword.trim() &&
          deckFilterMonsters.length > 0 && (

          <div className="flex gap-2 overflow-x-auto rounded-2xl border p-2">

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
                  className={`min-w-[72px] rounded-2xl border p-2 text-xs transition ${
                    selected
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-gray-200 bg-white"
                  }`}
                >

                  {m.iconDataUrl ? (
                    <img
                      src={m.iconDataUrl}
                      alt={m.name}
                      className="mx-auto mb-1 h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="mx-auto mb-1 h-12 w-12 rounded-xl bg-gray-200" />
                  )}

                  <div className="truncate font-semibold">
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

        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-gray-50 p-3 text-sm">

          <span className="font-semibold text-gray-700">
            적용 중인 필터:
          </span>

          {selectedOwnerFilter && (

            <button
              type="button"
              onClick={() =>
                setOwnerFilterId("")
              }
              className="rounded-full border bg-white px-3 py-1 text-blue-600"
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
              className="rounded-full border bg-white px-3 py-1 text-blue-600"
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
                className="rounded-full border bg-white px-3 py-1 text-blue-600"
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

import React, { useMemo, useState } from "react";
import TrioSlot from "../trios/TrioSlot.jsx";
import { matchesMonsterSearch } from "../../lib/monsterSearch.js";
import { getLeaderEffectLabel, isGuildBattleLeaderEffect } from "../../lib/monsterLabels.js";
import MonsterFilterControls, {
  matchesMonsterPickerFilters,
} from "../monsters/MonsterFilterControls.jsx";

export default function SiegeBattleTab({
  monsters,
  onSaveTrio,
  onDeleteMonster,
}) {
  const [selected, setSelected] = useState([]);          // monsterCode 배열 (1~3개)
  const [name, setName] = useState("");                 // 점령전 조합 이름

  const [search, setSearch] = useState("");             // 도감 이름 검색
  const [starFilter, setStarFilter] = useState(5);
  const [elementFilter, setElementFilter] = useState("");
  const [leaderEffectFilter, setLeaderEffectFilter] = useState("all");
  const [sortKey, setSortKey] = useState("sequence");       // "name" | "sequence"

  // 4성 방덱 토글 상태 : true면 grade < 5 만 보여줌
  const [fourStarDefenseOnly, setFourStarDefenseOnly] = useState(false);

  // 아이콘 있는 몬스터만 도감 대상으로
  const baseCatalog = useMemo(
    () => monsters.filter((m) => m.iconDataUrl),
    [monsters]
  );

  const leaderEffectOptions = useMemo(() => {
    return [...new Set(
      baseCatalog
        .filter(isGuildBattleLeaderEffect)
        .map((monster) => monster.leaderEffectType)
        .filter(Boolean)
    )].sort((a, b) => getLeaderEffectLabel(a).localeCompare(getLeaderEffectLabel(b), "ko"));
  }, [baseCatalog]);

  // 검색 + 속성 + 리더효과 + 정렬 적용한 도감 목록
  const catalog = useMemo(() => {
    let list = [...baseCatalog];

    if (search.trim()) {
      list = list.filter((m) => matchesMonsterSearch(m, search));
    }

    list = list.filter((m) =>
      matchesMonsterPickerFilters(m, {
        query: search,
        starFilter,
        elementFilter,
      }),
    );

    // 리더 효과 필터
    if (leaderEffectFilter !== "all") {
      list = list.filter((m) => isGuildBattleLeaderEffect(m) && m.leaderEffectType === leaderEffectFilter);
    }

    // 4성 방덱 모드 : grade < 5인 몬스터만
    if (fourStarDefenseOnly) {
        list = list.filter((m) => {
            return m.grade < 5;
        })
    }
    // 정렬
    list.sort((a, b) => {
      // 인덱스(sequence) 정렬
      if (sortKey === "sequence") {
        const ao = a.order ?? 99999;
        const bo = b.order ?? 99999;
        return bo - ao;
      }
      if (sortKey === "name") {
        return a.name.localeCompare(b.name, "ko");
      }
      return 0;
    });

    return list;
  }, [baseCatalog, search, starFilter, elementFilter, leaderEffectFilter, sortKey, fourStarDefenseOnly,]);

  function handleClickMonster(monsterId) {
    setSelected((prev) => {
      if (prev.includes(monsterId)) return prev;
      if (prev.length >= 3) return prev;
      return [...prev, monsterId];
    });
  }

  function handleRemoveSlot(monsterId) {
    setSelected((prev) => prev.filter((id) => id !== monsterId));
  }

  function handleSave() {
    if (selected.length === 0) return;
    onSaveTrio(selected, name);
    setSelected([]);
    setName("");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 도감 영역 */}
      <section
        className="lg:col-span-2 rounded-2xl border border-[#8b6a2e] bg-[#2f241b] p-4 font-sans shadow-[0_10px_24px_rgba(31,20,10,0.25)] md:p-5 flex flex-col"
        style={{ fontFamily: "Pretendard, 'Noto Sans KR', 'Malgun Gothic', sans-serif" }}
      >
        {/* 제목 + 4성 방덱 버튼 + 설명 */}
        <div className="mb-3 rounded-xl border border-[#745320] bg-gradient-to-b from-[#6b4d23] to-[#3d2b19] px-3 py-3 shadow-inner">
            <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-extrabold tracking-normal text-[#ffe2a0] drop-shadow">점령전 도감</h2>
            {/* 4성 방덱 토글 버튼 */}
                <button
                type="button"
                onClick={() =>
                    setFourStarDefenseOnly((prev) => !prev)
                }
                className={
                    "rounded-full border px-3 py-1.5 text-sm font-bold transition " +
                    (fourStarDefenseOnly
                    ? "border-[#f6c44f] bg-[#1f160f] text-[#ffd96a]"
                    : "border-[#b98a39] bg-[#f5d891] text-[#3a2514] hover:bg-[#ffe4a5]")
                }
                >
                4성 방덱
                </button>
            </div>
          {/* 검색 / 리더효과 / 정렬 (PC) */}
          <div className="hidden md:flex flex-col items-end gap-2 mt-1">
            <div className="flex flex-wrap gap-2 justify-end">
              <input
                className="rounded-lg border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] placeholder:text-[#bda981] outline-none focus:border-[#f6c44f]"
                placeholder="이름 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="rounded-lg border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] outline-none focus:border-[#f6c44f]"
                value={leaderEffectFilter}
                onChange={(e) => setLeaderEffectFilter(e.target.value)}
              >
                <option value="all">리더 효과 전체</option>
                {leaderEffectOptions.map((eff) => (
                  <option key={eff} value={eff}>
                    {getLeaderEffectLabel(eff)}
                  </option>
                ))}
              </select>
              <select
                className="rounded-lg border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] outline-none focus:border-[#f6c44f]"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
              >
                <option value="sequence">기본</option>
                <option value="name">이름순</option>
              </select>
            </div>
          </div>
        </div>

        {/* 모바일용 검색 & 리더효과 필터 */}
        <div className="md:hidden mb-3 flex flex-wrap gap-2">
          <input
            className="flex-1 rounded-lg border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] placeholder:text-[#bda981] outline-none focus:border-[#f6c44f]"
            placeholder="이름 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-lg border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] outline-none focus:border-[#f6c44f]"
            value={leaderEffectFilter}
            onChange={(e) => setLeaderEffectFilter(e.target.value)}
          >
            <option value="all">리더 효과 전체</option>
            {leaderEffectOptions.map((eff) => (
              <option key={eff} value={eff}>
                {getLeaderEffectLabel(eff)}
              </option>
            ))}
          </select>
        </div>

        <MonsterFilterControls
          starFilter={starFilter}
          onChangeStarFilter={setStarFilter}
          elementFilter={elementFilter}
          onChangeElementFilter={setElementFilter}
          disabled={Boolean(search.trim())}
          variant="dark"
        />

        {catalog.length === 0 ? (
          <p className="rounded-xl border border-[#745320] bg-[#241a13] p-4 text-sm text-[#f9e6bf]">
            선택한 속성/리더 효과에 해당하는 몬스터가 없습니다.
          </p>
        ) : (
          <div className="mt-2 max-h-[560px] flex-1 overflow-auto rounded-xl border border-[#745320] bg-[#211813] p-3 [scrollbar-color:#9b743a_#2f241b] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#9b743a] [&::-webkit-scrollbar-track]:bg-[#2f241b]">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
                  {catalog.map((m) => {
                    const hasLeaderEffect = isGuildBattleLeaderEffect(m);
                    const isDefault = m.isDefault;

                    function handleCardClick() {
                      handleClickMonster(m.id);
                    }

                    function handleDeleteClick(e) {
                      e.stopPropagation();
                      if (
                        !onDeleteMonster ||
                        isDefault ||
                        !window.confirm(
                          "이 몬스터를 삭제할까요? 관련된 조합도 함께 삭제됩니다."
                        )
                      ) {
                        return;
                      }
                      onDeleteMonster(m.id);
                    }

                    return (
                      <div
                        key={m.id}
                        onClick={handleCardClick}
                        className="relative flex cursor-pointer flex-col items-center rounded-md border-2 border-[#b79148] bg-[#4b3421] p-1.5 shadow-[inset_0_0_0_1px_rgba(255,237,169,0.35)] transition hover:border-[#ffd86a] hover:brightness-110"
                      >

                        {/* 리더 효과 뱃지 (좌하단) */}
                        {hasLeaderEffect && (
                          <div
                            className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-[1px] text-[10px] font-bold text-[#ffd96a]"
                            title={m.leaderEffectText || getLeaderEffectLabel(m.leaderEffectType)}
                          >
                            L
                          </div>
                        )}

                        {/* 유저 몬스터만 삭제 버튼 노출 (우상단) */}
                        {!isDefault && onDeleteMonster && (
                          <button
                            type="button"
                            onClick={handleDeleteClick}
                            className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-[10px] text-white hover:bg-red-600"
                            title="이 몬스터 삭제"
                          >
                            ×
                          </button>
                        )}

                        <img
                          src={m.iconDataUrl}
                          alt={m.name}
                          className="aspect-square w-full rounded-sm border border-[#3c2414] object-cover"
                        />
                        <div className="mt-1.5 flex min-h-[32px] w-full items-center justify-center px-1 text-center text-xs font-semibold leading-snug text-[#f6deb0] antialiased">
                          {m.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
          </div>
        )}
      </section>

      {/* 점령전 조합 만들기 영역 (슬롯 3개) */}
      <section className="bg-white rounded-2xl shadow p-4 md:p-5">
        <h2 className="text-lg font-bold mb-3">점령전 조합 만들기</h2>
        <p className="text-xs text-gray-600 mb-2">
          도감에서 몬스터를 클릭하면 아래 슬롯에 순서대로 채워집니다. 첫 번째 슬롯이 리더입니다.
        </p>

        <div className="flex items-center gap-3 mb-4">
          {Array.from({ length: 3 }).map((_, idx) => {
            const mid = selected[idx];
            const m = monsters.find((x) => x.id === mid);

            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => m && handleRemoveSlot(mid)}
                  className={
                    "rounded-md outline-none " +
                    (m
                      ? "cursor-pointer transition-transform active:scale-95 hover:brightness-105"
                      : "cursor-default")
                  }
                >
                  <TrioSlot monster={m} isLeader={idx === 0} size="lg" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              점령전 조합 이름 (선택)
            </span>
            <input
              className="px-3 py-2 rounded-xl border border-gray-200 shadow-sm text-sm"
              placeholder="예) 점령전 공격 조합 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <div className="flex flex-wrap gap-2 mt-1">
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={handleSave}
              className="px-4 py-2 rounded-2xl bg-gray-900 text-white text-sm font-semibold disabled:opacity-40"
            >
              조합 저장 (최소 1마리)
            </button>
            <button
              type="button"
              onClick={() => {
                setSelected([]);
                setName("");
              }}
              className="px-3 py-2 rounded-2xl bg-gray-100 text-sm"
            >
              초기화
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

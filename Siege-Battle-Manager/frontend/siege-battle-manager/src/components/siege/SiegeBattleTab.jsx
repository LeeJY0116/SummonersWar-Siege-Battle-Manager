import React, { useMemo, useState } from "react";
import TrioSlot from "../trios/TrioSlot.jsx";
import { matchesMonsterSearch } from "../../lib/monsterSearch.js";

// Element filter labels
const ELEMENT_META = {
  fire: { label: "불" },
  water: { label: "물" },
  wind: { label: "풍" },
  light: { label: "빛" },
  dark: { label: "암" },
};

const ELEMENT_ORDER = ["fire", "water", "wind", "light", "dark"];

const LEADER_EFFECT_LABELS = {
  "Attack Power": "공격력",
  "Attack Speed": "공격속도",
  "Critical DMG": "치명 피해",
  "Critical Damage": "치명 피해",
  "Critical Rate": "치명타 확률",
  Defense: "방어력",
  HP: "체력",
  Accuracy: "효과적중",
  Resistance: "효과저항",
};

function getLeaderEffectLabel(effect) {
  return LEADER_EFFECT_LABELS[effect] ?? effect;
}
function isGuildBattleLeaderEffect(monster) {
  return Boolean(
    monster?.leaderEffectType &&
      (["General", "Guild", "Element", "Attribute"].includes(monster.leaderEffectArea) ||
        (!monster.leaderEffectArea && Boolean(monster.leaderEffectElement)))
  );
}


export default function SiegeBattleTab({
  monsters,
  onSaveTrio,
  onDeleteMonster,
}) {
  const [selected, setSelected] = useState([]);          // monsterId 배열 (1~3개)
  const [name, setName] = useState("");                 // 점령전 조합 이름

  const [search, setSearch] = useState("");             // 도감 이름 검색
  // ❗ 기본 속성: 불 (전체 보기 옵션 없음)
  const [elementFilter, setElementFilter] = useState("fire");
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

    // 이름 검색
    if (search.trim()) {
      list = list.filter((m) => matchesMonsterSearch(m, search));
  }

    // 속성 필터 (항상 필터됨, 전체 없음)
    list = list.filter((m) => m.element === elementFilter);

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
  }, [baseCatalog, search, elementFilter, leaderEffectFilter, sortKey, fourStarDefenseOnly,]);

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
      <section className="lg:col-span-2 bg-white rounded-2xl shadow p-4 md:p-5 flex flex-col">
        {/* 제목 + 4성 방덱 버튼 + 설명 */}
        <div className ="mb-3">
            <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-bold">점령전 도감</h2>
            {/* 4성 방덱 토글 버튼 */}
                <button
                type="button"
                onClick={() =>
                    setFourStarDefenseOnly((prev) => !prev)
                }
                className={
                    "px-3 py-1 rounded-full text-xs font-semibold border transition " +
                    (fourStarDefenseOnly
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100")
                }
                >
                4성 방덱
                </button>
            </div>
                <p className="text-xs text-gray-600">
                오른쪽 속성 아이콘을 눌러 원하는 속성만 볼 수 있습니다.
                </p>
          {/* 검색 / 리더효과 / 정렬 (PC) */}
          <div className="hidden md:flex flex-col items-end gap-2 mt-1">
            <div className="flex flex-wrap gap-2 justify-end">
              <input
                className="px-2 py-1 rounded-xl border border-gray-200 text-xs"
                placeholder="이름 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="px-2 py-1 rounded-xl border border-gray-200 text-xs bg-white"
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
                className="px-2 py-1 rounded-xl border border-gray-200 text-xs bg-white"
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
            className="px-2 py-1 rounded-xl border border-gray-200 text-xs flex-1"
            placeholder="이름 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-2 py-1 rounded-xl border border-gray-200 text-xs bg-white"
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

        {catalog.length === 0 ? (
          <p className="text-sm text-gray-600">
            선택한 속성/리더 효과에 해당하는 몬스터가 없습니다.
          </p>
        ) : (
          <div className="flex-1 overflow-auto max-h-[520px] mt-2">
            <div className="flex gap-3">
              {/* 카드 그리드 */}
              <div className="flex-1">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2">
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
                        className="relative border border-gray-200 rounded-xl p-1 bg-gray-50 hover:bg-gray-100 flex flex-col items-center cursor-pointer"
                      >

                        {/* 리더 효과 뱃지 (좌하단) */}
                        {hasLeaderEffect && (
                          <div
                            className="absolute left-1 bottom-6 rounded-full bg-gray-900/80 px-1.5 py-[1px] text-[9px] font-semibold text-white"
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
                            className="absolute right-1 top-1 w-4 h-4 rounded-full bg-black/70 text-[10px] text-white flex items-center justify-center hover:bg-red-600"
                            title="이 몬스터 삭제"
                          >
                            ×
                          </button>
                        )}

                        <img
                          src={m.iconDataUrl}
                          alt={m.name}
                          className="w-full aspect-square rounded-lg object-cover"
                        />
                        <div className="text-[10px] mt-1 text-center truncate px-1">
                          {m.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 우측 속성 아이콘 바 */}
              <div className="flex flex-col items-center gap-3 pr-1 mt-8">
                {ELEMENT_ORDER.map((key) => {
                  const meta = ELEMENT_META[key];
                  const active = elementFilter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setElementFilter(key)}
                      className={
                        "w-9 h-9 rounded-full border bg-white flex items-center justify-center text-[13px] font-bold text-gray-950 shadow-sm transition " +
                        (active
                          ? "border-blue-500 ring-2 ring-offset-2 ring-blue-500 scale-105"
                          : "border-gray-300 opacity-70 hover:opacity-100 hover:border-gray-500")
                      }
                      title={meta.label + " 속성"}
                    >
                      <span>{meta.label}</span>
                    </button>
                  );
                })}
              </div>
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

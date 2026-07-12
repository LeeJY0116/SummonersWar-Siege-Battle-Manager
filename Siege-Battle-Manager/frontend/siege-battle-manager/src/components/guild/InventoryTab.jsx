import React, { useEffect, useMemo, useState } from "react";
import {
  fetchMemberInventory,
  upsertMemberInventoryItems,
} from "../../lib/inventory.js";
import { fetchDefenseDecks } from "../../lib/defenseDeck.js";
import Toast from "../common/Toast.jsx";
import { useToast } from "../../hooks/useToast.js";

function clampNonNegative(n) {
  const v = Number.isFinite(n) ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.floor(v));
}

function getMemberDisplayName(member) {
  return member?.displayName ?? member?.nickname ?? member?.name ?? `멤버 ${member?.id}`;
}

const STAR_FILTERS = [5, 4, 3, 2];
const ELEMENT_FILTERS = [
  { value: "", label: "전체" },
  { value: "fire", label: "불" },
  { value: "water", label: "물" },
  { value: "wind", label: "풍" },
  { value: "light", label: "빛" },
  { value: "dark", label: "암" },
];

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return String(value).split(",");
}

function matchesInventorySearch(monster, query) {
  const keyword = normalize(query);
  if (!keyword) return true;

  return [
    monster.name,
    monster.koreanName,
    monster.englishName,
    ...normalizeList(monster.aliases),
    ...normalizeList(monster.nicknames),
  ]
    .map(normalize)
    .filter(Boolean)
    .join(" ")
    .includes(keyword);
}

function getMonsterStars(monster) {
  return Number(monster.naturalStars ?? monster.grade ?? 0);
}

function getMonsterElement(monster) {
  return normalize(monster.element ?? monster.attribute);
}

export default function InventoryTab({
  members,
  monsters,
  canManageGuild = false,
  currentGuildMemberId = null,
}) {
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [loading, setLoading] = useState(false);
  const [inventoryMap, setInventoryMap] = useState({}); // { monsterCode: count }
  const [query, setQuery] = useState("");
  const [starFilter, setStarFilter] = useState(5);
  const [elementFilter, setElementFilter] = useState("");
  const [dirty, setDirty] = useState(false);
  const [decks, setDecks] = useState([]);
  const { toastMessage, showToast } = useToast(1000);
  const selectableMembers = useMemo(() => {
    if (canManageGuild) return members || [];

    return (members || []).filter(
      (member) => String(member.id) === String(currentGuildMemberId)
    );
  }, [canManageGuild, currentGuildMemberId, members]);

  const selectedMember = useMemo(
    () => members?.find((m) => String(m.id) === String(selectedMemberId)),
    [members, selectedMemberId]
  );

  // 멤버 자동 선택(첫 멤버)
  useEffect(() => {
    if (!selectableMembers.length) return;
    if (selectableMembers.some((member) => String(member.id) === String(selectedMemberId))) {
      return;
    }
    setSelectedMemberId(String(selectableMembers[0].id));
  }, [selectableMembers, selectedMemberId]);

  // 인벤 로드
  useEffect(() => {
    if (!selectedMemberId) return;

    setLoading(true);
    setDirty(false);

    fetchMemberInventory(selectedMemberId)
      .then((data) => {
        // data 형태를 { monsterCode, quantity }[] 로 변환
        const map = {};

        for (const it of data || []) {
          const code = it.monsterCode;

          if(!code) continue;

          map[String(code)] = it.count ?? it.quantity ?? 0;
        }
        setInventoryMap(map);
      })
      .catch((e) => {
        console.error(e);
        setInventoryMap({});
      })
      .finally(() => setLoading(false));
  }, [selectedMemberId]);

    // 방덱 로드
  useEffect(() => {
  fetchDefenseDecks()
    .then((data) => setDecks(data || []))
    .catch((e) => console.error(e));
  }, []);

  // 사용 중 몬스터 개수 계산
  const usedCountMap = useMemo(() => {
  const map = {};

  for (const deck of decks || []) {
    if (String(deck.ownerMemberId) !== String(selectedMemberId)) continue;

    for (const monster of deck.monsters || []) {
      const code = monster.monsterCode;
      if (!code) continue;

      map[code] = (map[code] || 0) + 1;
    }
  }

  // 방덱 사용 개수 미만으로 줄일 시 메시지 출력
  return map;
  }, [decks, selectedMemberId]);

  const canEditSelected =
    canManageGuild || String(selectedMemberId) === String(currentGuildMemberId);

  const filteredMonsters = useMemo(() => {
    const keyword = query.trim();

    return (monsters || []).filter((monster) => {
      const stars = getMonsterStars(monster);

      if (stars < 2 || stars > 5) {
        return false;
      }

      if (keyword) {
        return matchesInventorySearch(monster, keyword);
      }

      if (stars !== Number(starFilter)) {
        return false;
      }

      if (elementFilter && getMonsterElement(monster) !== elementFilter) {
        return false;
      }

      return true;
    });
  }, [elementFilter, monsters, query, starFilter]);

  function changeCount(monsterCode, nextCount) {
    if (!canEditSelected) return;

    const code = String(monsterCode);
    const minCount = usedCountMap[code] || 0;

    const next = Math.max(minCount, clampNonNegative(nextCount));
    const prev = clampNonNegative(inventoryMap[code] ?? 0);

    if (clampNonNegative(nextCount) < minCount) {
      showToast(`방덱에 사용 중인 ${minCount}개 미만으로 줄일 수 없습니다.`);
    }

    if (prev === next) return;

    setInventoryMap((prevMap) => ({
      ...prevMap,
      [code]: next,
    }));

    setDirty(true);
  }

  function bump(monsterCode, delta) {
    const code = String(monsterCode);
    const cur = clampNonNegative(inventoryMap[code] ?? 0);
    changeCount(code, cur + delta);
  }

  async function handleSave() {
    if (!selectedMemberId) return;
    if (!canEditSelected) return;

    // 0도 포함해 보내려면 그대로, 0 제거하고 싶으면 filter 적용
    const items = Object.entries(inventoryMap).map(([monsterCode, count]) => ({
      monsterCode,
      quantity: clampNonNegative(count),
    }))
    .filter((item) => item.monsterCode && item.quantity > 0);

    try {
      setLoading(true);
      await upsertMemberInventoryItems(selectedMemberId, items);
      setDirty(false);
      alert("저장 완료!");
    } catch (e) {
      console.error(e);
      alert(e.message || "저장 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
      <>
    <Toast message={toastMessage} />
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <select
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 bg-white"
        >
          {selectableMembers.map((m) => (
            <option key={m.id} value={String(m.id)}>
              {getMemberDisplayName(m)}
            </option>
          ))}
        </select>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="몬스터 검색 (이름/별칭)"
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white"
        />

        <button
          onClick={handleSave}
          disabled={loading || !dirty || !canEditSelected}
          className={`px-4 py-2 rounded-2xl text-white shadow ${
            loading || !dirty || !canEditSelected ? "bg-gray-400" : "bg-gray-900 hover:opacity-90"
          }`}
        >
          저장
        </button>
      </div>

      <div className="text-sm text-gray-600">
        선택된 길드원:{" "}
        <span className="font-semibold text-gray-900">
          {selectedMember ? getMemberDisplayName(selectedMember) : selectedMemberId}
        </span>
        {dirty ? " · (변경됨)" : ""}
        {!canEditSelected ? " · 본인 또는 마스터/부마스터만 수정할 수 있습니다." : ""}
      </div>

      {!query.trim() && (
        <div className="space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <div className="flex flex-wrap gap-2">
            {STAR_FILTERS.map((stars) => (
              <button
                key={stars}
                type="button"
                onClick={() => setStarFilter(stars)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  starFilter === stars
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                {stars}성
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {ELEMENT_FILTERS.map((element) => (
              <button
                key={element.value || "all"}
                type="button"
                onClick={() => setElementFilter(element.value)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  elementFilter === element.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                {element.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-600">불러오는 중...</div>
      ) : (
        <div className="grid max-h-[560px] grid-cols-1 gap-2 overflow-y-auto rounded-2xl border border-gray-200 p-3 md:grid-cols-2">
          {(filteredMonsters || []).map((m) => {
            const mid = String(m.id);
            const count = clampNonNegative(inventoryMap[mid] ?? 0);

            return (
              <div
                key={mid}
                className="flex items-center justify-between gap-3 border border-gray-200 rounded-2xl p-3"
              >
                <div className="flex items-center gap-3">
                  {m.iconDataUrl ? (
                    <img
                      src={m.iconDataUrl}
                      alt={m.name}
                      className="w-10 h-10 rounded-xl object-cover border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gray-100 border" />
                  )}
                  <div>
                    <div className="font-semibold">{m.name}</div>
                    <div className="text-xs text-gray-500">
                      {getMonsterStars(m)}성 · {ELEMENT_FILTERS.find((element) => element.value === getMonsterElement(m))?.label ?? m.element}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => bump(mid, -1)}
                    disabled={!canEditSelected}
                    className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    -
                  </button>

                  <input
                    value={String(count)}
                    onChange={(e) => changeCount(mid, e.target.value)}
                    readOnly={!canEditSelected}
                    className="w-16 text-center px-2 py-1 rounded-xl border border-gray-200"
                  />

                  <button
                    onClick={() => bump(mid, +1)}
                    disabled={!canEditSelected}
                    className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
    </>
  );
}

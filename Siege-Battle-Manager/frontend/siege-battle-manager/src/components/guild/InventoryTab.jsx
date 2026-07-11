import React, { useEffect, useMemo, useState } from "react";
import {
  fetchMemberInventory,
  upsertMemberInventoryItems,
} from "../../lib/inventory.js";
import { fetchDefenseDecks } from "../../lib/defenseDeck.js";
import Toast from "../common/Toast.jsx";
import { useToast } from "../../hooks/useToast.js";
import { matchesMonsterSearch } from "../../lib/monsterSearch.js";

function clampNonNegative(n) {
  const v = Number.isFinite(n) ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.floor(v));
}

export default function InventoryTab({ members, monsters }) {
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [loading, setLoading] = useState(false);
  const [inventoryMap, setInventoryMap] = useState({}); // { monsterId: count }
  const [query, setQuery] = useState("");
  const [dirty, setDirty] = useState(false);
  const [decks, setDecks] = useState([]);
  const { toastMessage, showToast } = useToast(1000);

  const selectedMember = useMemo(
    () => members?.find((m) => String(m.id) === String(selectedMemberId)),
    [members, selectedMemberId]
  );

  // 멤버 자동 선택(첫 멤버)
  useEffect(() => {
    if (!members?.length) return;
    if (selectedMemberId) return;
    setSelectedMemberId(String(members[0].id));
  }, [members, selectedMemberId]);

  // 인벤 로드
  useEffect(() => {
    if (!selectedMemberId) return;

    setLoading(true);
    setDirty(false);

    fetchMemberInventory(selectedMemberId)
      .then((data) => {
        // data 형태를 {monsterId, count}[] 로 가정
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

  const filteredMonsters = useMemo(() => {
    return (monsters || []).filter((m) => matchesMonsterSearch(m, query));
  }, [monsters, query]);

  function changeCount(monsterCode, nextCount) {
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
          {(members || []).map((m) => (
            <option key={m.id} value={String(m.id)}>
              {m.nickname ?? m.name ?? `member-${m.id}`}
              {m.type ? ` (${m.type})` : ""}
              {m.role ? ` · ${m.role}` : ""}
            </option>
          ))}
        </select>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="몬스터 검색 (이름/별명/id)"
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 bg-white"
        />

        <button
          onClick={handleSave}
          disabled={loading || !dirty}
          className={`px-4 py-2 rounded-2xl text-white shadow ${
            loading || !dirty ? "bg-gray-400" : "bg-gray-900 hover:opacity-90"
          }`}
        >
          저장
        </button>
      </div>

      <div className="text-sm text-gray-600">
        선택된 길드원:{" "}
        <span className="font-semibold text-gray-900">
          {selectedMember?.nickname ?? selectedMemberId}
        </span>
        {dirty ? " · (변경됨)" : ""}
      </div>

      {loading ? (
        <div className="text-sm text-gray-600">불러오는 중...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                    <div className="text-xs text-gray-500">{mid}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => bump(mid, -1)}
                    className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200"
                  >
                    -
                  </button>

                  <input
                    value={String(count)}
                    onChange={(e) => changeCount(mid, e.target.value)}
                    className="w-16 text-center px-2 py-1 rounded-xl border border-gray-200"
                  />

                  <button
                    onClick={() => bump(mid, +1)}
                    className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200"
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

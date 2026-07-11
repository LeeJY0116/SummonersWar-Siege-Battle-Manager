import React, { useEffect, useMemo, useState } from "react";
import {
  createDefenseDeck,
  fetchDefenseDecks,
  deleteDefenseDeck,
} from "../../lib/defenseDeck.js";
import DefenseDeckCard from "./DefenseDeckCard.jsx";
import DeckMonsterSlot from "./DeckMonsterSlot.jsx";
import { fetchMemberInventory } from "../../lib/inventory.js";
import DefenseDeckFilterBar from "./DefenseDeckFilterBar.jsx";
import Toast from "../common/Toast.jsx";
import { useToast } from "../../hooks/useToast.js";
import { matchesMonsterSearch } from "../../lib/monsterSearch.js";

const GUILD_BATTLE_LEADER_AREAS = new Set(["General", "Guild", "Element", "Attribute"]);

function isGuildBattleLeaderEffect(monster) {
  return Boolean(
    monster?.leaderEffectType &&
      (GUILD_BATTLE_LEADER_AREAS.has(monster.leaderEffectArea) || (!monster.leaderEffectArea && Boolean(monster.leaderEffectElement)))
  );
}

export default function DefenseDeckTab({ members = [], monsters = [] }) {
  const [ownerMemberId, setOwnerMemberId] = useState("");
  const [selectedMonsterCodes, setSelectedMonsterCodes] = useState(["", "", ""]);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ownerInventoryMap, setOwnerInventoryMap] = useState({});
  const [ownerFilterId, setOwnerFilterId] = useState("");
  const [leaderEffectFilter, setLeaderEffectFilter] = useState("");
  const [monsterFilterCodes, setMonsterFilterCodes] = useState([]);
  const [monsterFilterKeyword, setMonsterFilterKeyword] = useState("");
  const { toastMessage, showToast } = useToast(1000);
  

  const visibleDecks = useMemo(() => {
    return decks.filter((deck) => {
      if (ownerFilterId && String(deck.ownerMemberId) !== String(ownerFilterId)) {
        return false;
      }
      if (leaderEffectFilter) {
        const leaderMonster = monsters.find(
          (m) => String(m.id) === String(deck.leaderMonsterId) || m.code === deck.leaderMonsterCode
        );
        const effect = deck.leaderEffectType || (
          isGuildBattleLeaderEffect(leaderMonster) ? leaderMonster.leaderEffectType : ""
        );

        if (effect !== leaderEffectFilter) {
          return false;
        }

        if (leaderMonster && !isGuildBattleLeaderEffect(leaderMonster)) {
          return false;
        }
      }

      if (monsterFilterCodes.length > 0) {
        const deckCodes = (deck.monsters || []).map((m) => m.monsterCode);
        return monsterFilterCodes.every((code) => deckCodes.includes(code));
      }

      return true;
    });
  }, [decks, ownerFilterId, leaderEffectFilter, monsterFilterCodes, monsters]);

  const selectedMonsters = selectedMonsterCodes.map((code) =>
  monsters.find((m) => m.id === code)
);

const [activeSlotIndex, setActiveSlotIndex] = useState(0);
const [monsterSearch, setMonsterSearch] = useState("");

  // 리더효과 목록 만들기
const leaderEffectOptions = useMemo(() => {
  return [...new Set(
    monsters
      .filter(isGuildBattleLeaderEffect)
      .map((m) => m.leaderEffectType)
      .filter(Boolean)
  )];
}, [monsters]);


  // 필터 선택된 길드원 계산 추가
const selectedOwnerFilter = useMemo(() => {
  return members.find((m) => String(m.id) === String(ownerFilterId));
}, [members, ownerFilterId]);

const hasActiveFilters =
  Boolean(ownerFilterId) ||
  Boolean(leaderEffectFilter) ||
  monsterFilterCodes.length > 0;

  // 전체 필터 초기화 함수
  function clearAllFilters() {
  setOwnerFilterId("");
  setLeaderEffectFilter("");
  setMonsterFilterCodes([]);
  setMonsterFilterKeyword("");
}

  // 몬스터 이름 검색
const deckFilterMonsters = useMemo(() => {
  if (!monsterFilterKeyword.trim()) return [];

  return monsters.filter((m) => matchesMonsterSearch(m, monsterFilterKeyword));
}, [monsterFilterKeyword, monsters]);

// 몬스터 선택 토글 함수
function toggleMonsterFilter(code) {
  setMonsterFilterCodes((prev) => {
    // 이미 선택된 몬스터면 해제
    if (prev.includes(code)) {
      return prev.filter((c) => c !== code);
    }

    // 최대 3개 제한
    if (prev.length >= 3) {
      showToast("몬스터 필터는 최대 3마리까지 선택할 수 있습니다.");
      return prev;
    }

    return [...prev, code];
  });
}

function selectMonster(code) {
  if (selectedMonsterCodes.includes(code)) {
    showToast("이미 선택된 몬스터입니다.");
    return;
  }

  // 선택 후 다음 빈 슬롯으로 이동
  setSelectedMonsterCodes((prev) => {
    const next = [...prev];
    next[activeSlotIndex] = code;

    const nextEmptyIndex = next.findIndex((v) => !v);

    if(nextEmptyIndex !== -1) {
        setActiveSlotIndex(nextEmptyIndex);
    } else {
        setActiveSlotIndex(2);
    }

    return next;
  });
}
  const selectedOwner = useMemo(
    () => members.find((m) => String(m.id) === String(ownerMemberId)),
    [members, ownerMemberId]
  );

  useEffect(() => {
    if (!ownerMemberId && members.length > 0) {
      setOwnerMemberId(String(members[0].id));
    }
  }, [members, ownerMemberId]);

  // 길드원 인벤토리 로드
  useEffect(() => {
    if (!ownerMemberId) return;

    fetchMemberInventory(ownerMemberId)
        .then((data) => {
        const map = {};

        for (const item of data || []) {
            if (!item.monsterCode) continue;
            map[item.monsterCode] = item.quantity ?? 0;
        }

        setOwnerInventoryMap(map);
        })
        .catch((e) => {
        console.error(e);
        setOwnerInventoryMap({});
        });
    }, [ownerMemberId]);

    // 방덱 사용 중 개수 계산

    const usedCountMap = useMemo(() => {
        const map = {};

        for (const deck of decks || []) {
            if (String(deck.ownerMemberId) !== String(ownerMemberId)) continue;

            for (const monster of deck.monsters || []) {
            const code = monster.monsterCode;
            if (!code) continue;

            map[code] = (map[code] || 0) + 1;
            }
        }

        return map;
    }, [decks, ownerMemberId]);


const filteredMonsters = monsters.filter((m) => {
  const owned = ownerInventoryMap[m.id] ?? 0;
  const used = usedCountMap[m.id] ?? 0;
  const usable = owned - used;

  // ✅ 보유 중이 아니거나 사용 가능 수량이 없으면 숨김
  if (usable <= 0) return false;

  return matchesMonsterSearch(m, monsterSearch);
});


  async function loadDecks() {
    try {
      setLoading(true);
      const data = await fetchDefenseDecks();
        setDecks(data || []);
    } catch (e) {
      console.error(e);
      alert(e.message || "방덱 목록 조회 실패`");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDecks();
  }, []);

  function changeMonster(index, code) {
    setSelectedMonsterCodes((prev) => {
      const next = [...prev];
      next[index] = code;
      return next;
    });
  }

  async function handleCreateDeck() {
    if (!ownerMemberId) {
      alert("길드원을 선택해주세요.");
      return;
    }

    if (selectedMonsterCodes.some((code) => !code)) {
      showToast("몬스터 3마리를 모두 선택해주세요.");
      return;
    }

    if (new Set(selectedMonsterCodes).size !== 3) {
      showToast("같은 몬스터를 중복 선택할 수 없습니다.");
      return;
    }

    try {
      setLoading(true);

      await createDefenseDeck(ownerMemberId, selectedMonsterCodes);

      alert("방덱이 생성되었습니다.");
      setSelectedMonsterCodes(["", "", ""]);
      setActiveSlotIndex(0);
      await loadDecks();
    } catch (e) {
      console.error(e);
      alert(e.message || "방덱 생성 실패");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDeck(deckId) {
    if (!confirm("이 방덱을 삭제할까요? 인벤토리 수량이 복구됩니다.")) {
      return;
    }

    try {
      setLoading(true);
      await deleteDefenseDeck(deckId);
      await loadDecks();
    } catch (e) {
      console.error(e);
      alert(e.message || "방덱 삭제 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Toast message={toastMessage} />
      <section className="border rounded-2xl p-4 bg-white">
        <h3 className="font-bold text-lg mb-3">방덱 생성</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold mb-1">방덱 소유 길드원</label>
            <select
              value={ownerMemberId}
              onChange={(e) => setOwnerMemberId(e.target.value)}
              className="border rounded-xl px-3 py-2 w-full"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.displayName ?? m.nickname ?? m.name ?? `멤버 ${m.id}`}
                  {m.role ? ` · ${m.role}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
  <div className="mb-2 text-sm font-semibold">방덱 몬스터 선택</div>

    <div className="mb-4 flex gap-3">
        {[0, 1, 2].map((index) => (
        <DeckMonsterSlot
            key={index}
            monster={selectedMonsters[index]}
            isLeader={index === 0}
            isActive={activeSlotIndex === index}
            onClick={() => setActiveSlotIndex(index)}
        />
        ))}
    </div>

    <div className="mb-2 text-sm text-gray-600">
        현재 선택 슬롯:{" "}
        <span className="font-semibold">
        {activeSlotIndex === 0 ? "리더" : `${activeSlotIndex + 1}번`}
        </span>
    </div>

    <input
        value={monsterSearch}
        onChange={(e) => setMonsterSearch(e.target.value)}
        placeholder="몬스터 검색"
        className="mb-3 w-full rounded-xl border px-3 py-2"
    />

    <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto rounded-2xl border p-3">
        {filteredMonsters.map((m) => {
        const selected = selectedMonsterCodes.includes(m.id);

        return (
            <button
            key={m.id}
            type="button"
            onClick={() => selectMonster(m.id)}
            disabled={selected}
            className={`rounded-xl border p-2 text-center text-xs transition hover:bg-gray-50 disabled:opacity-40 ${
                selected ? "bg-gray-100" : "bg-white"
            }`}
            >
            {m.iconDataUrl ? (
                <img
                src={m.iconDataUrl}
                alt={m.name}
                className="mx-auto mb-1 h-12 w-12 rounded-lg object-cover"
                />
            ) : (
                <div className="mx-auto mb-1 h-12 w-12 rounded-lg bg-gray-200" />
            )}

            <div className="truncate font-semibold">{m.name}</div>
            <div className="truncate text-[10px] text-gray-400">{m.element}</div>
            <div className="text-[10px] text-gray-500">
            가능 {ownerInventoryMap[m.id] - (usedCountMap[m.id] ?? 0)} / 보유 {ownerInventoryMap[m.id]}
            </div>
            </button>
        );
        })}
    </div>
  </div>
          <button
            onClick={handleCreateDeck}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-black text-white disabled:bg-gray-400"
          >
            방덱 생성
          </button>
        </div>
      </section>

      <section className="border rounded-2xl p-4 bg-white">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg">방덱 목록</h3>
          <button
            onClick={loadDecks}
            disabled={loading}
            className="px-3 py-1 rounded-xl border"
          >
            새로고침
          </button>

          <DefenseDeckFilterBar
            members={members}
            monsters={monsters}

            ownerFilterId={ownerFilterId}
            setOwnerFilterId={setOwnerFilterId}

            leaderEffectFilter={leaderEffectFilter}
            setLeaderEffectFilter={setLeaderEffectFilter}

            monsterFilterKeyword={monsterFilterKeyword}
            setMonsterFilterKeyword={setMonsterFilterKeyword}

            monsterFilterCodes={monsterFilterCodes}
            setMonsterFilterCodes={setMonsterFilterCodes}
          />
            </div>
            
        {visibleDecks.length === 0 ? (
          <p className="text-sm text-gray-500">등록된 방덱이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {visibleDecks.map((deck) => (
              <DefenseDeckCard
              key={deck.deckId}
              deck={deck}
              monsters={monsters}
              onDelete={handleDeleteDeck}
                />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

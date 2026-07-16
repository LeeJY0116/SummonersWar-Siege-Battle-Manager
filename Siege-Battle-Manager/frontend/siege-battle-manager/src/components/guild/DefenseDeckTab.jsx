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
import { getElementLabel, isGuildBattleLeaderEffect } from "../../lib/monsterLabels.js";

function getDeckGroupKey(deck) {
  const monsterCodes = (deck.monsters || [])
    .map((monster) => monster.monsterCode)
    .filter(Boolean);

  if (monsterCodes.length === 0) return "";

  const [leaderCode, ...memberCodes] = monsterCodes;
  return `${leaderCode}::${memberCodes.sort().join("|")}`;
}

function groupDecksByMonsterSet(decks) {
  const groupMap = new Map();

  for (const deck of decks) {
    const key = getDeckGroupKey(deck);
    if (!key) continue;

    const existing = groupMap.get(key);
    if (existing) {
      existing.decks.push(deck);
      continue;
    }

    groupMap.set(key, {
      key,
      representative: deck,
      decks: [deck],
    });
  }

  return [...groupMap.values()];
}

function getMonsterStars(monster) {
  return Number(monster?.naturalStars ?? monster?.grade ?? 0);
}

export default function DefenseDeckTab({
  members = [],
  monsters = [],
  canManageGuild = false,
  currentGuildMemberId = null,
}) {
  const [ownerMemberId, setOwnerMemberId] = useState("");
  const [selectedMonsterCodes, setSelectedMonsterCodes] = useState(["", "", ""]);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ownerInventoryMap, setOwnerInventoryMap] = useState({});
  const [ownerFilterId, setOwnerFilterId] = useState("");
  const [leaderEffectFilter, setLeaderEffectFilter] = useState("");
  const [monsterFilterCodes, setMonsterFilterCodes] = useState([]);
  const [monsterFilterKeyword, setMonsterFilterKeyword] = useState("");
  const [fourStarDeckOnly, setFourStarDeckOnly] = useState(false);
  const { toastMessage, showToast } = useToast(1000);
  const manageableMembers = useMemo(() => {
    if (canManageGuild) return members;

    return members.filter(
      (member) => String(member.id) === String(currentGuildMemberId)
    );
  }, [canManageGuild, currentGuildMemberId, members]);
  const canManageOwnDeck = Boolean(currentGuildMemberId);
  const canEditDisplayedDecks = canManageGuild || canManageOwnDeck;
  

  const visibleDecks = useMemo(() => {
    return decks.filter((deck) => {
      if (ownerFilterId && String(deck.ownerMemberId) !== String(ownerFilterId)) {
        return false;
      }
      if (leaderEffectFilter) {
        const leaderMonster = monsters.find(
          (m) => String(m.id) === String(deck.leaderMonsterId) || m.code === deck.leaderMonsterCode
        );
        const effect = isGuildBattleLeaderEffect(leaderMonster)
          ? leaderMonster.leaderEffectType
          : "";

        if (effect !== leaderEffectFilter) {
          return false;
        }
      }

      if (monsterFilterCodes.length > 0) {
        const deckCodes = (deck.monsters || []).map((m) => m.monsterCode);
        if (!monsterFilterCodes.every((code) => deckCodes.includes(code))) {
          return false;
        }
      }

      if (fourStarDeckOnly) {
        const hasFiveStarMonster = (deck.monsters || []).some((deckMonster) => {
          const monster = monsters.find(
            (m) => m.id === deckMonster.monsterCode || m.monsterCode === deckMonster.monsterCode || m.code === deckMonster.monsterCode
          );

          return getMonsterStars(monster) >= 5;
        });

        if (hasFiveStarMonster) {
          return false;
        }
      }

      return true;
    });
  }, [decks, ownerFilterId, leaderEffectFilter, monsterFilterCodes, fourStarDeckOnly, monsters]);

  const groupedVisibleDecks = useMemo(
    () => groupDecksByMonsterSet(visibleDecks),
    [visibleDecks]
  );

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
  return manageableMembers.find((m) => String(m.id) === String(ownerFilterId));
}, [manageableMembers, ownerFilterId]);

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
    if (!manageableMembers.length) return;

    if (manageableMembers.some((member) => String(member.id) === String(ownerMemberId))) {
      return;
    }

    setOwnerMemberId(String(manageableMembers[0].id));
  }, [manageableMembers, ownerMemberId]);

  useEffect(() => {
    setSelectedMonsterCodes(["", "", ""]);
    setActiveSlotIndex(0);
    setMonsterSearch("");
  }, [ownerMemberId]);

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
      {canEditDisplayedDecks && (
        <section className="rounded-2xl border border-[#8b6a2e] bg-[#2f241b] p-4 text-[#f6deb0] shadow-[0_10px_24px_rgba(31,20,10,0.18)]">
          <h3 className="font-bold text-lg mb-3">방덱 생성</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold mb-1 text-[#f6deb0]">방덱 소유 길드원</label>
              <select
                value={ownerMemberId}
                onChange={(e) => setOwnerMemberId(e.target.value)}
                className="w-full rounded-xl border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] outline-none focus:border-[#f6c44f]"
              >
                {manageableMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName ?? m.nickname ?? m.name ?? `멤버 ${m.id}`}
                  </option>
                ))}
              </select>
            </div>

          <div>
  <div className="mb-2 text-sm font-semibold text-[#f6deb0]">방덱 몬스터 선택</div>
  <div className="rounded-xl border border-[#745320] bg-[#211813] p-3">

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

    <div className="mb-2 text-sm text-[#d7be80]">
        현재 선택 슬롯:{" "}
        <span className="font-semibold">
        {activeSlotIndex === 0 ? "리더" : `${activeSlotIndex + 1}번`}
        </span>
    </div>

    <input
        value={monsterSearch}
        onChange={(e) => setMonsterSearch(e.target.value)}
        placeholder="몬스터 검색"
        className="mb-3 w-full rounded-xl border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] placeholder:text-[#bda981] outline-none focus:border-[#f6c44f]"
    />

    <div className="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-[#745320] bg-[#211813] p-3 [scrollbar-color:#9b743a_#2f241b] [scrollbar-width:thin] sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#9b743a] [&::-webkit-scrollbar-track]:bg-[#2f241b]">
        {filteredMonsters.map((m) => {
        const selected = selectedMonsterCodes.includes(m.id);

        return (
            <button
            key={m.id}
            type="button"
            onClick={() => selectMonster(m.id)}
            disabled={selected}
            className={`rounded-md border-2 p-1.5 text-center text-[11px] transition hover:border-[#ffd86a] hover:brightness-110 disabled:opacity-45 ${
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

            <div className="mt-1 flex min-h-[28px] items-center justify-center px-1 font-semibold leading-tight text-[#f6deb0] antialiased">{m.name}</div>
            <div className="truncate text-[10px] font-semibold text-[#c8a96a]">
              {getElementLabel(m.element ?? m.attribute)}
            </div>
            <div className="text-[10px] font-semibold text-[#d7be80]">
            가능 {ownerInventoryMap[m.id] - (usedCountMap[m.id] ?? 0)} / 보유 {ownerInventoryMap[m.id]}
            </div>
            </button>
        );
        })}
    </div>
  </div>
  </div>
          <button
            onClick={handleCreateDeck}
            disabled={loading}
            className="rounded-xl bg-black px-4 py-2 font-semibold text-white disabled:bg-gray-400"
          >
            방덱 생성
          </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-[#8b6a2e] bg-[#2f241b] p-4 text-[#f6deb0] shadow-[0_10px_24px_rgba(31,20,10,0.18)]">
        <div className="mb-3 flex flex-col gap-2 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-3">
          <h3 className="font-bold text-lg">방덱 목록</h3>
          <button
            type="button"
            onClick={() => setFourStarDeckOnly((prev) => !prev)}
            className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
              fourStarDeckOnly
                ? "border-[#f6c44f] bg-[#f3d37b] text-[#2f1f13]"
                : "border-[#9b743a] bg-[#221913] text-[#f8e0ad] hover:border-[#f6c44f]"
            }`}
          >
            4성 방덱
          </button>
          <button
            onClick={loadDecks}
            disabled={loading}
            className="rounded-xl border border-[#9b743a] bg-[#221913] px-3 py-1 text-sm font-semibold text-[#f8e0ad] hover:border-[#f6c44f] sm:justify-self-end"
          >
            새로고침
          </button>
        </div>

        <div className="mb-3 rounded-xl border border-[#745320] bg-[#211813] p-3">
          <DefenseDeckFilterBar
            members={canManageGuild ? members : manageableMembers}
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
            
        {groupedVisibleDecks.length === 0 ? (
          <p className="text-sm text-[#d7be80]">등록된 방덱이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {groupedVisibleDecks.map((group) => (
              <DefenseDeckCard
                key={group.key}
                group={group}
                monsters={monsters}
                onDelete={handleDeleteDeck}
                canManageGuild={canManageGuild}
                currentGuildMemberId={currentGuildMemberId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

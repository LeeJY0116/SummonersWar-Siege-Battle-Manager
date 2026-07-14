import { useEffect, useState } from "react";
import { 
  fetchOwnerlessDefenseDecks,
  fetchOwnerlessDefenseDeckDetail,
  createOwnerlessDefenseDeck,
 } from "../../lib/ownerlessDefenseDeck.js";
import DeckMonsterSlot from "./DeckMonsterSlot.jsx";
import DefenseDeckFilterBar from "./DefenseDeckFilterBar.jsx";
import { matchesMonsterSearch } from "../../lib/monsterSearch.js";
import MonsterFilterControls, {
  matchesMonsterPickerFilters,
} from "../monsters/MonsterFilterControls.jsx";
import { getElementLabel, getLeaderEffectLabel, isGuildBattleLeaderEffect } from "../../lib/monsterLabels.js";

export default function OwnerlessDefenseDeckTab({ monsters = [] }) {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openedDeckId, setOpenedDeckId] = useState(null);
  const [detailMap, setDetailMap] = useState({});
  const [title, setTitle] = useState("");
  const [selectedMonsterCodes, setSelectedMonsterCodes] = useState(["", "", ""]);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);
  const [monsterSearch, setMonsterSearch] = useState("");
  const [monsterStarFilter, setMonsterStarFilter] = useState(5);
  const [monsterElementFilter, setMonsterElementFilter] = useState("");
  const [leaderEffectFilter, setLeaderEffectFilter] = useState("");
  const [monsterFilterKeyword, setMonsterFilterKeyword] = useState("");
  const [monsterFilterCodes, setMonsterFilterCodes] = useState([]);
  const [fourStarDeckOnly, setFourStarDeckOnly] = useState(false);


  const selectedMonsters = selectedMonsterCodes.map((code) =>
    monsters.find((m) => m.id === code)
  );

  const filteredMonsters = monsters.filter((m) => {
    return (
      matchesMonsterSearch(m, monsterSearch) &&
      matchesMonsterPickerFilters(m, {
        query: monsterSearch,
        starFilter: monsterStarFilter,
        elementFilter: monsterElementFilter,
      })
    );
  });

  function selectMonster(code) {
    if (selectedMonsterCodes.includes(code)) {
      alert("이미 선택된 몬스터입니다.");
      return;
    }

    setSelectedMonsterCodes((prev) => {
      const next = [...prev];
      next[activeSlotIndex] = code;

      const nextEmptyIndex = next.findIndex((v) => !v);
      setActiveSlotIndex(nextEmptyIndex !== -1 ? nextEmptyIndex : 2);

      return next;
    });
  }
  function findMonster(code) {
    return monsters.find((m) => m.id === code || m.monsterCode === code || m.code === code);
  }

  function getDeckMonsterCode(item) {
    return typeof item === "string"
      ? item
      : item?.monsterCode ?? item?.code;
  }

  function getDeckMonsterCodes(deck) {
    return (deck.monsters ?? deck.monsterCodes ?? [])
      .map(getDeckMonsterCode)
      .filter(Boolean);
  }

  function getLeaderMonsterFromDeck(deck) {
    return findMonster(getDeckMonsterCode((deck.monsters ?? deck.monsterCodes ?? [])[0]));
  }

  function getLeaderEffectText(deck) {
    const leaderMonster = getLeaderMonsterFromDeck(deck);

    if (!isGuildBattleLeaderEffect(leaderMonster)) {
      return "없음";
    }

    return (
      leaderMonster?.leaderEffectText ||
      getLeaderEffectLabel(leaderMonster?.leaderEffectType) ||
      leaderMonster?.leaderEffectType ||
      "없음"
    );
  }

  function getMonsterStars(monster) {
    return Number(monster?.naturalStars ?? monster?.grade ?? 0);
  }

  function hasFiveStarMonster(deck) {
    return getDeckMonsterCodes(deck).some((code) => getMonsterStars(findMonster(code)) >= 5);
  }

  async function loadDecks() {
    try {
      setLoading(true);
      const data = await fetchOwnerlessDefenseDecks();
      setDecks(data || []);
    } catch (e) {
      console.error(e);
      alert(e.message || "길드 방덱 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  // 생성 함수
  async function handleCreateDeck() {
    if (selectedMonsterCodes.some((code) => !code)) {
      alert("몬스터 3마리를 모두 선택해주세요.");
      return;
    }

    if (new Set(selectedMonsterCodes).size !== 3) {
      alert("같은 몬스터를 중복 선택할 수 없습니다.");
      return;
    }

    try {
      setLoading(true);

      await createOwnerlessDefenseDeck({
        title: title.trim() || "길드 방덱",
        monsterCodes: selectedMonsterCodes,
      });

      alert("길드 방덱이 등록되었습니다.");
      setTitle("");
      setSelectedMonsterCodes(["", "", ""]);
      setActiveSlotIndex(0);
      await loadDecks();
    } catch (e) {
      console.error(e);
      alert(e.message || "길드 방덱 등록 실패");
    } finally {
      setLoading(false);
    }
  }
  //
  async function handleToggleDetail(deckId) {

  // 이미 열려있으면 닫기
  if (openedDeckId === deckId) {
    setOpenedDeckId(null);
    return;
  }

  setOpenedDeckId(deckId);

  // 이미 조회했으면 재조회 안 함
  if (detailMap[deckId]) {
    return;
  }

  try {

    const detail =
      await fetchOwnerlessDefenseDeckDetail(deckId);

    setDetailMap((prev) => ({
      ...prev,
      [deckId]: detail,
    }));

  } catch (e) {
    console.error(e);
    alert(e.message || "상세 조회 실패");
  }
}

  useEffect(() => {
    loadDecks();
  }, []);

  const visibleDecks = decks.filter((deck) => {
    const leaderMonster = getLeaderMonsterFromDeck(deck);

    if (leaderEffectFilter) {
      const effect = isGuildBattleLeaderEffect(leaderMonster)
        ? leaderMonster?.leaderEffectType
        : "";

      if (effect !== leaderEffectFilter) {
        return false;
      }
    }

    if (monsterFilterCodes.length > 0) {
      const deckCodes = getDeckMonsterCodes(deck);
      if (!monsterFilterCodes.every((code) => deckCodes.includes(code))) {
        return false;
      }
    }

    if (fourStarDeckOnly && hasFiveStarMonster(deck)) {
      return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-lg font-bold">길드 방덱</h3>

          <section className="rounded-2xl border border-[#8b6a2e] bg-[#2f241b] p-4 text-[#f6deb0] shadow-[0_10px_24px_rgba(31,20,10,0.18)]">
            <h3 className="mb-3 text-lg font-bold">길드 방덱 등록</h3>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="방덱 제목"
              className="mb-3 w-full rounded-xl border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] placeholder:text-[#bda981] outline-none focus:border-[#f6c44f]"
            />

            <div className="mb-4 rounded-xl border border-[#745320] bg-[#211813] p-3">
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

              <input
                value={monsterSearch}
                onChange={(e) => setMonsterSearch(e.target.value)}
                placeholder="몬스터 검색"
                className="mb-3 w-full rounded-xl border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] placeholder:text-[#bda981] outline-none focus:border-[#f6c44f]"
              />

              <MonsterFilterControls
                starFilter={monsterStarFilter}
                onChangeStarFilter={setMonsterStarFilter}
                elementFilter={monsterElementFilter}
                onChangeElementFilter={setMonsterElementFilter}
                disabled={Boolean(monsterSearch.trim())}
                variant="dark"
              />

              <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto rounded-xl border border-[#745320] bg-[#211813] p-3 [scrollbar-color:#9b743a_#2f241b] [scrollbar-width:thin] sm:grid-cols-6 md:grid-cols-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#9b743a] [&::-webkit-scrollbar-track]:bg-[#2f241b]">
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

                    <div className="mt-1 flex min-h-[28px] items-center justify-center px-1 font-semibold leading-tight text-[#f6deb0] antialiased">
                      {m.name}
                    </div>
                    <div className="truncate text-[10px] font-semibold text-[#c8a96a]">
                      {getElementLabel(m.element ?? m.attribute)}
                    </div>
                  </button>
                );
              })}
              </div>
            </div>

            <button
              onClick={handleCreateDeck}
              disabled={loading}
              className="rounded-xl bg-black px-4 py-2 font-semibold text-white disabled:bg-gray-400"
            >
              길드 방덱 등록
            </button>
          </section>
      </div>

      <section className="rounded-2xl border border-[#8b6a2e] bg-[#2f241b] p-4 text-[#f6deb0] shadow-[0_10px_24px_rgba(31,20,10,0.18)]">
        <div className="mb-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <h3 className="text-lg font-bold">길드 방덱 목록</h3>
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
            className="justify-self-end rounded-xl border border-[#9b743a] bg-[#221913] px-3 py-1 text-sm font-semibold text-[#f8e0ad] hover:border-[#f6c44f]"
          >
            새로고침
          </button>
        </div>

        <div className="mb-3 rounded-xl border border-[#745320] bg-[#211813] p-3">
          <DefenseDeckFilterBar
            monsters={monsters}
            showOwnerFilter={false}
            leaderEffectFilter={leaderEffectFilter}
            setLeaderEffectFilter={setLeaderEffectFilter}
            monsterFilterKeyword={monsterFilterKeyword}
            setMonsterFilterKeyword={setMonsterFilterKeyword}
            monsterFilterCodes={monsterFilterCodes}
            setMonsterFilterCodes={setMonsterFilterCodes}
          />
        </div>

        {visibleDecks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#745320] bg-[#211813] p-6 text-center text-sm text-[#d7be80]">
            등록된 길드 방덱이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleDecks.map((deck) => {
              const deckHasFiveStarMonster = hasFiveStarMonster(deck);

              return (
            <div
              key={deck.id ?? deck.deckId}
              className="rounded-xl border border-[#745320] bg-[#211813] p-4 text-[#f6deb0] shadow-[inset_0_0_0_1px_rgba(255,237,169,0.12)]"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">
                    {deck.title ?? "이름 없는 길드 방덱"}
                  </div>
                  <span
                    className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      deckHasFiveStarMonster
                        ? "bg-[#3c1f1a] text-[#ffcf9d]"
                        : "bg-[#f3d37b] text-[#2f1f13]"
                    }`}
                  >
                    {deckHasFiveStarMonster ? "5성" : "4성"}
                  </span>
                  <div className="mt-1 text-sm font-semibold text-[#d7be80]">
                    리더 효과: {getLeaderEffectText(deck)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {deck.availableMemberCount != null && (
                    <span className="text-xs font-semibold text-[#c8a96a]">
                      생성 가능 길드원: {deck.availableMemberCount}명
                    </span>
                  )}
                  <button
                    onClick={() =>
                      handleToggleDetail(deck.deckId ?? deck.id)
                    }
                    className="rounded-xl border border-[#9b743a] bg-[#221913] px-3 py-1 text-sm font-semibold text-[#f8e0ad] hover:border-[#f6c44f]"
                  >
                    {openedDeckId === (deck.deckId ?? deck.id)
                      ? "상세 닫기"
                      : "상세 보기"}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap justify-start gap-2">
                {(deck.monsters ?? deck.monsterCodes ?? []).map((item, index) => {
                  const code = getDeckMonsterCode(item);

                  const monster = findMonster(code);

                  return (
                    <div
                      key={`${code}-${index}`}
                      className={`relative w-24 rounded-md border-2 bg-[#4b3421] p-1.5 text-center shadow-[inset_0_0_0_1px_rgba(255,237,169,0.35)] ${
                        index === 0
                          ? "border-[#f6c44f]"
                          : "border-[#b79148]"
                      }`}
                    >
                      {index === 0 && (
                        <div className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-[1px] text-[10px] font-bold text-[#ffd96a]">
                          L
                        </div>
                      )}

                      {monster?.iconDataUrl ? (
                        <img
                          src={monster.iconDataUrl}
                          alt={monster.name}
                          className="mx-auto h-16 w-16 rounded-sm border border-[#3c2414] object-cover"
                        />
                      ) : (
                        <div className="mx-auto h-16 w-16 rounded-sm border border-[#3c2414] bg-[#2f241b]" />
                      )}

                      <div className="mt-1 flex min-h-[28px] items-center justify-center px-1 text-xs font-semibold leading-tight text-[#f6deb0] antialiased">
                        {monster?.name ?? code}
                      </div>
                      {monster && (
                        <div className="text-[10px] font-semibold text-[#c8a96a]">
                          {getElementLabel(monster.element ?? monster.attribute)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

        {openedDeckId === (deck.deckId ?? deck.id) &&
          detailMap[deck.deckId ?? deck.id] && (

          <div className="mt-4 rounded-xl border border-[#745320] bg-[#2f241b] p-4">

            <div className="mb-2 text-sm font-semibold text-[#f6deb0]">
              생성 가능 길드원
            </div>

            <div className="space-y-2">

              {detailMap[
                deck.deckId ?? deck.id
              ].availableMembers?.map((member) => (

                <div
                  key={member.guildMemberId}
                  className="flex items-center justify-between rounded-xl border border-[#745320] bg-[#211813] px-3 py-2 text-sm text-[#f6deb0]"
                >

                  <div>
                    {member.displayName}
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-[#ffd96a]">
                      {member.buildableCount ?? 1}세트 가능
                    </div>
                    <div className="text-xs text-[#c8a96a]">
                      {member.type}
                    </div>
                  </div>
                </div>
              ))}

            </div>

          </div>

        )}

            </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

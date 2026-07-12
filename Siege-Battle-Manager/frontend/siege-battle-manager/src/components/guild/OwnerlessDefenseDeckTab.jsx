import { useEffect, useState } from "react";
import { 
  fetchOwnerlessDefenseDecks,
  fetchOwnerlessDefenseDeckDetail,
  createOwnerlessDefenseDeck,
 } from "../../lib/ownerlessDefenseDeck.js";
import DeckMonsterSlot from "./DeckMonsterSlot.jsx";
import { matchesMonsterSearch } from "../../lib/monsterSearch.js";
import MonsterFilterControls, {
  matchesMonsterPickerFilters,
} from "../monsters/MonsterFilterControls.jsx";
import { getElementLabel } from "../../lib/monsterLabels.js";

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
    return monsters.find((m) => m.id === code);
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

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">길드 방덱</h3>
          <button
            onClick={loadDecks}
            disabled={loading}
            className="rounded-xl border px-3 py-1 text-sm"
          >
            새로고침
          </button>
        </div>

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

      {decks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#745320] bg-[#211813] p-6 text-center text-sm text-[#d7be80]">
          등록된 길드 방덱이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {decks.map((deck) => (
            <div
              key={deck.id ?? deck.deckId}
              className="rounded-xl border border-[#745320] bg-[#211813] p-4 text-[#f6deb0] shadow-[inset_0_0_0_1px_rgba(255,237,169,0.12)]"
            >
              <div className="mb-3 font-semibold">
                {deck.title ?? "이름 없는 길드 방덱"}
              </div>

              <div className="flex flex-wrap justify-start gap-2">
                {(deck.monsters ?? deck.monsterCodes ?? []).map((item, index) => {
                  const code =
                    typeof item === "string"
                      ? item
                      : item.monsterCode ?? item.code;

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

        <button
          onClick={() =>
            handleToggleDetail(deck.deckId ?? deck.id)
          }
          className="mt-3 rounded-xl border border-[#9b743a] bg-[#221913] px-3 py-1 text-sm font-semibold text-[#f8e0ad] hover:border-[#f6c44f]"
        >
          {openedDeckId === (deck.deckId ?? deck.id)
            ? "상세 닫기"
            : "상세 보기"}
        </button>
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

              {deck.availableMemberCount != null && (
                <div className="mt-3 text-sm font-semibold text-[#d7be80]">
                  생성 가능 길드원: {deck.availableMemberCount}명
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

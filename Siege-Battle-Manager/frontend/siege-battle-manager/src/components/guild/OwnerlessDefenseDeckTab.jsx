import { useEffect, useState } from "react";
import { 
  fetchOwnerlessDefenseDecks,
  fetchOwnerlessDefenseDeckDetail,
  createOwnerlessDefenseDeck,
 } from "../../lib/ownerlessDefenseDeck.js";
import DeckMonsterSlot from "./DeckMonsterSlot.jsx";
import { matchesMonsterSearch } from "../../lib/monsterSearch.js";

export default function OwnerlessDefenseDeckTab({ monsters = [] }) {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openedDeckId, setOpenedDeckId] = useState(null);
  const [detailMap, setDetailMap] = useState({});
  const [title, setTitle] = useState("");
  const [selectedMonsterCodes, setSelectedMonsterCodes] = useState(["", "", ""]);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);
  const [monsterSearch, setMonsterSearch] = useState("");


  const selectedMonsters = selectedMonsterCodes.map((code) =>
    monsters.find((m) => m.id === code)
  );

  const filteredMonsters = monsters.filter((m) => {
    return matchesMonsterSearch(m, monsterSearch);
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">길드 방덱</h3>

          <section className="rounded-2xl border bg-white p-4">
            <h3 className="mb-3 text-lg font-bold">길드 방덱 등록</h3>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="방덱 제목"
              className="mb-3 w-full rounded-xl border px-3 py-2"
            />

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
              className="mb-3 w-full rounded-xl border px-3 py-2"
            />

            <div className="mb-4 grid max-h-72 grid-cols-4 gap-2 overflow-y-auto rounded-2xl border p-3">
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
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleCreateDeck}
              disabled={loading}
              className="rounded-xl bg-black px-4 py-2 text-white disabled:bg-gray-400"
            >
              길드 방덱 등록
            </button>
          </section>
        <button
          onClick={loadDecks}
          disabled={loading}
          className="rounded-xl border px-3 py-1 text-sm"
        >
          새로고침
        </button>
      </div>

      {decks.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-gray-500">
          등록된 길드 방덱이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {decks.map((deck) => (
            <div
              key={deck.id ?? deck.deckId}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              <div className="mb-3 font-semibold">
                {deck.title ?? "이름 없는 길드 방덱"}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(deck.monsters ?? deck.monsterCodes ?? []).map((item, index) => {
                  const code =
                    typeof item === "string"
                      ? item
                      : item.monsterCode ?? item.code;

                  const monster = findMonster(code);

                  return (
                    <div
                      key={`${code}-${index}`}
                      className={`rounded-2xl border p-2 text-center ${
                        index === 0
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      {index === 0 && (
                        <div className="mb-1 text-[10px] font-bold text-blue-600">
                          LEADER
                        </div>
                      )}

                      {monster?.iconDataUrl ? (
                        <img
                          src={monster.iconDataUrl}
                          alt={monster.name}
                          className="mx-auto h-14 w-14 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="mx-auto h-14 w-14 rounded-xl bg-gray-200" />
                      )}

                      <div className="mt-2 truncate text-sm font-semibold">
                        {monster?.name ?? code}
                      </div>
                    </div>
                  );
                })}
              </div>

        <button
          onClick={() =>
            handleToggleDetail(deck.deckId ?? deck.id)
          }
          className="mt-3 rounded-xl border px-3 py-1 text-sm"
        >
          {openedDeckId === (deck.deckId ?? deck.id)
            ? "상세 닫기"
            : "상세 보기"}
        </button>
        {openedDeckId === (deck.deckId ?? deck.id) &&
          detailMap[deck.deckId ?? deck.id] && (

          <div className="mt-4 rounded-2xl bg-gray-50 p-4">

            <div className="mb-2 text-sm font-semibold">
              생성 가능 길드원
            </div>

            <div className="space-y-2">

              {detailMap[
                deck.deckId ?? deck.id
              ].availableMembers?.map((member) => (

                <div
                  key={member.guildMemberId}
                  className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm"
                >

                  <div>
                    {member.displayName}
                  </div>

                  <div className="text-right">
                    <div className="text-blue-600 font-semibold">
                      {member.buildableCount ?? 1}세트 가능
                    </div>
                    <div className="text-xs text-gray-400">
                      {member.type}
                    </div>
                  </div>
                </div>
              ))}

            </div>

          </div>

        )}

              {deck.availableMemberCount != null && (
                <div className="mt-3 text-sm text-gray-600">
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

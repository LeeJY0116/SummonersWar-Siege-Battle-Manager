import { useEffect, useState } from "react";
import { fetchOwnerlessDefenseDecks } from "../../lib/ownerlessDefenseDeck.js";

export default function OwnerlessDefenseDeckTab({ monsters = [] }) {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(false);

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
      alert(e.message || "추천 방덱 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDecks();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">추천 방덱</h3>

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
          등록된 추천 방덱이 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {decks.map((deck) => (
            <div
              key={deck.id ?? deck.deckId}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              <div className="mb-3 font-semibold">
                {deck.title ?? "이름 없는 추천 방덱"}
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
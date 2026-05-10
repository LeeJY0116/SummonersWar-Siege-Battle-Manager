import React, { useEffect, useMemo, useState } from "react";
import {
  createDefenseDeck,
  fetchDefenseDecks,
  deleteDefenseDeck,
} from "../../lib/defenseDeck.js";

export default function DefenseDeckTab({ members = [], monsters = [] }) {
  const [ownerMemberId, setOwnerMemberId] = useState("");
  const [selectedMonsterCodes, setSelectedMonsterCodes] = useState(["", "", ""]);
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedOwner = useMemo(
    () => members.find((m) => String(m.id) === String(ownerMemberId)),
    [members, ownerMemberId]
  );

  useEffect(() => {
    if (!ownerMemberId && members.length > 0) {
      setOwnerMemberId(String(members[0].id));
    }
  }, [members, ownerMemberId]);

  async function loadDecks() {
    try {
      setLoading(true);
      const data = await fetchDefenseDecks();
      setDecks(data || []);
    } catch (e) {
      console.error(e);
      alert(e.message || "방덱 목록 조회 실패");
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
      alert("몬스터 3마리를 모두 선택해주세요.");
      return;
    }

    if (new Set(selectedMonsterCodes).size !== 3) {
      alert("같은 몬스터를 중복 선택할 수 없습니다.");
      return;
    }

    try {
      setLoading(true);

      await createDefenseDeck(ownerMemberId, selectedMonsterCodes);

      alert("방덱이 생성되었습니다.");
      setSelectedMonsterCodes(["", "", ""]);
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

          {[0, 1, 2].map((index) => (
            <div key={index}>
              <label className="block text-sm font-semibold mb-1">
                {index === 0 ? "리더 몬스터" : `${index + 1}번 몬스터`}
              </label>

              <select
                value={selectedMonsterCodes[index]}
                onChange={(e) => changeMonster(index, e.target.value)}
                className="border rounded-xl px-3 py-2 w-full"
              >
                <option value="">몬스터 선택</option>
                {monsters.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.element})
                  </option>
                ))}
              </select>
            </div>
          ))}

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
        </div>

        {decks.length === 0 ? (
          <p className="text-sm text-gray-500">등록된 방덱이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {decks.map((deck) => (
              <div key={deck.deckId} className="border rounded-xl p-3">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {deck.ownerName}의 방덱
                    </div>
                    <div className="text-sm text-gray-600">
                      리더: {deck.leaderMonsterName}
                      {deck.leaderEffectType ? ` · ${deck.leaderEffectType}` : ""}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteDeck(deck.deckId)}
                    className="text-sm px-3 py-1 rounded-xl border border-red-300 text-red-600"
                  >
                    삭제
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {deck.monsters?.map((m) => (
                    <span
                      key={m.monsterCode ?? m.monsterId}
                      className="text-sm px-2 py-1 rounded-lg bg-gray-100"
                    >
                      {m.monsterName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
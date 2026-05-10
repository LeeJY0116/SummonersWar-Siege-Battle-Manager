import { apiFetch } from "./api";

export async function createDefenseDeck(ownerMemberId, monsterCodes) {
  const res = await apiFetch(`/defense-decks/${ownerMemberId}`, {
    method: "POST",
    body: JSON.stringify({
      monsterCodes,
    }),
  });

  return res.data;
}

export async function fetchDefenseDecks(params = {}) {
  const qs = new URLSearchParams(params).toString();

  const res = await apiFetch(
    `/defense-decks${qs ? `?${qs}` : ""}`
  );

  return res.data;
}

export async function deleteDefenseDeck(deckId) {
  const res = await apiFetch(`/defense-decks/${deckId}`, {
    method: "DELETE",
  });

  return res.data;
}
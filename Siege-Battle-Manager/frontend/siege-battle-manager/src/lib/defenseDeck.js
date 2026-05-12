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
  const cleanParams = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      cleanParams[key] = value;
    }
  });

  const qs = new URLSearchParams(cleanParams).toString();

  const res = await apiFetch(`/defense-decks${qs ? `?${qs}` : ""}`);

  return res.data;
}

export async function deleteDefenseDeck(deckId) {
  const res = await apiFetch(`/defense-decks/${deckId}`, {
    method: "DELETE",
  });

  return res.data;
}
import { apiFetch } from "./api";

export async function fetchOwnerlessDefenseDecks() {
  const res = await apiFetch("/ownerless-defense-decks");
  return res.data;
}

export async function fetchOwnerlessDefenseDeckDetail(deckId) {
  const res = await apiFetch(
    `/ownerless-defense-decks/${deckId}`
  );

  return res.data;
}

export async function createOwnerlessDefenseDeck({ title, monsterCodes }) {
  const res = await apiFetch("/ownerless-defense-decks", {
    method: "POST",
    body: JSON.stringify({
      title,
      monsterCodes,
    }),
  });

  return res.data;
}

export async function deleteOwnerlessDefenseDeck(deckId) {
  await apiFetch(`/ownerless-defense-decks/${deckId}`, {
    method: "DELETE",
  });
}

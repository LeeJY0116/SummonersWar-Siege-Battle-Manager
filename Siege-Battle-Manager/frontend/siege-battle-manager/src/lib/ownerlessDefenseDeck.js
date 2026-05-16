import { apiFetch } from "./api";

export async function fetchOwnerlessDefenseDecks() {
  const res = await apiFetch("/ownerless-defense-decks");
  return res.data;
}
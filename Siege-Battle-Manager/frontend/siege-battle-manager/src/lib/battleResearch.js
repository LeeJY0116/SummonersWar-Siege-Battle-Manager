import { apiFetch } from "./api";

export async function fetchBattleResearchPosts() {
  const res = await apiFetch("/research/posts");
  return res.data;
}

export async function fetchBattleResearchPostDetail(postId) {
  const res = await apiFetch(`/research/posts/${postId}`);
  return res.data;
}

export async function createBattleResearchPost(payload) {
  const res = await apiFetch("/research/posts", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return res.data;
}

export async function updateBattleResearchPost(postId, payload) {
  const res = await apiFetch(`/research/posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return res.data;
}

export async function deleteBattleResearchPost(postId) {
  const res = await apiFetch(`/research/posts/${postId}`, {
    method: "DELETE",
  });

  return res.data;
}

export async function createBattleResearchComment(postId, payload) {
  const res = await apiFetch(`/research/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return res.data;
}

export async function updateBattleResearchComment(commentId, payload) {
  const res = await apiFetch(`/research/comments/${commentId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return res.data;
}

export async function deleteBattleResearchComment(commentId) {
  const res = await apiFetch(`/research/comments/${commentId}`, {
    method: "DELETE",
  });

  return res.data;
}
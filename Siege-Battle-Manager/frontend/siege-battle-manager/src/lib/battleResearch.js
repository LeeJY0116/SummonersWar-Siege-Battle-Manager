import { apiFetch } from "./api";

export async function fetchBattleResearchPosts(page = 0, filters = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));

  if (filters.leaderEffectType) {
    params.set("leaderEffectType", filters.leaderEffectType);
  }

  if (filters.fourStarOnly) {
    params.set("fourStarOnly", "true");
  }

  (filters.monsterCodes ?? []).forEach((code) => {
    if (code) {
      params.append("monsterCodes", code);
    }
  });

  const res = await apiFetch(`/research/posts?${params.toString()}`);
  const data = res.data;

  if (Array.isArray(data)) {
    return {
      items: data,
      page: 0,
      size: data.length,
      totalElements: data.length,
      totalPages: data.length > 0 ? 1 : 0,
    };
  }

  return data;
}

export async function fetchBattleResearchPostDetail(postId, commentPage = 0) {
  const res = await apiFetch(`/research/posts/${postId}?commentPage=${commentPage}`);
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

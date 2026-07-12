import { apiFetch } from "./api.js";

export async function requestNicknameChange(requestedNickname) {
  const body = await apiFetch("/users/me/nickname-change-requests", {
    method: "POST",
    body: JSON.stringify({ requestedNickname }),
  });
  return body.data;
}

export async function fetchMyPendingNicknameChangeRequest() {
  const body = await apiFetch("/users/me/nickname-change-requests/pending");
  return body.data ?? null;
}

export async function cancelMyPendingNicknameChangeRequest() {
  await apiFetch("/users/me/nickname-change-requests/pending", {
    method: "DELETE",
  });
}

export async function fetchPendingNicknameChangeRequests() {
  const body = await apiFetch("/users/admin/nickname-change-requests");
  return body.data ?? [];
}

export async function approveNicknameChangeRequest(requestId) {
  await apiFetch(`/users/admin/nickname-change-requests/${requestId}/approve`, {
    method: "POST",
  });
}

export async function rejectNicknameChangeRequest(requestId) {
  await apiFetch(`/users/admin/nickname-change-requests/${requestId}/reject`, {
    method: "POST",
  });
}

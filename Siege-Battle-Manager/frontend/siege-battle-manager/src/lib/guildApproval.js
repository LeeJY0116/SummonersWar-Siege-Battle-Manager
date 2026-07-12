import { apiFetch } from "./api.js";

export async function fetchPendingMasterRequests() {
  const body = await apiFetch("/admin/guild-join-requests/masters");
  return body.data ?? [];
}

export async function approveMasterRequest(memberId) {
  await apiFetch(`/admin/guild-join-requests/${memberId}/approve`, {
    method: "POST",
  });
}

export async function rejectMasterRequest(memberId) {
  await apiFetch(`/admin/guild-join-requests/${memberId}/reject`, {
    method: "POST",
  });
}

export async function fetchPendingMemberRequests() {
  const body = await apiFetch("/guilds/me/join-requests");
  return body.data ?? [];
}

export async function approveMemberRequest(memberId) {
  await apiFetch(`/guilds/me/join-requests/${memberId}/approve`, {
    method: "POST",
  });
}

export async function rejectMemberRequest(memberId) {
  await apiFetch(`/guilds/me/join-requests/${memberId}/reject`, {
    method: "POST",
  });
}

import { apiFetch } from "./api.js";

export async function fetchPendingMasterRequests() {
  const body = await apiFetch("/admin/guild-join-requests/masters");
  return body.data ?? [];
}

export async function approveMasterRequest(request) {
  const requestId = typeof request === "object" ? request.memberId : request;
  const requestSource = typeof request === "object" ? request.requestSource : "SIGNUP";
  const url =
    requestSource === "ACCOUNT_MASTER"
      ? `/admin/guild-create-requests/${requestId}/approve`
      : `/admin/guild-join-requests/${requestId}/approve`;

  await apiFetch(url, {
    method: "POST",
  });
}

export async function rejectMasterRequest(request) {
  const requestId = typeof request === "object" ? request.memberId : request;
  const requestSource = typeof request === "object" ? request.requestSource : "SIGNUP";
  const url =
    requestSource === "ACCOUNT_MASTER"
      ? `/admin/guild-create-requests/${requestId}/reject`
      : `/admin/guild-join-requests/${requestId}/reject`;

  await apiFetch(url, {
    method: "POST",
  });
}

export async function fetchPendingMemberRequests() {
  const body = await apiFetch("/guilds/me/join-requests");
  return body.data ?? [];
}

export async function approveMemberRequest(memberId) {
  if (typeof memberId === "object" && memberId?.requestSource === "ACCOUNT") {
    await apiFetch(`/guilds/me/account-join-requests/${memberId.memberId}/approve`, {
      method: "POST",
    });
    return;
  }

  const requestId = typeof memberId === "object" ? memberId.memberId : memberId;
  await apiFetch(`/guilds/me/join-requests/${requestId}/approve`, {
    method: "POST",
  });
}

export async function rejectMemberRequest(memberId) {
  if (typeof memberId === "object" && memberId?.requestSource === "ACCOUNT") {
    await apiFetch(`/guilds/me/account-join-requests/${memberId.memberId}/reject`, {
      method: "POST",
    });
    return;
  }

  const requestId = typeof memberId === "object" ? memberId.memberId : memberId;
  await apiFetch(`/guilds/me/join-requests/${requestId}/reject`, {
    method: "POST",
  });
}

export async function requestExistingAccountJoin(guildName) {
  await apiFetch("/guilds/join-requests", {
    method: "POST",
    body: JSON.stringify({ guildName }),
  });
}

export async function requestExistingAccountGuildCreate(guildName, guildNameConfirm) {
  await apiFetch("/guilds/create-requests", {
    method: "POST",
    body: JSON.stringify({ guildName, guildNameConfirm }),
  });
}

export async function fetchMyPendingExistingJoinRequest() {
  const body = await apiFetch("/guilds/join-requests/me");
  return body.data ?? null;
}

export async function cancelMyPendingExistingJoinRequest() {
  await apiFetch("/guilds/join-requests/me", {
    method: "DELETE",
  });
}

import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAdminGuildMemberHistory,
  fetchAdminGuildMembers,
  fetchAdminGuilds,
  fetchAdminNicknameHistories,
  changeAdminGuildMemberRole,
  disbandAdminGuild,
} from "../../lib/adminGuilds.js";

const ROLE_LABELS = {
  MASTER: "길드장",
  SUB_MASTER: "부길드장",
  MEMBER: "길드원",
};

const ROLE_ORDER = {
  MASTER: 0,
  SUB_MASTER: 1,
  MEMBER: 2,
};

const STATUS_LABELS = {
  PENDING: "대기",
  APPROVED: "승인",
  REJECTED: "거절",
  LEFT: "탈퇴",
};

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function AdminGuildManagementPanel() {
  const [guilds, setGuilds] = useState([]);
  const [selectedGuildId, setSelectedGuildId] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingGuilds, setLoadingGuilds] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [memberHistory, setMemberHistory] = useState([]);
  const [nicknameHistories, setNicknameHistories] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);

  const selectedGuild = useMemo(
    () => guilds.find((guild) => String(guild.id) === String(selectedGuildId)) ?? null,
    [guilds, selectedGuildId],
  );
  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) => {
        const approvedCompare = Number(b.status === "APPROVED") - Number(a.status === "APPROVED");
        if (approvedCompare !== 0) return approvedCompare;

        const dummyCompare = Number(a.realUser === false) - Number(b.realUser === false);
        if (dummyCompare !== 0) return dummyCompare;

        const roleCompare = (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99);
        if (roleCompare !== 0) return roleCompare;

        return String(a.displayName ?? "").localeCompare(String(b.displayName ?? ""), "ko");
      }),
    [members],
  );

  function getRoleLabel(member) {
    if (member.realUser === false) return "더미";
    return ROLE_LABELS[member.role] ?? member.role;
  }

  async function loadGuilds() {
    try {
      setLoadingGuilds(true);
      setError("");
      const loadedGuilds = await fetchAdminGuilds();
      setGuilds(loadedGuilds);

      const nextGuildId = selectedGuildId ?? loadedGuilds[0]?.id ?? null;
      setSelectedGuildId(nextGuildId);

      if (nextGuildId) {
        await loadMembers(nextGuildId);
      } else {
        setMembers([]);
      }
    } catch (e) {
      setError(e.message || "길드 목록을 불러오지 못했습니다.");
    } finally {
      setLoadingGuilds(false);
    }
  }

  async function loadMembers(guildId = selectedGuildId) {
    if (!guildId) {
      setMembers([]);
      return;
    }

    try {
      setLoadingMembers(true);
      setError("");
      setHistoryTarget(null);
      setMemberHistory([]);
      setNicknameHistories([]);
      setMembers(await fetchAdminGuildMembers(guildId));
    } catch (e) {
      setError(e.message || "길드원 목록을 불러오지 못했습니다.");
    } finally {
      setLoadingMembers(false);
    }
  }

  useEffect(() => {
    loadGuilds();
  }, []);

  async function selectGuild(guildId) {
    setSelectedGuildId(guildId);
    await loadMembers(guildId);
  }

  async function toggleHistory(member) {
    if (historyTarget?.id === member.id) {
      setHistoryTarget(null);
      setMemberHistory([]);
      return;
    }

    try {
      setLoadingHistory(true);
      setError("");
      setHistoryTarget(member);
      const [guildHistory, nicknameHistory] = await Promise.all([
        fetchAdminGuildMemberHistory(member.id),
        fetchAdminNicknameHistories(member.id),
      ]);
      setMemberHistory(guildHistory);
      setNicknameHistories(nicknameHistory);
    } catch (e) {
      setError(e.message || "길드 이동 이력을 불러오지 못했습니다.");
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleDisbandGuild() {
    if (!editMode || !selectedGuild) return;

    const confirmed = window.confirm(
      `${selectedGuild.name} 길드를 해체할까요? 현재 가입된 길드원은 모두 탈퇴 상태로 변경됩니다.`,
    );
    if (!confirmed) return;

    try {
      setLoadingMembers(true);
      setError("");
      await disbandAdminGuild(selectedGuild.id);
      await loadGuilds();
    } catch (e) {
      setError(e.message || "길드를 해체하지 못했습니다.");
    } finally {
      setLoadingMembers(false);
    }
  }

  async function handleChangeRole(member, nextRole) {
    if (!editMode || !nextRole || nextRole === member.role) return;

    if (nextRole === "MASTER") {
      const confirmed = window.confirm(
        `${member.displayName} 님을 길드장으로 지정할까요? 기존 길드장은 부길드장으로 변경됩니다.`,
      );
      if (!confirmed) return;
    }

    try {
      setLoadingMembers(true);
      setError("");
      await changeAdminGuildMemberRole(member.id, nextRole);
      await loadGuilds();
      await loadMembers(selectedGuildId);
    } catch (e) {
      setError(e.message || "등급을 변경하지 못했습니다.");
    } finally {
      setLoadingMembers(false);
    }
  }

  function renderRoleCell(member) {
    if (!editMode || member.realUser === false || member.status !== "APPROVED") {
      return getRoleLabel(member);
    }

    return (
      <select
        value={member.role ?? ""}
        onChange={(e) => handleChangeRole(member, e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-slate-700"
      >
        <option value="MASTER">길드장</option>
        <option value="SUB_MASTER">부길드장</option>
        <option value="MEMBER">길드원</option>
      </select>
    );
  }

  return (
    <section className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-slate-900 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">길드 관리</h2>
          <p className="text-sm text-slate-500">현재 생성된 길드와 길드원을 확인합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditMode((prev) => !prev)}
            className={`rounded-md border px-3 py-2 text-sm font-semibold ${
              editMode
                ? "border-slate-800 bg-slate-800 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {editMode ? "편집 ON" : "편집 OFF"}
          </button>
          <button
            type="button"
            onClick={loadGuilds}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            새로고침
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
        {editMode
          ? "편집 모드입니다. 선택한 길드를 해체할 수 있습니다."
          : "읽기 전용 모드입니다. 길드와 길드원 정보를 확인할 수 있습니다."}
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-3 grid gap-3 lg:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600">
            길드 목록
          </div>
          <div className="max-h-72 overflow-auto">
            {loadingGuilds ? (
              <div className="px-3 py-4 text-sm text-slate-500">불러오는 중</div>
            ) : guilds.length === 0 ? (
              <div className="px-3 py-4 text-sm text-slate-500">생성된 길드가 없습니다.</div>
            ) : (
              guilds.map((guild) => (
                <button
                  key={guild.id}
                  type="button"
                  onClick={() => selectGuild(guild.id)}
                  className={`block w-full border-b border-slate-100 px-3 py-3 text-left text-sm last:border-b-0 ${
                    String(selectedGuildId) === String(guild.id)
                      ? "bg-slate-200"
                      : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold text-slate-950">{guild.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    마스터 {guild.masterNickname} · 인원 {guild.memberCount}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-3 py-2">
            <div>
              <div className="text-sm font-semibold text-slate-700">
                {selectedGuild ? selectedGuild.name : "길드원"}
              </div>
              {selectedGuild && (
                <div className="text-xs text-slate-500">마스터 {selectedGuild.masterNickname}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => loadMembers()}
              disabled={!selectedGuildId || loadingMembers}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              갱신
            </button>
            <button
              type="button"
              onClick={handleDisbandGuild}
              disabled={!editMode || !selectedGuildId || loadingMembers}
              className="ml-2 rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              길드 해체
            </button>
          </div>

          <div className="max-h-72 overflow-auto">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="sticky top-0 z-20 bg-white text-xs text-slate-500 shadow-sm">
                <tr>
                  <th className="px-3 py-2">닉네임 / ID</th>
                  <th className="px-3 py-2">등급</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2">현재 길드</th>
                  <th className="px-3 py-2">마지막 접속일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingMembers ? (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan={5}>
                      불러오는 중
                    </td>
                  </tr>
                ) : members.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan={5}>
                      길드원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  sortedMembers.map((member) => (
                    <tr key={member.id}>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => toggleHistory(member)}
                          className="font-medium text-slate-950 underline-offset-2 hover:underline"
                        >
                          {member.displayName}
                        </button>
                        <div className="text-xs text-slate-500">{member.loginId ?? "-"}</div>
                      </td>
                      <td className="px-3 py-2">{renderRoleCell(member)}</td>
                      <td className="px-3 py-2">{STATUS_LABELS[member.status] ?? member.status}</td>
                      <td className="px-3 py-2">{member.currentGuildName ?? "-"}</td>
                      <td className="px-3 py-2">{formatDateTime(member.lastLoginAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {historyTarget && (
            <div className="border-t border-gray-200 bg-gray-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-800">
                    {historyTarget.displayName} 길드 이동 이력
                  </div>
                  <div className="text-xs text-gray-500">{historyTarget.loginId ?? "-"}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHistoryTarget(null);
                    setMemberHistory([]);
                  }}
                  className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-white"
                >
                  닫기
                </button>
              </div>

              <div className="mb-3 overflow-hidden rounded-md border border-gray-200 bg-white">
                <div className="border-b border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                  닉네임 변경 이력
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-white text-gray-500">
                    <tr>
                      <th className="px-3 py-2">이전 닉네임</th>
                      <th className="px-3 py-2">변경 닉네임</th>
                      <th className="px-3 py-2">유형</th>
                      <th className="px-3 py-2">처리자</th>
                      <th className="px-3 py-2">일시</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingHistory ? (
                      <tr>
                        <td className="px-3 py-3 text-gray-500" colSpan={5}>
                          불러오는 중
                        </td>
                      </tr>
                    ) : nicknameHistories.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-gray-500" colSpan={5}>
                          닉네임 이력이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      nicknameHistories.map((history) => (
                        <tr key={history.id}>
                          <td className="px-3 py-2">{history.previousNickname ?? "-"}</td>
                          <td className="px-3 py-2">{history.newNickname}</td>
                          <td className="px-3 py-2">{history.changeType}</td>
                          <td className="px-3 py-2">{history.changedByLoginId ?? "-"}</td>
                          <td className="px-3 py-2">
                            {history.createdAt ? new Date(history.createdAt).toLocaleString() : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
                <div className="border-b border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                  길드 이동 이력
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-3 py-2">길드</th>
                      <th className="px-3 py-2">닉네임</th>
                      <th className="px-3 py-2">등급</th>
                      <th className="px-3 py-2">상태</th>
                      <th className="px-3 py-2">생성일</th>
                      <th className="px-3 py-2">수정일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingHistory ? (
                      <tr>
                        <td className="px-3 py-3 text-gray-500" colSpan={6}>
                          불러오는 중
                        </td>
                      </tr>
                    ) : memberHistory.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-gray-500" colSpan={6}>
                          이력이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      memberHistory.map((history) => (
                        <tr key={history.memberId}>
                          <td className="px-3 py-2">{history.guildName}</td>
                          <td className="px-3 py-2">{history.displayName}</td>
                          <td className="px-3 py-2">{ROLE_LABELS[history.role] ?? history.role}</td>
                          <td className="px-3 py-2">{STATUS_LABELS[history.status] ?? history.status}</td>
                          <td className="px-3 py-2">
                            {history.createdAt ? new Date(history.createdAt).toLocaleString() : "-"}
                          </td>
                          <td className="px-3 py-2">
                            {history.updatedAt ? new Date(history.updatedAt).toLocaleString() : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

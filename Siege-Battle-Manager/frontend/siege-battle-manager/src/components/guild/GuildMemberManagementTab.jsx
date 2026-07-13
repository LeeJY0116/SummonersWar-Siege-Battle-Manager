import React, { useEffect, useState } from "react";
import {
  fetchGuildMemberBans,
  kickGuildMember,
  liftGuildMemberBan,
  transferGuildMaster,
  updateGuildMemberRole,
} from "../../lib/guild.js";
import GuildMemberApprovalPanel from "./GuildMemberApprovalPanel.jsx";

const ROLE_LABELS = {
  MASTER: "길드장",
  SUB_MASTER: "부길드장",
  MEMBER: "길드원",
};

const ROLE_OPTIONS = [
  { value: "MEMBER", label: "길드원" },
  { value: "SUB_MASTER", label: "부길드장" },
];

export default function GuildMemberManagementTab({ members, currentGuildRole, onRefreshMembers }) {
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState("");
  const [bans, setBans] = useState([]);
  const [banError, setBanError] = useState("");
  const realMembers = (members ?? []).filter((member) => member.realUser);
  const canManageMemberRoles = currentGuildRole === "MASTER";

  useEffect(() => {
    if (canManageMemberRoles) {
      void loadBans();
    }
  }, [canManageMemberRoles]);

  async function loadBans() {
    try {
      setBanError("");
      const data = await fetchGuildMemberBans();
      setBans(data ?? []);
    } catch (e) {
      setBans([]);
      setBanError(e.message || "재가입 차단 목록을 불러오지 못했습니다.");
    }
  }

  async function handleRoleChange(member, role) {
    if (member.role === role) return;

    try {
      setWorkingId(member.id);
      setError("");
      await updateGuildMemberRole(member.id, role);
      await onRefreshMembers?.();
    } catch (e) {
      setError(e.message || "등급을 변경하지 못했습니다.");
    } finally {
      setWorkingId(null);
    }
  }

  async function handleKick(member) {
    const ok = window.confirm(`${member.displayName} 길드원을 추방할까요?`);
    if (!ok) return;

    try {
      setWorkingId(member.id);
      setError("");
      await kickGuildMember(member.id);
      await onRefreshMembers?.();
      if (canManageMemberRoles) {
        await loadBans();
      }
    } catch (e) {
      setError(e.message || "길드원을 추방하지 못했습니다.");
    } finally {
      setWorkingId(null);
    }
  }

  async function handleTransferMaster(member) {
    const ok = window.confirm(
      `${member.displayName} 길드원에게 길드장을 양도할까요?\n양도 후 현재 길드장은 부길드장이 됩니다.`
    );
    if (!ok) return;

    try {
      setWorkingId(member.id);
      setError("");
      await transferGuildMaster(member.id);
      await onRefreshMembers?.();
    } catch (e) {
      setError(e.message || "길드장을 양도하지 못했습니다.");
    } finally {
      setWorkingId(null);
    }
  }

  async function handleLiftBan(ban) {
    try {
      setWorkingId(`ban-${ban.id}`);
      setBanError("");
      await liftGuildMemberBan(ban.id);
      await loadBans();
    } catch (e) {
      setBanError(e.message || "재가입 차단을 해제하지 못했습니다.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <GuildMemberApprovalPanel onApproved={onRefreshMembers} />

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-4">
          <h3 className="text-lg font-bold text-gray-950">길드 멤버</h3>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
            활성 {realMembers.length}명
          </span>
        </div>

        {error && (
          <div className="mx-4 mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3">닉네임 / ID</th>
                <th className="px-4 py-3">등급</th>
                <th className="px-4 py-3">상태</th>
                {canManageMemberRoles && (
                  <>
                    <th className="px-4 py-3">등급 변경</th>
                    <th className="px-4 py-3">길드장 양도</th>
                    <th className="px-4 py-3">추방</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {realMembers.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={canManageMemberRoles ? 6 : 3}>
                    활성 길드원이 없습니다.
                  </td>
                </tr>
              ) : (
                realMembers.map((member) => {
                  const isMaster = member.role === "MASTER";
                  const disabled = isMaster || !canManageMemberRoles || workingId === member.id;

                  return (
                    <tr key={member.id}>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-950">{member.displayName}</div>
                        <div className="text-xs text-gray-500">
                          {member.loginId ?? `user-${member.userId}`}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                          {ROLE_LABELS[member.role] ?? member.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-600">{member.status ?? "APPROVED"}</td>
                      {canManageMemberRoles && (
                        <>
                          <td className="px-4 py-4">
                            {isMaster ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              <select
                                value={member.role}
                                disabled={disabled}
                                onChange={(e) => handleRoleChange(member, e.target.value)}
                                className="rounded-md border border-gray-300 px-2 py-1 text-sm disabled:opacity-40"
                              >
                                {ROLE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {isMaster ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => handleTransferMaster(member)}
                                className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-40"
                              >
                                양도
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {isMaster ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => handleKick(member)}
                                className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                              >
                                추방
                              </button>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {canManageMemberRoles && (
      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-gray-950">재가입 불가 목록</h3>
            <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">
              {bans.length}명
            </span>
          </div>
          <button
            type="button"
            onClick={loadBans}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            새로고침
          </button>
        </div>

        {banError && (
          <div className="mx-4 mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {banError}
          </div>
        )}

        <div className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3">닉네임 / ID</th>
                <th className="px-4 py-3">처리자</th>
                <th className="px-4 py-3">차단일</th>
                <th className="px-4 py-3">해제</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bans.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={4}>
                    재가입이 차단된 길드원이 없습니다.
                  </td>
                </tr>
              ) : (
                bans.map((ban) => (
                  <tr key={ban.id}>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-950">{ban.nickname}</div>
                      <div className="text-xs text-gray-500">{ban.loginId}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-gray-700">{ban.bannedByNickname ?? "-"}</div>
                      <div className="text-xs text-gray-500">{ban.bannedByLoginId ?? ""}</div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {ban.createdAt ? new Date(ban.createdAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        disabled={workingId === `ban-${ban.id}`}
                        onClick={() => handleLiftBan(ban)}
                        className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-40"
                      >
                        해제
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      )}
    </div>
  );
}

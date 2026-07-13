import React, { useEffect, useState } from "react";
import {
  createVirtualGuildMember,
  deleteVirtualGuildMember,
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

const ROLE_RANK = {
  MASTER: 3,
  SUB_MASTER: 2,
  MEMBER: 1,
};

function formatLastLoginAt(value) {
  if (!value) return "접속 기록 없음";
  return new Date(value).toLocaleString();
}

function compareMembers(a, b) {
  const roleDiff = (ROLE_RANK[b.role] ?? 0) - (ROLE_RANK[a.role] ?? 0);
  if (roleDiff !== 0) return roleDiff;

  const aLoginAt = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
  const bLoginAt = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
  return bLoginAt - aLoginAt;
}

function compareVirtualMembers(a, b) {
  return String(a.displayName ?? "").localeCompare(String(b.displayName ?? ""));
}

function SectionCard({ children }) {
  return (
    <section className="rounded-xl border border-[#745320] bg-[#211813] text-[#f6deb0] shadow-[0_10px_24px_rgba(10,7,4,0.18)]">
      {children}
    </section>
  );
}

function TableShell({ children }) {
  return <div className="overflow-hidden rounded-lg border border-[#745320]">{children}</div>;
}

export default function GuildMemberManagementTab({ guild, members, currentGuildRole, onRefreshMembers }) {
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState("");
  const [bans, setBans] = useState([]);
  const [banError, setBanError] = useState("");
  const [virtualMemberName, setVirtualMemberName] = useState("");
  const realMembers = (members ?? []).filter((member) => member.realUser).sort(compareMembers);
  const virtualMembers = (members ?? [])
    .filter((member) => !member.realUser)
    .sort(compareVirtualMembers);
  const totalMembers = realMembers.length + virtualMembers.length;
  const canManageMemberRoles = currentGuildRole === "MASTER";
  const canManageVirtualMembers =
    currentGuildRole === "MASTER" || currentGuildRole === "SUB_MASTER";

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
      setBanError(e.message || "재가입 불가 목록을 불러오지 못했습니다.");
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
      setBanError(e.message || "재가입 제한을 해제하지 못했습니다.");
    } finally {
      setWorkingId(null);
    }
  }

  async function handleCreateVirtualMember(event) {
    event.preventDefault();

    const displayName = virtualMemberName.trim();
    if (!displayName) {
      setError("더미 계정 이름을 입력해주세요.");
      return;
    }
    if (!guild?.id) {
      setError("길드 정보를 찾을 수 없습니다.");
      return;
    }

    try {
      setWorkingId("virtual-create");
      setError("");
      await createVirtualGuildMember(guild.id, displayName);
      setVirtualMemberName("");
      await onRefreshMembers?.();
    } catch (e) {
      setError(e.message || "더미 계정을 생성하지 못했습니다.");
    } finally {
      setWorkingId(null);
    }
  }

  async function handleDeleteVirtualMember(member) {
    const ok = window.confirm(`${member.displayName} 더미 계정을 삭제할까요?`);
    if (!ok) return;

    try {
      setWorkingId(`virtual-${member.id}`);
      setError("");
      await deleteVirtualGuildMember(member.id);
      await onRefreshMembers?.();
    } catch (e) {
      setError(e.message || "더미 계정을 삭제하지 못했습니다.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <GuildMemberApprovalPanel onApproved={onRefreshMembers} />

      <SectionCard>
        <div className="flex items-center gap-3 border-b border-[#51341e] px-4 py-4">
          <h3 className="text-lg font-bold text-[#fff0c8]">길드 멤버</h3>
          <span className="rounded-full bg-[#f3d37b] px-3 py-1 text-sm font-semibold text-[#2f1f13]">
            {totalMembers}/35
          </span>
          <span className="text-xs font-semibold text-[#d7be80]">
            실제 {realMembers.length}명 · 더미 {virtualMembers.length}명
          </span>
        </div>

        {error && (
          <div className="mx-4 mt-4 rounded-md border border-red-300/50 bg-[#3c1f1a] p-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#3b2a1d] text-[#d7be80]">
              <tr>
                <th className="px-4 py-3">닉네임 / ID</th>
                <th className="px-4 py-3">등급</th>
                <th className="px-4 py-3">최근 접속일</th>
                {canManageMemberRoles && (
                  <>
                    <th className="px-4 py-3">등급 변경</th>
                    <th className="px-4 py-3">길드장 양도</th>
                    <th className="px-4 py-3">추방</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#51341e]">
              {realMembers.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-[#d7be80]" colSpan={canManageMemberRoles ? 6 : 3}>
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
                        <div className="font-semibold text-[#fff0c8]">{member.displayName}</div>
                        <div className="text-xs text-[#c8a96a]">
                          {member.loginId ?? `user-${member.userId}`}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-[#3c1f1a] px-3 py-1 text-xs font-semibold text-[#ffcf9d]">
                          {ROLE_LABELS[member.role] ?? member.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[#d7be80]">
                        {formatLastLoginAt(member.lastLoginAt)}
                      </td>
                      {canManageMemberRoles && (
                        <>
                          <td className="px-4 py-4">
                            {isMaster ? (
                              <span className="text-[#9f865d]">-</span>
                            ) : (
                              <select
                                value={member.role}
                                disabled={disabled}
                                onChange={(e) => handleRoleChange(member, e.target.value)}
                                className="rounded-md border border-[#8f6732] bg-[#1f1712] px-2 py-1 text-sm text-[#fff0c8] disabled:opacity-40"
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
                              <span className="text-[#9f865d]">-</span>
                            ) : (
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => handleTransferMaster(member)}
                                className="rounded-md border border-amber-300/60 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-[#3a2a16] disabled:opacity-40"
                              >
                                양도
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {isMaster ? (
                              <span className="text-[#9f865d]">-</span>
                            ) : (
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() => handleKick(member)}
                                className="rounded-md border border-red-300/50 px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-[#3c1f1a] disabled:opacity-40"
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
      </SectionCard>

      {canManageVirtualMembers && (
        <SectionCard>
          <div className="border-b border-[#51341e] px-4 py-4">
            <h3 className="text-lg font-bold text-[#fff0c8]">더미 계정</h3>
            <p className="mt-1 text-sm text-[#d7be80]">
              로그인 계정 없이 인벤토리와 방덱만 관리할 길드원을 생성합니다. 더미 계정도 길드 인원 35명 제한에 포함됩니다.
            </p>
          </div>

          <div className="space-y-4 p-4">
            <form onSubmit={handleCreateVirtualMember} className="flex flex-col gap-2 md:flex-row">
              <input
                value={virtualMemberName}
                onChange={(event) => setVirtualMemberName(event.target.value)}
                disabled={workingId === "virtual-create" || totalMembers >= 35}
                placeholder="더미 계정 이름"
                className="min-w-0 flex-1 rounded-md border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] placeholder:text-[#bda981] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={workingId === "virtual-create" || totalMembers >= 35}
                className="rounded-md bg-[#f3d37b] px-4 py-2 text-sm font-semibold text-[#2f1f13] disabled:opacity-40"
              >
                {workingId === "virtual-create" ? "생성 중..." : "더미 계정 생성"}
              </button>
            </form>

            {totalMembers >= 35 && (
              <div className="rounded-md border border-amber-300/60 bg-[#3a2a16] p-3 text-sm text-amber-100">
                길드 인원 제한 35명에 도달해 더미 계정을 추가할 수 없습니다.
              </div>
            )}

            <TableShell>
              <table className="w-full text-left text-sm">
                <thead className="bg-[#3b2a1d] text-[#d7be80]">
                  <tr>
                    <th className="px-4 py-3">이름</th>
                    <th className="px-4 py-3">유형</th>
                    <th className="px-4 py-3">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#51341e]">
                  {virtualMembers.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-[#d7be80]" colSpan={3}>
                        생성된 더미 계정이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    virtualMembers.map((member) => (
                      <tr key={member.id}>
                        <td className="px-4 py-4 font-semibold text-[#fff0c8]">
                          {member.displayName}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-[#3b2a1d] px-3 py-1 text-xs font-semibold text-[#d7be80]">
                            더미
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            disabled={workingId === `virtual-${member.id}`}
                            onClick={() => handleDeleteVirtualMember(member)}
                            className="rounded-md border border-red-300/50 px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-[#3c1f1a] disabled:opacity-40"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </TableShell>
          </div>
        </SectionCard>
      )}

      {canManageMemberRoles && (
        <SectionCard>
          <div className="flex items-center justify-between gap-3 border-b border-[#51341e] px-4 py-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-[#fff0c8]">재가입 불가 목록</h3>
              <span className="rounded-full bg-[#3c1f1a] px-3 py-1 text-sm font-semibold text-red-100">
                {bans.length}명
              </span>
            </div>
            <button
              type="button"
              onClick={loadBans}
              className="rounded-md border border-[#9b743a] px-3 py-1.5 text-xs font-semibold text-[#f8e0ad] hover:border-[#f6c44f]"
            >
              새로고침
            </button>
          </div>

          {banError && (
            <div className="mx-4 mt-4 rounded-md border border-red-300/50 bg-[#3c1f1a] p-3 text-sm text-red-100">
              {banError}
            </div>
          )}

          <div className="overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#3b2a1d] text-[#d7be80]">
                <tr>
                  <th className="px-4 py-3">닉네임 / ID</th>
                  <th className="px-4 py-3">처리자</th>
                  <th className="px-4 py-3">차단일</th>
                  <th className="px-4 py-3">해제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#51341e]">
                {bans.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-[#d7be80]" colSpan={4}>
                      재가입이 차단된 길드원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  bans.map((ban) => (
                    <tr key={ban.id}>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-[#fff0c8]">{ban.nickname}</div>
                        <div className="text-xs text-[#c8a96a]">{ban.loginId}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-[#f6deb0]">{ban.bannedByNickname ?? "-"}</div>
                        <div className="text-xs text-[#c8a96a]">{ban.bannedByLoginId ?? ""}</div>
                      </td>
                      <td className="px-4 py-4 text-[#d7be80]">
                        {ban.createdAt ? new Date(ban.createdAt).toLocaleString() : "-"}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          disabled={workingId === `ban-${ban.id}`}
                          onClick={() => handleLiftBan(ban)}
                          className="rounded-md border border-blue-300/50 px-3 py-1.5 text-xs font-semibold text-blue-100 hover:bg-[#1f2f3c] disabled:opacity-40"
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
        </SectionCard>
      )}
    </div>
  );
}

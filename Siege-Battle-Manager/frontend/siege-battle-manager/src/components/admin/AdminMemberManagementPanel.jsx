import React, { useEffect, useMemo, useState } from "react";
import {
  fetchAdminAllMembers,
  fetchAdminGuildMemberHistory,
  fetchAdminNicknameHistories,
  forceLeaveAdminMember,
} from "../../lib/adminGuilds.js";

const ROLE_LABELS = {
  MASTER: "길드장",
  SUB_MASTER: "부길드장",
  MEMBER: "길드원",
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

function formatIp(value) {
  if (!value) return "-";
  if (value === "0:0:0:0:0:0:0:1" || value === "::1") return "127.0.0.1";
  if (value.startsWith("::ffff:")) return value.slice("::ffff:".length);
  return value;
}

function getRoleLabel(role) {
  if (!role) return "-";
  return ROLE_LABELS[role] ?? role;
}

export default function AdminMemberManagementPanel() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [historyType, setHistoryType] = useState(null);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [guildHistory, setGuildHistory] = useState([]);
  const [nicknameHistory, setNicknameHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [query, setQuery] = useState("");

  const visibleMembers = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return [...members]
      .filter((member) => {
        if (!keyword) return true;
        return [
          member.loginId,
          member.displayName,
          member.currentGuildName,
          member.email,
          formatIp(member.lastLoginIp),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      })
      .sort((a, b) => {
        const activeCompare = Boolean(b.currentGuildName) - Boolean(a.currentGuildName);
        if (activeCompare !== 0) return activeCompare;
        return String(a.displayName ?? "").localeCompare(String(b.displayName ?? ""), "ko");
      });
  }, [members, query]);

  async function loadMembers() {
    try {
      setLoading(true);
      setError("");
      setMembers(await fetchAdminAllMembers());
    } catch (e) {
      setError(e.message || "회원 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function openNicknameHistory(member) {
    if ((member.nicknameHistoryCount ?? 0) <= 0) return;
    await openHistory(member, "nickname");
  }

  async function openGuildHistory(member) {
    if ((member.guildHistoryCount ?? 0) <= 1) return;
    await openHistory(member, "guild");
  }

  async function openHistory(member, type) {
    if (historyTarget?.id === member.id && historyType === type) {
      closeHistory();
      return;
    }

    try {
      setLoadingHistory(true);
      setError("");
      setHistoryTarget(member);
      setHistoryType(type);

      if (type === "nickname") {
        setNicknameHistory(await fetchAdminNicknameHistories(member.id));
        setGuildHistory([]);
      } else {
        setGuildHistory(await fetchAdminGuildMemberHistory(member.id));
        setNicknameHistory([]);
      }
    } catch (e) {
      setError(e.message || "이력을 불러오지 못했습니다.");
    } finally {
      setLoadingHistory(false);
    }
  }

  function closeHistory() {
    setHistoryTarget(null);
    setHistoryType(null);
    setGuildHistory([]);
    setNicknameHistory([]);
  }

  async function handleForceLeave(member) {
    if (!editMode || !member.userId) return;

    const confirmed = window.confirm(
      `${member.displayName} 계정을 삭제 처리할까요?\n같은 ID와 닉네임으로 다시 가입할 수 있게 됩니다.`,
    );
    if (!confirmed) return;

    try {
      setWorkingId(member.id);
      setError("");
      await forceLeaveAdminMember(member.id);
      closeHistory();
      await loadMembers();
    } catch (e) {
      setError(e.message || "회원 계정 삭제를 처리하지 못했습니다.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <section className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-slate-900 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">회원 관리</h2>
          <p className="text-sm text-slate-500">
            가입한 실제 회원의 접속 정보와 이력을 확인하고 정리합니다.
          </p>
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
            onClick={loadMembers}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            새로고침
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
        {editMode
          ? "편집 모드입니다. 회원 계정을 삭제 처리할 수 있습니다."
          : "읽기 전용 모드입니다. 닉네임과 길드 이력은 변경 이력이 있을 때만 열 수 있습니다."}
      </div>

      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="ID, 닉네임, 길드, 이메일, IP 검색"
        className="mt-3 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
      />

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="max-h-80 overflow-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="sticky top-0 z-20 bg-slate-100 text-xs text-slate-500 shadow-sm">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">닉네임</th>
                <th className="px-3 py-2">현재 길드</th>
                <th className="px-3 py-2">등급</th>
                <th className="px-3 py-2">이메일</th>
                <th className="px-3 py-2">마지막 접속일</th>
                <th className="px-3 py-2">마지막 접속 IP</th>
                <th className="px-3 py-2">처리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={8}>
                    불러오는 중
                  </td>
                </tr>
              ) : visibleMembers.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={8}>
                    회원이 없습니다.
                  </td>
                </tr>
              ) : (
                visibleMembers.map((member) => {
                  const canOpenNickname = (member.nicknameHistoryCount ?? 0) > 0;
                  const canOpenGuild = (member.guildHistoryCount ?? 0) > 1;
                  const canForceLeave =
                    editMode &&
                    (!member.currentGuildName || member.role !== "MASTER") &&
                    member.userId;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2">{member.loginId ?? "-"}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          disabled={!canOpenNickname}
                          onClick={() => openNicknameHistory(member)}
                          className="font-medium text-slate-950 underline-offset-2 enabled:hover:underline disabled:cursor-default disabled:text-slate-700"
                        >
                          {member.displayName}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          disabled={!canOpenGuild}
                          onClick={() => openGuildHistory(member)}
                          className="font-medium text-slate-800 underline-offset-2 enabled:hover:underline disabled:cursor-default disabled:text-slate-700"
                        >
                          {member.currentGuildName ?? "-"}
                        </button>
                      </td>
                      <td className="px-3 py-2">{getRoleLabel(member.role)}</td>
                      <td className="px-3 py-2">{member.email ?? "-"}</td>
                      <td className="px-3 py-2">{formatDateTime(member.lastLoginAt)}</td>
                      <td className="px-3 py-2">{formatIp(member.lastLoginIp)}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          disabled={!canForceLeave || workingId === member.id}
                          onClick={() => handleForceLeave(member)}
                          className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          계정 삭제
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {historyTarget && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {historyTarget.displayName}{" "}
                {historyType === "nickname" ? "닉네임 변경 이력" : "길드 이동 이력"}
              </div>
              <div className="text-xs text-slate-500">{historyTarget.loginId ?? "-"}</div>
            </div>
            <button
              type="button"
              onClick={closeHistory}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
            >
              닫기
            </button>
          </div>

          {historyType === "nickname" ? (
            <HistoryTable
              loading={loadingHistory}
              emptyText="닉네임 변경 이력이 없습니다."
              headers={["이전 닉네임", "변경 닉네임", "유형", "처리자", "일시"]}
              rows={nicknameHistory.map((history) => [
                history.previousNickname ?? "-",
                history.newNickname,
                history.changeType,
                history.changedByLoginId ?? "-",
                formatDateTime(history.createdAt),
              ])}
            />
          ) : (
            <HistoryTable
              loading={loadingHistory}
              emptyText="길드 이동 이력이 없습니다."
              headers={["길드", "닉네임", "등급", "상태", "생성일", "수정일"]}
              rows={guildHistory.map((history) => [
                history.guildName,
                history.displayName,
                getRoleLabel(history.role),
                STATUS_LABELS[history.status] ?? history.status,
                formatDateTime(history.createdAt),
                formatDateTime(history.updatedAt),
              ])}
            />
          )}
        </div>
      )}
    </section>
  );
}

function HistoryTable({ headers, rows, loading, emptyText }) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-100 text-slate-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td className="px-3 py-3 text-slate-500" colSpan={headers.length}>
                불러오는 중
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td className="px-3 py-3 text-slate-500" colSpan={headers.length}>
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} className="px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

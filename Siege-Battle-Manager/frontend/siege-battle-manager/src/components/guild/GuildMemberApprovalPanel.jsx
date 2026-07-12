import React, { useEffect, useState } from "react";
import {
  approveMemberRequest,
  fetchPendingMemberRequests,
  rejectMemberRequest,
} from "../../lib/guildApproval.js";

export default function GuildMemberApprovalPanel({ onApproved }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState("");

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");
      setRequests(await fetchPendingMemberRequests());
    } catch (e) {
      setError(e.message || "길드원 가입 신청을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleAction(memberId, action) {
    try {
      setWorkingId(memberId);
      setError("");
      await action(memberId);
      await loadRequests();
      await onApproved?.();
    } catch (e) {
      setError(e.message || "가입 신청을 처리하지 못했습니다.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <section className="mb-4 rounded-xl border border-[#6f4a1f] bg-[#2a160d] p-4 text-[#f5e6bd] shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-bold">길드원 가입 승인</h3>
          <p className="text-sm text-[#d6b878]">길드장과 부길드장이 처리할 수 있는 가입 신청입니다.</p>
        </div>
        <button
          type="button"
          onClick={loadRequests}
          className="rounded-lg border border-[#d5a84a] px-3 py-2 text-sm font-semibold text-[#ffe08a] hover:bg-[#3c2415]"
        >
          새로고침
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-3 overflow-hidden rounded-lg border border-[#6f4a1f]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#3b2415] text-xs text-[#d6b878]">
            <tr>
              <th className="px-3 py-2">닉네임</th>
              <th className="px-3 py-2">아이디</th>
              <th className="px-3 py-2">이메일</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">처리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#51341e]">
            {loading ? (
              <tr>
                <td className="px-3 py-4 text-[#d6b878]" colSpan={5}>
                  불러오는 중
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-[#d6b878]" colSpan={5}>
                  대기 중인 신청이 없습니다.
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.memberId}>
                  <td className="px-3 py-2 font-semibold">{request.nickname || request.displayName}</td>
                  <td className="px-3 py-2">{request.loginId}</td>
                  <td className="px-3 py-2">{request.email}</td>
                  <td className="px-3 py-2">{request.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={workingId === request.memberId}
                        onClick={() => handleAction(request.memberId, approveMemberRequest)}
                        className="rounded-md bg-[#ffe08a] px-3 py-1.5 text-xs font-bold text-[#2a160d] disabled:opacity-40"
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        disabled={workingId === request.memberId}
                        onClick={() => handleAction(request.memberId, rejectMemberRequest)}
                        className="rounded-md border border-[#d5a84a] px-3 py-1.5 text-xs font-semibold text-[#ffe08a] hover:bg-[#3c2415] disabled:opacity-40"
                      >
                        거절
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

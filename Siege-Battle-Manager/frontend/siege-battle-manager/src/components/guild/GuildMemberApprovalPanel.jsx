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
      setError(e.message || "길드원 가입 요청을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleAction(request, action) {
    try {
      setWorkingId(`${request.requestSource ?? "SIGNUP"}-${request.memberId}`);
      setError("");
      await action(request);
      await loadRequests();
      await onApproved?.();
    } catch (e) {
      setError(e.message || "가입 요청을 처리하지 못했습니다.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <section className="mb-4 rounded-xl border border-[#745320] bg-[#211813] p-4 text-[#f6deb0] shadow-[0_10px_24px_rgba(10,7,4,0.18)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-bold text-[#fff0c8]">길드원 가입 승인</h3>
          <p className="text-sm text-[#d7be80]">길드장과 부길드장이 처리할 수 있는 가입 요청입니다.</p>
        </div>
        <button
          type="button"
          onClick={loadRequests}
          className="rounded-lg border border-[#9b743a] px-3 py-2 text-sm font-semibold text-[#ffe08a] hover:border-[#f6c44f] hover:bg-[#3c2415]"
        >
          새로고침
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-300/50 bg-[#3c1f1a] p-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="mt-3 overflow-hidden rounded-lg border border-[#745320]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#3b2a1d] text-xs text-[#d7be80]">
            <tr>
              <th className="px-3 py-2">닉네임</th>
              <th className="px-3 py-2">아이디</th>
              <th className="px-3 py-2">이메일</th>
              <th className="px-3 py-2">유형</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">처리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#51341e]">
            {loading ? (
              <tr>
                <td className="px-3 py-4 text-[#d7be80]" colSpan={6}>
                  불러오는 중
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-[#d7be80]" colSpan={6}>
                  대기 중인 요청이 없습니다.
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={`${request.requestSource ?? "SIGNUP"}-${request.memberId}`}>
                  <td className="px-3 py-2 font-semibold text-[#fff0c8]">{request.nickname || request.displayName}</td>
                  <td className="px-3 py-2">{request.loginId}</td>
                  <td className="px-3 py-2">{request.email}</td>
                  <td className="px-3 py-2">
                    {request.requestSource === "ACCOUNT" ? "기존 계정" : "신규 가입"}
                  </td>
                  <td className="px-3 py-2">{request.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={workingId === `${request.requestSource ?? "SIGNUP"}-${request.memberId}`}
                        onClick={() => handleAction(request, approveMemberRequest)}
                        className="rounded-md bg-[#f3d37b] px-3 py-1.5 text-xs font-bold text-[#2a160d] disabled:opacity-40"
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        disabled={workingId === `${request.requestSource ?? "SIGNUP"}-${request.memberId}`}
                        onClick={() => handleAction(request, rejectMemberRequest)}
                        className="rounded-md border border-[#9b743a] px-3 py-1.5 text-xs font-semibold text-[#ffe08a] hover:border-[#f6c44f] hover:bg-[#3c2415] disabled:opacity-40"
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

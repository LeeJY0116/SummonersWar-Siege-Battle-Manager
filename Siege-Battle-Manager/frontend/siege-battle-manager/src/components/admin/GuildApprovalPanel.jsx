import React, { useEffect, useState } from "react";
import {
  approveMasterRequest,
  fetchPendingMasterRequests,
  rejectMasterRequest,
} from "../../lib/guildApproval.js";

export default function GuildApprovalPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState("");

  async function loadRequests() {
    try {
      setLoading(true);
      setError("");
      setRequests(await fetchPendingMasterRequests());
    } catch (e) {
      setError(e.message || "가입 신청 목록을 불러오지 못했습니다.");
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
    } catch (e) {
      setError(e.message || "가입 신청을 처리하지 못했습니다.");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">가입 승인</h2>
          <p className="text-sm text-gray-500">관리자 승인이 필요한 길드장 가입 신청입니다.</p>
        </div>
        <button
          type="button"
          onClick={loadRequests}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          새로고침
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-3 py-2">길드</th>
              <th className="px-3 py-2">닉네임</th>
              <th className="px-3 py-2">아이디</th>
              <th className="px-3 py-2">이메일</th>
              <th className="px-3 py-2">상태</th>
              <th className="px-3 py-2">처리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td className="px-3 py-4 text-gray-500" colSpan={6}>
                  불러오는 중
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-gray-500" colSpan={6}>
                  대기 중인 신청이 없습니다.
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.memberId}>
                  <td className="px-3 py-2 font-medium">{request.guildName}</td>
                  <td className="px-3 py-2">{request.nickname || request.displayName}</td>
                  <td className="px-3 py-2">{request.loginId}</td>
                  <td className="px-3 py-2">{request.email}</td>
                  <td className="px-3 py-2">{request.status}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={workingId === request.memberId}
                        onClick={() => handleAction(request.memberId, approveMasterRequest)}
                        className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                      >
                        승인
                      </button>
                      <button
                        type="button"
                        disabled={workingId === request.memberId}
                        onClick={() => handleAction(request.memberId, rejectMasterRequest)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40"
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

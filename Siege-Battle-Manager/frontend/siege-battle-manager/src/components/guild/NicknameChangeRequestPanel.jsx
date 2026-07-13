import React, { useEffect, useState } from "react";
import {
  cancelMyPendingNicknameChangeRequest,
  fetchMyPendingNicknameChangeRequest,
  requestNicknameChange,
} from "../../lib/userNickname.js";

export default function NicknameChangeRequestPanel({ currentNickname = "" }) {
  const [requestedNickname, setRequestedNickname] = useState("");
  const [pendingRequest, setPendingRequest] = useState(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadPendingRequest();
  }, []);

  async function loadPendingRequest() {
    try {
      setError("");
      setPendingRequest(await fetchMyPendingNicknameChangeRequest());
    } catch (e) {
      setError(e.message || "닉네임 변경 요청 상태를 불러오지 못했습니다.");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice("");
    setError("");

    if (pendingRequest) {
      setError("이미 처리 대기 중인 닉네임 변경 요청이 있습니다.");
      return;
    }
    if (!requestedNickname.trim()) {
      setError("변경할 닉네임을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      await requestNicknameChange(requestedNickname.trim());
      await loadPendingRequest();
      setRequestedNickname("");
      setNotice("닉네임 변경 요청을 보냈습니다. 관리자 승인을 기다려주세요.");
    } catch (e) {
      setError(e.message || "닉네임 변경 요청을 보내지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    const ok = window.confirm("닉네임 변경 요청을 철회할까요?");
    if (!ok) return;

    try {
      setLoading(true);
      setNotice("");
      setError("");
      await cancelMyPendingNicknameChangeRequest();
      setPendingRequest(null);
      setNotice("닉네임 변경 요청을 철회했습니다.");
    } catch (e) {
      setError(e.message || "닉네임 변경 요청을 철회하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-[#745320] bg-[#211813] p-4">
      <div className="mb-3">
        <h3 className="text-sm font-bold text-[#fff0c8]">닉네임 변경 요청</h3>
        <p className="mt-1 text-xs text-[#d7be80]">
          현재 닉네임: {currentNickname || "-"} · 관리자 승인 후 반영됩니다.
        </p>
      </div>

      {pendingRequest && (
        <div className="mb-3 rounded-md border border-amber-300/60 bg-[#3a2a16] p-3 text-sm text-amber-100">
          {pendingRequest.requestedNickname} 닉네임으로 변경 요청 대기 중입니다.
        </div>
      )}

      {notice && (
        <div className="mb-3 rounded-md border border-green-300/50 bg-[#193321] p-3 text-sm text-green-100">
          {notice}
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-md border border-red-300/50 bg-[#3c1f1a] p-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 md:flex-row">
        <input
          value={requestedNickname}
          disabled={Boolean(pendingRequest) || loading}
          onChange={(event) => setRequestedNickname(event.target.value)}
          placeholder="변경할 닉네임"
          className="min-w-0 flex-1 rounded-md border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] placeholder:text-[#bda981] outline-none focus:border-[#f6c44f] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={Boolean(pendingRequest) || loading}
          className="rounded-md bg-[#f3d37b] px-4 py-2 text-sm font-semibold text-[#2f1f13] disabled:opacity-40"
        >
          요청
        </button>
        {pendingRequest && (
          <button
            type="button"
            disabled={loading}
            onClick={handleCancel}
            className="rounded-md border border-[#9b743a] px-4 py-2 text-sm font-semibold text-[#f8e0ad] hover:border-[#f6c44f] disabled:opacity-40"
          >
            철회
          </button>
        )}
      </form>
    </section>
  );
}

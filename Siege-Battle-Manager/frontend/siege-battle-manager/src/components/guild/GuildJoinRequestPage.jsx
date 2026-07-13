import React, { useEffect, useState } from "react";
import {
  cancelMyPendingExistingJoinRequest,
  fetchMyPendingExistingJoinRequest,
  requestExistingAccountGuildCreate,
  requestExistingAccountJoin,
} from "../../lib/guildApproval.js";

const TABS = [
  { key: "join", label: "길드 가입" },
  { key: "create", label: "길드 개설" },
];

export default function GuildJoinRequestPage({ me }) {
  const [activeTab, setActiveTab] = useState("join");
  const [joinGuildName, setJoinGuildName] = useState("");
  const [createGuildName, setCreateGuildName] = useState("");
  const [createGuildNameConfirm, setCreateGuildNameConfirm] = useState("");
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
      setPendingRequest(await fetchMyPendingExistingJoinRequest());
    } catch (e) {
      setError(e.message || "요청 상태를 불러오지 못했습니다.");
    }
  }

  async function handleJoinSubmit(event) {
    event.preventDefault();
    setNotice("");
    setError("");

    if (pendingRequest) {
      setError("이미 처리 대기 중인 가입 또는 개설 요청이 있습니다. 철회 후 다시 요청해주세요.");
      return;
    }

    if (!joinGuildName.trim()) {
      setError("가입할 길드 이름을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      await requestExistingAccountJoin(joinGuildName.trim());
      await loadPendingRequest();
      setNotice("길드 가입 요청을 보냈습니다. 길드장 또는 부길드장의 승인을 기다려주세요.");
      setJoinGuildName("");
    } catch (e) {
      setError(e.message || "길드 가입 요청을 보내지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSubmit(event) {
    event.preventDefault();
    setNotice("");
    setError("");

    if (pendingRequest) {
      setError("이미 처리 대기 중인 가입 또는 개설 요청이 있습니다. 철회 후 다시 요청해주세요.");
      return;
    }

    if (!createGuildName.trim() || !createGuildNameConfirm.trim()) {
      setError("개설하려는 길드 이름을 두 번 입력해주세요.");
      return;
    }

    if (createGuildName.trim() !== createGuildNameConfirm.trim()) {
      setError("길드 이름 확인이 일치하지 않습니다.");
      return;
    }

    try {
      setLoading(true);
      await requestExistingAccountGuildCreate(
        createGuildName.trim(),
        createGuildNameConfirm.trim()
      );
      await loadPendingRequest();
      setNotice("길드 개설 요청을 보냈습니다. 관리자 승인을 기다려주세요.");
      setCreateGuildName("");
      setCreateGuildNameConfirm("");
    } catch (e) {
      setError(e.message || "길드 개설 요청을 보내지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    const ok = window.confirm("대기 중인 요청을 철회할까요?");
    if (!ok) return;

    try {
      setLoading(true);
      setNotice("");
      setError("");
      await cancelMyPendingExistingJoinRequest();
      setPendingRequest(null);
      setNotice("요청을 철회했습니다.");
    } catch (e) {
      setError(e.message || "요청을 철회하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("accessToken");
    window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-[#1f120b] px-4 py-8 text-[#f5e6bd]">
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center">
        <section className="w-full rounded-2xl border border-[#7a5525] bg-[#2a160d] p-6 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#51341e] pb-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#d6b878]">길드 가입 필요</p>
              <h1 className="mt-1 text-2xl font-bold text-[#ffe08a]">가입 또는 개설을 선택해주세요</h1>
              <p className="mt-2 text-sm leading-6 text-[#d6b878]">
                {me?.nickname ?? me?.loginId} 계정은 현재 가입된 길드가 없습니다.
                <br />
                요청이 승인되기 전까지는 가입 요청 외 기능을 사용할 수 없습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-[#d5a84a] px-3 py-2 text-sm font-semibold text-[#ffe08a] hover:bg-[#3c2415]"
            >
              로그아웃
            </button>
          </div>

          <div className="mt-6 inline-flex rounded-xl border border-[#7a5525] bg-[#1b0f09] p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setNotice("");
                  setError("");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${
                  activeTab === tab.key
                    ? "bg-[#ffe08a] text-[#2a160d]"
                    : "text-[#d6b878] hover:bg-[#3c2415]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {pendingRequest && (
            <div className="mt-5 rounded-lg border border-[#d5a84a] bg-[#3c2415] px-4 py-3 text-sm text-[#f5e6bd]">
              <div className="font-bold text-[#ffe08a]">
                {pendingRequest.requestSource === "ACCOUNT_MASTER"
                  ? "길드 개설 요청 대기 중"
                  : "길드 가입 요청 대기 중"}
              </div>
              <div className="mt-1">
                {pendingRequest.guildName} 요청을 보냈습니다. 승인 전에는 다른 요청을 보낼 수 없습니다.
              </div>
            </div>
          )}

          {activeTab === "join" ? (
            <form onSubmit={handleJoinSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-[#f5e6bd]">길드 이름</span>
                <input
                  value={joinGuildName}
                  onChange={(event) => setJoinGuildName(event.target.value)}
                  disabled={Boolean(pendingRequest) || loading}
                  placeholder="가입하려는 길드 이름"
                  className="mt-2 w-full rounded-lg border border-[#7a5525] bg-[#1b0f09] px-4 py-3 text-[#f5e6bd] outline-none placeholder:text-[#8f7652] focus:border-[#ffe08a] disabled:opacity-50"
                />
              </label>

              <StatusMessages notice={notice} error={error} />

              <ActionButtons
                loading={loading}
                pendingRequest={pendingRequest}
                submitLabel="가입 요청"
                loadingLabel="요청 중"
                onCancel={handleCancel}
              />
            </form>
          ) : (
            <form onSubmit={handleCreateSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-[#f5e6bd]">개설하려는 길드 이름</span>
                <input
                  value={createGuildName}
                  onChange={(event) => setCreateGuildName(event.target.value)}
                  disabled={Boolean(pendingRequest) || loading}
                  placeholder="개설하려는 길드 이름"
                  className="mt-2 w-full rounded-lg border border-[#7a5525] bg-[#1b0f09] px-4 py-3 text-[#f5e6bd] outline-none placeholder:text-[#8f7652] focus:border-[#ffe08a] disabled:opacity-50"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-[#f5e6bd]">개설하려는 길드 이름 확인</span>
                <input
                  value={createGuildNameConfirm}
                  onChange={(event) => setCreateGuildNameConfirm(event.target.value)}
                  disabled={Boolean(pendingRequest) || loading}
                  placeholder="같은 길드 이름을 한 번 더 입력"
                  className="mt-2 w-full rounded-lg border border-[#7a5525] bg-[#1b0f09] px-4 py-3 text-[#f5e6bd] outline-none placeholder:text-[#8f7652] focus:border-[#ffe08a] disabled:opacity-50"
                />
              </label>

              <StatusMessages notice={notice} error={error} />

              <ActionButtons
                loading={loading}
                pendingRequest={pendingRequest}
                submitLabel="개설 요청"
                loadingLabel="요청 중"
                onCancel={handleCancel}
              />
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

function StatusMessages({ notice, error }) {
  return (
    <>
      {notice && (
        <div className="rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </>
  );
}

function ActionButtons({ loading, pendingRequest, submitLabel, loadingLabel, onCancel }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="submit"
        disabled={loading || Boolean(pendingRequest)}
        className="rounded-lg bg-[#ffe08a] px-5 py-3 text-sm font-bold text-[#2a160d] disabled:opacity-50"
      >
        {loading ? loadingLabel : submitLabel}
      </button>
      {pendingRequest && (
        <button
          type="button"
          disabled={loading}
          onClick={onCancel}
          className="rounded-lg border border-[#d5a84a] px-5 py-3 text-sm font-bold text-[#ffe08a] hover:bg-[#3c2415] disabled:opacity-50"
        >
          요청 철회
        </button>
      )}
    </div>
  );
}

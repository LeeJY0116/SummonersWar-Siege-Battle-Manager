import React, { useState } from "react";
import NicknameChangeRequestPanel from "./NicknameChangeRequestPanel.jsx";

export default function MyInfoTab({
  me,
  guild,
  currentNickname = "",
  currentGuildRole = null,
  onLeaveGuild,
}) {
  const [leaving, setLeaving] = useState(false);
  const isMaster = currentGuildRole === "MASTER";
  const canLeaveGuild = Boolean(guild) && !isMaster && !leaving;

  async function handleLeaveGuild() {
    const ok = window.confirm("정말 길드를 탈퇴할까요?");
    if (!ok) return;

    try {
      setLeaving(true);
      await onLeaveGuild();
    } catch (e) {
      alert(e.message || "길드 탈퇴에 실패했습니다.");
    } finally {
      setLeaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <section>
        <h2 className="text-lg font-bold text-gray-950">내 정보</h2>
        <p className="mt-1 text-sm text-gray-500">
          계정 정보와 길드 소속 상태를 확인합니다.
        </p>
      </section>

      <section className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-2">
        <InfoRow label="아이디" value={me?.loginId || "-"} />
        <InfoRow label="이메일" value={me?.email || "-"} />
        <InfoRow label="닉네임" value={currentNickname || me?.nickname || "-"} />
        <div className="rounded-lg bg-white p-3">
          <div className="text-xs font-semibold text-gray-500">소속 길드</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-gray-950">{guild?.name || "없음"}</span>
            {guild && (
              <button
                type="button"
                onClick={handleLeaveGuild}
                disabled={!canLeaveGuild}
                className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {leaving ? "탈퇴 중..." : "길드 탈퇴"}
              </button>
            )}
          </div>
          {isMaster && (
            <p className="mt-2 text-xs text-gray-500">
              길드장은 길드장 양도 후 탈퇴할 수 있습니다.
            </p>
          )}
        </div>
      </section>

      <NicknameChangeRequestPanel currentNickname={currentNickname || me?.nickname || ""} />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <div className="text-xs font-semibold text-gray-500">{label}</div>
      <div className="mt-2 text-sm font-semibold text-gray-950">{value}</div>
    </div>
  );
}

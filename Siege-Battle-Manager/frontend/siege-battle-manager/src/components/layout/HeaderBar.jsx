import React from "react";

const TABS = [
  { key: "guild", label: "길드" },
  { key: "myInfo", label: "내 정보" },
  { key: "review", label: "몬스터 검수" },
];

export default function HeaderBar({
  activeTab,
  onChangeTab,
  guild,
  isAdmin = false,
  onSyncSwarfarmMonsters,
  syncingMonsters = false,
  onApplyMonsterLocalization,
  applyingLocalization = false,
  currentNickname = "",
}) {
  const tabs = isAdmin
    ? TABS
    : TABS.filter((tab) => tab.key !== "review");

  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          서머너즈워 공방덱 연구사이트
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          몬스터 조합과 길드 전투 기록을 관리합니다.
        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="inline-flex gap-1 rounded-2xl bg-gray-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChangeTab(tab.key)}
              className={`rounded-xl px-3 py-1 text-sm ${
                activeTab === tab.key
                  ? "bg-white font-semibold shadow"
                  : "text-gray-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="text-xs text-gray-500">
            길드:{" "}
            {guild
              ? `${guild.name} | 마스터: ${guild.masterNickname} | 내 닉네임: ${currentNickname || "-"} | 인원: ${guild.memberCount}`
              : "없음"}
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={onSyncSwarfarmMonsters}
              disabled={syncingMonsters}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-2 shadow-sm hover:bg-gray-100 disabled:opacity-50"
            >
              {syncingMonsters ? "Syncing..." : "Sync Swarfarm"}
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={onApplyMonsterLocalization}
              disabled={applyingLocalization}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-2 shadow-sm hover:bg-gray-100 disabled:opacity-50"
            >
              {applyingLocalization ? "Applying..." : "Apply Names"}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("accessToken");
              window.location.reload();
            }}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}

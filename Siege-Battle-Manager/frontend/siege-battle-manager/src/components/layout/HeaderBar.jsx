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
  monsterJobStatus = null,
  currentNickname = "",
  onOpenHelp,
}) {
  const tabs = isAdmin
    ? TABS
    : TABS.filter((tab) => tab.key !== "review");

  return (
    <header className="mb-6 rounded-2xl border border-[#8b6a2e] bg-[#2f241b] p-5 text-[#f6deb0] shadow-[0_10px_24px_rgba(10,7,4,0.25)] md:flex md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold text-[#fff0c8] md:text-3xl">
          SW 점령전
        </h1>
        <p className="mt-1 text-sm text-[#d7be80]">
          몬스터 조합과 길드 전투 기록을 관리합니다.
        </p>
      </div>

      <div className="mt-4 flex flex-col items-start gap-2 md:mt-0 md:items-end">
        <div className="inline-flex gap-1 rounded-2xl border border-[#745320] bg-[#211813] p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChangeTab(tab.key)}
              className={`rounded-xl px-3 py-1 text-sm transition ${
                activeTab === tab.key
                  ? "bg-[#f3d37b] font-semibold text-[#2f1f13] shadow"
                  : "text-[#d7be80] hover:bg-[#3b2a1d] hover:text-[#fff0c8]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
          {monsterJobStatus?.status === "RUNNING" && (
            <div className="rounded-xl border border-[#9b743a] bg-[#1a120d] px-3 py-2 text-xs font-semibold text-[#f3d37b]">
              {monsterJobStatus.operation === "SWARFARM_SYNC" ? "Sync" : "Apply"}{" "}
              {monsterJobStatus.processedCount ?? 0}
              {monsterJobStatus.totalCount ? ` / ${monsterJobStatus.totalCount}` : ""}
            </div>
          )}

          <div className="text-sm font-semibold text-[#d7be80]">
            닉네임 {currentNickname || "-"}
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={onSyncSwarfarmMonsters}
              disabled={syncingMonsters}
              className="rounded-2xl border border-[#9b743a] bg-[#221913] px-4 py-2 text-sm font-semibold text-[#f8e0ad] hover:border-[#f6c44f] disabled:opacity-50"
            >
              {syncingMonsters ? "Syncing..." : "Sync Swarfarm"}
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={onApplyMonsterLocalization}
              disabled={applyingLocalization}
              className="rounded-2xl border border-[#9b743a] bg-[#221913] px-4 py-2 text-sm font-semibold text-[#f8e0ad] hover:border-[#f6c44f] disabled:opacity-50"
            >
              {applyingLocalization ? "Applying..." : "Apply Names"}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenHelp}
            className="rounded-xl border border-[#9b743a] bg-[#221913] px-3 py-2 text-sm font-semibold text-[#f8e0ad] hover:border-[#f6c44f]"
          >
            도움말
          </button>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("accessToken");
              window.location.reload();
            }}
            className="rounded-xl border border-[#9b743a] bg-[#221913] px-3 py-2 text-sm font-semibold text-[#f8e0ad] hover:border-[#f6c44f]"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}

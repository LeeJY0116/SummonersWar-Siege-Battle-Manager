import React, { useEffect, useMemo, useState } from "react";
import InventoryTab from "./InventoryTab.jsx";
import DefenseDeckTab from "./DefenseDeckTab.jsx";
import OwnerlessDefenseDeckTab from "./OwnerlessDefenseDeckTab.jsx";
import BattleResearchTab from "./BattleResearchTab.jsx";
import GuildMemberManagementTab from "./GuildMemberManagementTab.jsx";

export default function GuildTab({
  guild,
  members,
  monsters,
  canManageGuild = false,
  currentGuildRole = null,
  currentGuildMemberId = null,
  onRefreshMembers,
  onSubTabChange,
}) {
  const [subTab, setSubTab] = useState("inventory");
  const canUse = Boolean(guild);

  useEffect(() => {
    onSubTabChange?.(subTab);
  }, [onSubTabChange, subTab]);

  function changeSubTab(nextSubTab) {
    setSubTab(nextSubTab);
    onSubTabChange?.(nextSubTab);
  }

  const header = useMemo(() => {
    if (!guild) return "가입된 길드가 없습니다.";
    return `${guild.name} · 인원 ${members?.length ?? guild.memberCount ?? 0}`;
  }, [guild, members]);

  return (
    <div className="rounded-2xl border border-[#8b6a2e] bg-[#2f241b] p-4 text-[#f6deb0] shadow-[0_10px_24px_rgba(10,7,4,0.25)]">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-lg font-bold text-[#fff0c8]">길드</div>
          <div className="text-sm font-semibold text-[#d7be80]">{header}</div>
        </div>

        <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-[#745320] bg-[#211813] p-1">
          <SubTabButton active={subTab === "inventory"} onClick={() => changeSubTab("inventory")}>
            인벤토리
          </SubTabButton>
          <SubTabButton
            active={subTab === "battleResearch"}
            onClick={() => changeSubTab("battleResearch")}
          >
            전투 연구
          </SubTabButton>
          <SubTabButton
            active={subTab === "defenseDeck"}
            onClick={() => changeSubTab("defenseDeck")}
          >
            방덱
          </SubTabButton>
          <SubTabButton active={subTab === "ownerless"} onClick={() => changeSubTab("ownerless")}>
            길드 방덱
          </SubTabButton>
          {canManageGuild && (
            <SubTabButton active={subTab === "members"} onClick={() => changeSubTab("members")}>
              회원 관리
            </SubTabButton>
          )}
        </div>
      </div>

      {!canUse ? (
        <div className="text-sm text-[#d7be80]">길드 가입 승인 후 이용할 수 있습니다.</div>
      ) : subTab === "inventory" ? (
        <InventoryTab
          members={members}
          monsters={monsters}
          canManageGuild={canManageGuild}
          currentGuildMemberId={currentGuildMemberId}
        />
      ) : subTab === "defenseDeck" ? (
        <DefenseDeckTab
          members={members}
          monsters={monsters}
          canManageGuild={canManageGuild}
          currentGuildMemberId={currentGuildMemberId}
        />
      ) : subTab === "ownerless" ? (
        <OwnerlessDefenseDeckTab monsters={monsters} />
      ) : subTab === "battleResearch" ? (
        <BattleResearchTab monsters={monsters} />
      ) : subTab === "members" && canManageGuild ? (
        <GuildMemberManagementTab
          guild={guild}
          members={members}
          currentGuildRole={currentGuildRole}
          onRefreshMembers={onRefreshMembers}
        />
      ) : null}
    </div>
  );
}

function SubTabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-1 text-sm transition ${
        active
          ? "bg-[#f3d37b] font-semibold text-[#2f1f13] shadow"
          : "text-[#d7be80] hover:bg-[#3b2a1d] hover:text-[#fff0c8]"
      }`}
    >
      {children}
    </button>
  );
}

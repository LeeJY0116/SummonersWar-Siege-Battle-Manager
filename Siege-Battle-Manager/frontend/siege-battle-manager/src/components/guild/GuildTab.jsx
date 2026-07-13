import React, { useMemo, useState } from "react";
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
}) {
  const [subTab, setSubTab] = useState("inventory");
  const canUse = Boolean(guild);

  const header = useMemo(() => {
    if (!guild) return "가입된 길드가 없습니다.";
    return `${guild.name} · 인원 ${members?.length ?? guild.memberCount ?? 0}`;
  }, [guild, members]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-bold">길드</div>
          <div className="text-sm text-gray-600">{header}</div>
        </div>

        <div className="inline-flex gap-1 rounded-2xl bg-gray-100 p-1">
          <SubTabButton active={subTab === "inventory"} onClick={() => setSubTab("inventory")}>
            인벤토리
          </SubTabButton>
          <SubTabButton
            active={subTab === "battleResearch"}
            onClick={() => setSubTab("battleResearch")}
          >
            전투 연구
          </SubTabButton>
          <SubTabButton
            active={subTab === "defenseDeck"}
            onClick={() => setSubTab("defenseDeck")}
          >
            방덱
          </SubTabButton>
          <SubTabButton active={subTab === "ownerless"} onClick={() => setSubTab("ownerless")}>
            길드 방덱
          </SubTabButton>
          {canManageGuild && (
            <SubTabButton active={subTab === "members"} onClick={() => setSubTab("members")}>
              회원 관리
            </SubTabButton>
          )}
        </div>
      </div>

      {!canUse ? (
        <div className="text-sm text-gray-600">길드 가입 승인 후 이용할 수 있습니다.</div>
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
      className={`rounded-xl px-3 py-1 text-sm ${
        active ? "bg-white font-semibold shadow" : "text-gray-500"
      }`}
    >
      {children}
    </button>
  );
}

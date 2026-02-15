import React, { useMemo, useState } from "react";
import InventoryTab from "./InventoryTab.jsx";

export default function GuildTab({ guild, members, monsters }) {
  const [subTab, setSubTab] = useState("inventory");

  const canUse = Boolean(guild);

  const header = useMemo(() => {
    if (!guild) return "길드에 가입되어 있지 않습니다.";
    return `${guild.name} · 인원 ${guild.memberCount ?? members?.length ?? 0}`;
  }, [guild, members]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-lg font-bold">길드</div>
          <div className="text-sm text-gray-600">{header}</div>
        </div>

        <div className="inline-flex rounded-2xl bg-gray-100 p-1 gap-1">
          <button
            onClick={() => setSubTab("inventory")}
            className={`px-3 py-1 rounded-xl text-sm ${
              subTab === "inventory"
                ? "bg-white shadow font-semibold"
                : "text-gray-500"
            }`}
          >
            인벤토리
          </button>
          {/* 다음에 방덱/연구 탭 추가하면 여기 버튼만 늘리면 됨 */}
        </div>
      </div>

      {!canUse ? (
        <div className="text-sm text-gray-600">
          길드를 만든 뒤 이용할 수 있어요.
        </div>
      ) : subTab === "inventory" ? (
        <InventoryTab members={members} monsters={monsters} />
      ) : null}
    </div>
  );
}

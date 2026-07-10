import React, { useMemo } from "react";

function extractCom2usId(monster) {
  const code = monster?.monsterCode ?? monster?.code ?? monster?.id;
  const match = String(code ?? "").match(/^sw_(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function compareMonstersForSelection(a, b) {
  const awakeningDiff = Number(b.awakeningLevel === 2) - Number(a.awakeningLevel === 2);
  if (awakeningDiff !== 0) return awakeningDiff;

  const starsDiff = (b.naturalStars ?? b.grade ?? 0) - (a.naturalStars ?? a.grade ?? 0);
  if (starsDiff !== 0) return starsDiff;

  return (b.com2usId ?? extractCom2usId(b)) - (a.com2usId ?? extractCom2usId(a));
}

export default function MonsterSelect({ monsters, value, onChange, label }) {
  const sortedMonsters = useMemo(
    () => [...monsters].sort(compareMonstersForSelection),
    [monsters],
  );

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <select
        className="px-3 py-2 rounded-xl border border-gray-200 shadow-sm bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">-- 선택 --</option>
        {sortedMonsters.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </label>
  );
}

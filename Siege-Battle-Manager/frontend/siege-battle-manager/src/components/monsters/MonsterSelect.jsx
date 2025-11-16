import React from "react";

export default function MonsterSelect({ monsters, value, onChange, label }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <select
        className="px-3 py-2 rounded-xl border border-gray-200 shadow-sm bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">-- 선택 --</option>
        {monsters.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </label>
  );
}

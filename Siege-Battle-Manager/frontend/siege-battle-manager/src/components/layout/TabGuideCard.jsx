import React from "react";

export default function TabGuideCard({ title, description, items = [] }) {
  return (
    <aside className="rounded-2xl border border-[#8b6a2e] bg-[#2f241b] p-5 text-[#f6deb0] shadow-[0_10px_24px_rgba(31,20,10,0.18)]">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#c8a96a]">
        현재 탭
      </div>
      <h2 className="mt-2 text-lg font-bold text-[#fff0c8]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#d7be80]">{description}</p>

      {items.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm text-[#f6deb0]">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f6c44f]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

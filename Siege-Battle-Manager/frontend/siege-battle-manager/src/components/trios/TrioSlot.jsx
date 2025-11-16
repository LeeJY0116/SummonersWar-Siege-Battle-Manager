import React from "react";

export default function TrioSlot({ monster, isLeader = false, size = "md" }) {
  // 슬롯 크기
  const baseSize = size === "lg" ? "w-24 h-24" : "w-20 h-20";
    
  // 리더 테두리 색
  const borderColor = isLeader ? "border-blue-500" : "border-yellow-900";

  // 리더 전용 배경 그라데이션
  const bgClass = isLeader
    ? "bg-gradient-to-b from-blue-400/40 to-blue-700/50"
    : "bg-gradient-to-b from-yellow-900/40 to-yellow-900/90";

  // 리더일 때 아이콘 확대 비율
  const iconScale = isLeader ? "scale-110" : "scale-100";

  return (
    <div
      className={`relative ${baseSize} rounded-md border-2 ${borderColor} ${bgClass}
      flex items-center justify-center overflow-hidden`}
    >
      {monster?.iconDataUrl ? (
        <img
          src={monster.iconDataUrl}
          alt=""
          className={`w-full h-full object-cover transition-transform ${iconScale}`}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-[10px] text-yellow-50/70">
          <span className="opacity-70">Empty</span>
        </div>
      )}

      {isLeader && (
        <div className="absolute left-0 top-0 px-1.5 py-0.5 bg-black/75 text-[10px] text-white font-semibold rounded-br-[4px]">
          Leader
        </div>
      )}
    </div>
  );
}

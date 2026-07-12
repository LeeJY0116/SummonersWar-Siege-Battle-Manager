export default function DeckMonsterSlot({
  monster,
  isLeader,
  isActive,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex h-28 w-28 flex-col items-center justify-center rounded-2xl border-2 transition hover:scale-105 ${
        isActive
          ? "border-[#f6c44f] bg-[#2a170c] ring-4 ring-[#f6c44f]/30"
          : isLeader
            ? "border-[#f6c44f] bg-[#3a2a1d]"
            : "border-[#9b743a] bg-[#221913]"
      }`}
    >
      {isLeader && (
        <div className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-[1px] text-[10px] font-bold text-[#ffd96a]">
          L
        </div>
      )}

      {monster ? (
        <>
          {monster.iconDataUrl ? (
            <img
              src={monster.iconDataUrl}
              alt={monster.name}
              className="h-16 w-16 rounded-sm border border-[#3c2414] object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-sm border border-[#3c2414] bg-[#2f241b] text-xs text-[#c8a96a]">
              No Img
            </div>
          )}

          <div className="mt-2 max-w-[88px] text-center text-xs font-semibold leading-tight text-[#f6deb0] antialiased">
            {monster.name}
          </div>
        </>
      ) : (
        <div className="text-sm font-semibold text-[#c8a96a]">선택</div>
      )}
    </button>
  );
}

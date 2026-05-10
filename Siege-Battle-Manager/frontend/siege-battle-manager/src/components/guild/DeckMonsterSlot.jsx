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
          ? "border-yellow-400 ring-4 ring-yellow-200"
          : isLeader
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-100"
      }`}
    >
      {isLeader && (
        <div className="absolute -top-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
          LEADER
        </div>
      )}

      {monster ? (
        <>
          <img
            src={monster.iconDataUrl}
            alt={monster.name}
            className="h-16 w-16 rounded-xl object-cover"
          />

          <div className="mt-2 text-xs font-semibold">
            {monster.name}
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-400">선택</div>
      )}
    </button>
  );
}
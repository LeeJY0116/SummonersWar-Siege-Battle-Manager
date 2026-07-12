const STAR_FILTERS = [
  { value: "", label: "전체" },
  { value: 5, label: "5성" },
  { value: 4, label: "4성" },
  { value: 3, label: "3성" },
  { value: 2, label: "2성" },
];

const ELEMENT_FILTERS = [
  { value: "", label: "전체" },
  { value: "fire", label: "불" },
  { value: "water", label: "물" },
  { value: "wind", label: "풍" },
  { value: "light", label: "빛" },
  { value: "dark", label: "암" },
];

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function getMonsterStars(monster) {
  return Number(monster?.naturalStars ?? monster?.grade ?? 0);
}

export function getMonsterElement(monster) {
  return normalize(monster?.element ?? monster?.attribute);
}

export function getElementFilterLabel(value) {
  return ELEMENT_FILTERS.find((element) => element.value === value)?.label ?? value;
}

export function matchesMonsterPickerFilters(monster, { query, starFilter, elementFilter }) {
  const stars = getMonsterStars(monster);

  if (stars < 2 || stars > 5) {
    return false;
  }

  if (String(query ?? "").trim()) {
    return true;
  }

  if (starFilter !== "" && starFilter != null && stars !== Number(starFilter)) {
    return false;
  }

  if (elementFilter && getMonsterElement(monster) !== elementFilter) {
    return false;
  }

  return true;
}

export default function MonsterFilterControls({
  starFilter,
  onChangeStarFilter,
  elementFilter,
  onChangeElementFilter,
  disabled = false,
  variant = "light",
}) {
  const isDark = variant === "dark";

  const panelClass = isDark
    ? "mb-3 space-y-2 rounded-xl border border-[#8b6a2e] bg-[#3a2a1d] p-3 shadow-inner"
    : "mb-3 space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-3";

  const activeButtonClass = isDark
    ? "border-[#f6c44f] bg-[#f3d37b] text-[#2f1f13] shadow-[0_0_0_1px_rgba(255,244,178,0.45)]"
    : "border-blue-500 bg-blue-50 text-blue-700";

  const inactiveButtonClass = isDark
    ? "border-[#9b743a] bg-[#221913] text-[#f8e0ad] hover:border-[#f6c44f] hover:bg-[#2f241b]"
    : "border-gray-200 bg-white text-gray-600";

  return (
    <div className={panelClass}>
      <div className="flex flex-wrap gap-2">
        {STAR_FILTERS.map((filter) => (
          <button
            key={filter.value || "all-stars"}
            type="button"
            disabled={disabled}
            onClick={() => onChangeStarFilter(filter.value)}
            className={`rounded-full border px-3 py-1 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              starFilter === filter.value
                ? activeButtonClass
                : inactiveButtonClass
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {ELEMENT_FILTERS.map((element) => (
          <button
            key={element.value || "all"}
            type="button"
            disabled={disabled}
            onClick={() => onChangeElementFilter(element.value)}
            className={`rounded-full border px-3 py-1 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
              elementFilter === element.value
                ? activeButtonClass
                : inactiveButtonClass
            }`}
          >
            {element.label}
          </button>
        ))}
      </div>
    </div>
  );
}

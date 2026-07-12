const STAR_FILTERS = [5, 4, 3, 2];

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

  if (stars !== Number(starFilter)) {
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
}) {
  return (
    <div className="mb-3 space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-3">
      <div className="flex flex-wrap gap-2">
        {STAR_FILTERS.map((stars) => (
          <button
            key={stars}
            type="button"
            disabled={disabled}
            onClick={() => onChangeStarFilter(stars)}
            className={`rounded-full border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
              starFilter === stars
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            {stars}성
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
            className={`rounded-full border px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${
              elementFilter === element.value
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            {element.label}
          </button>
        ))}
      </div>
    </div>
  );
}

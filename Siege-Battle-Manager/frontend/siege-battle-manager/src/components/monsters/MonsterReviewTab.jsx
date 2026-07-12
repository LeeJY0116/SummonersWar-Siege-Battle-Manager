import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api.js";
import GuildApprovalPanel from "../admin/GuildApprovalPanel.jsx";

const TEXT = {
  title: "몬스터 관리",
  description:
    "관리 파일의 한글명, 별칭, 표시 여부를 수정합니다.",
  refresh: "새로고침",
  saveChanges: "변경 내용 저장",
  saving: "저장 중",
  saved: "저장됨",
  save: "저장",
  noChanges: "저장할 변경 없음",
  loadError: "몬스터 관리 목록을 불러오지 못했습니다.",
  saveError: "몬스터 관리 정보를 저장하지 못했습니다.",
  queryPlaceholder: "이름, 코드, 별칭 검색",
  total: "전체",
  enabled: "표시",
  disabled: "숨김",
  missingKoreanName: "한글명 누락",
  enabledOnly: "표시만",
  disabledOnly: "숨김만",
  allVariants: "전체",
  collab: "콜라보",
  original: "오리지널",
  allAttributes: "전체 속성",
  allAwakening: "전체 각성",
  missingOnly: "표시 대상 중 한글명이 비어 있는 몬스터만 보기",
  loading: "불러오는 중",
  countSuffix: "개 표시",
  display: "표시",
  image: "이미지",
  code: "코드",
  attribute: "속성",
  awakening: "각성",
  koreanName: "한글명",
  englishName: "원문명",
  aliases: "별칭",
  action: "저장",
  none: "없음",
  unawakened: "비각성",
  firstAwakened: "1각",
  secondAwakened: "2각",
  other: "기타",
};

const ATTRIBUTE_LABELS = {
  FIRE: "불",
  WATER: "물",
  WIND: "풍",
  LIGHT: "빛",
  DARK: "암",
};

function codeSeq(prefix, from = 11, to = 15) {
  return Array.from({ length: to - from + 1 }, (_, index) => `${prefix}${from + index}`);
}

const COLLAB_CODES = new Set([
  ...codeSeq("sw_240"),
  ...codeSeq("sw_242"),
  ...codeSeq("sw_243"),
  ...codeSeq("sw_244"),
  "sw_24612",
  "sw_26213",
  ...codeSeq("sw_263"),
  ...codeSeq("sw_264"),
  ...codeSeq("sw_265"),
  ...codeSeq("sw_266"),
  "sw_27314",
  ...codeSeq("sw_274"),
  ...codeSeq("sw_275"),
  ...codeSeq("sw_276"),
  ...codeSeq("sw_277"),
  ...codeSeq("sw_292"),
  ...codeSeq("sw_293"),
  ...codeSeq("sw_294"),
  ...codeSeq("sw_295"),
  "sw_30215",
  ...codeSeq("sw_303"),
  ...codeSeq("sw_304"),
  ...codeSeq("sw_305"),
  ...codeSeq("sw_306"),
  "sw_31713",
  ...codeSeq("sw_318"),
  ...codeSeq("sw_319"),
  ...codeSeq("sw_320"),
  ...codeSeq("sw_321"),
  ...codeSeq("sw_322"),
  "sw_33012",
  ...codeSeq("sw_331"),
  ...codeSeq("sw_332"),
  ...codeSeq("sw_333"),
  ...codeSeq("sw_334"),
  "sw_34311",
  ...codeSeq("sw_344"),
  ...codeSeq("sw_346"),
  ...codeSeq("sw_347"),
  ...codeSeq("sw_348"),
  "sw_35611",
  ...codeSeq("sw_360"),
]);

const ORIGINAL_CODES = new Set([
  ...codeSeq("sw_245"),
  ...codeSeq("sw_247"),
  ...codeSeq("sw_248"),
  ...codeSeq("sw_249"),
  "sw_26713",
  ...codeSeq("sw_268"),
  ...codeSeq("sw_269"),
  ...codeSeq("sw_270"),
  ...codeSeq("sw_271"),
  "sw_27814",
  ...codeSeq("sw_279"),
  ...codeSeq("sw_280"),
  ...codeSeq("sw_281"),
  ...codeSeq("sw_282"),
  ...codeSeq("sw_296"),
  ...codeSeq("sw_297"),
  ...codeSeq("sw_298"),
  ...codeSeq("sw_299"),
  "sw_30815",
  ...codeSeq("sw_309"),
  ...codeSeq("sw_310"),
  ...codeSeq("sw_311"),
  ...codeSeq("sw_312"),
  "sw_32413",
  ...codeSeq("sw_325"),
  ...codeSeq("sw_326"),
  ...codeSeq("sw_328"),
  ...codeSeq("sw_329"),
  "sw_33512",
  ...codeSeq("sw_336"),
  ...codeSeq("sw_337"),
  ...codeSeq("sw_338"),
  ...codeSeq("sw_339"),
  "sw_34911",
  ...codeSeq("sw_350"),
  "sw_35114",
  ...codeSeq("sw_352"),
  ...codeSeq("sw_353"),
  ...codeSeq("sw_354"),
]);

function getVariantType(code) {
  if (COLLAB_CODES.has(code)) return "collab";
  if (ORIGINAL_CODES.has(code)) return "original";
  return "normal";
}

function getAwakeningLabel(level) {
  if (level === 0) return TEXT.unawakened;
  if (level === 1) return TEXT.firstAwakened;
  if (level === 2) return TEXT.secondAwakened;
  return TEXT.other;
}

function normalizeAliases(aliases) {
  if (Array.isArray(aliases)) return aliases;
  if (!aliases) return [];
  return String(aliases)
    .split(",")
    .map((alias) => alias.trim())
    .filter(Boolean);
}

function toAliasText(aliases) {
  return normalizeAliases(aliases).join(", ");
}

function parseAliasText(text) {
  return String(text ?? "")
    .split(",")
    .map((alias) => alias.trim())
    .filter(Boolean);
}

function toEditableRow(monster) {
  return {
    ...monster,
    enabled: monster.enabled !== false,
    koreanName: monster.koreanName ?? "",
    aliasesText: toAliasText(monster.aliases),
  };
}

function getRowSignature(row) {
  return JSON.stringify({
    enabled: row.enabled !== false,
    koreanName: row.koreanName ?? "",
    aliasesText: row.aliasesText ?? "",
  });
}

export default function MonsterReviewTab() {
  const [monsters, setMonsters] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [savingCode, setSavingCode] = useState("");
  const [savingAll, setSavingAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [enabledFilter, setEnabledFilter] = useState("enabled");
  const [variantFilter, setVariantFilter] = useState("ALL");
  const [attributeFilter, setAttributeFilter] = useState("ALL");
  const [awakeningFilter, setAwakeningFilter] = useState("ALL");
  const [missingOnly, setMissingOnly] = useState(false);

  async function loadMonsters() {
    try {
      setLoading(true);
      setError("");
      const body = await apiFetch("/admin/monsters/localization");
      const rows = (body.data ?? []).map(toEditableRow);
      setMonsters(rows);
      setDrafts(Object.fromEntries(rows.map((monster) => [monster.code, monster])));
    } catch (e) {
      setError(e.message || TEXT.loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMonsters();
  }, []);

  function updateDraft(code, patch) {
    setDrafts((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        ...patch,
      },
    }));
  }

  async function persistDraft(code) {
    const draft = drafts[code];
    if (!draft) return null;

    const body = await apiFetch(`/admin/monsters/localization/${code}`, {
      method: "PUT",
      body: JSON.stringify({
        enabled: draft.enabled,
        koreanName: draft.koreanName,
        aliases: parseAliasText(draft.aliasesText),
      }),
    });

    return toEditableRow(body.data);
  }

  function applySavedRow(code, saved) {
    setMonsters((prev) => prev.map((monster) => (monster.code === code ? saved : monster)));
    setDrafts((prev) => ({
      ...prev,
      [code]: saved,
    }));
  }

  async function saveDraft(code) {
    try {
      setSavingCode(code);
      setError("");
      const saved = await persistDraft(code);
      if (saved) applySavedRow(code, saved);
    } catch (e) {
      setError(e.message || TEXT.saveError);
    } finally {
      setSavingCode("");
    }
  }

  const dirtyCodes = useMemo(
    () =>
      monsters
        .filter((monster) => {
          const draft = drafts[monster.code];
          return draft && getRowSignature(monster) !== getRowSignature(draft);
        })
        .map((monster) => monster.code),
    [drafts, monsters],
  );

  async function saveDirtyDrafts() {
    try {
      setSavingAll(true);
      setError("");

      for (const code of dirtyCodes) {
        const saved = await persistDraft(code);
        if (saved) applySavedRow(code, saved);
      }
    } catch (e) {
      setError(e.message || TEXT.saveError);
    } finally {
      setSavingAll(false);
    }
  }

  const rows = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return monsters
      .filter((monster) => {
        const draft = drafts[monster.code] ?? monster;
        if (variantFilter !== "ALL" && getVariantType(monster.code) !== variantFilter) {
          return false;
        }
        if (enabledFilter === "enabled" && draft.enabled === false) return false;
        if (enabledFilter === "disabled" && draft.enabled !== false) return false;
        if (attributeFilter !== "ALL" && monster.attribute !== attributeFilter) return false;
        if (
          awakeningFilter !== "ALL" &&
          String(monster.awakeningLevel ?? "OTHER") !== awakeningFilter
        ) {
          return false;
        }
        if (missingOnly && draft.enabled !== false && draft.koreanName?.trim()) {
          return false;
        }
        if (!keyword) return true;

        return [
          monster.code,
          monster.englishName,
          draft.koreanName,
          monster.attribute,
          draft.aliasesText,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      })
      .sort((a, b) => {
        const draftA = drafts[a.code] ?? a;
        const draftB = drafts[b.code] ?? b;
        const enabledCompare = Number(draftA.enabled === false) - Number(draftB.enabled === false);
        if (enabledCompare !== 0) return enabledCompare;
        return String(a.code).localeCompare(String(b.code));
      });
  }, [
    attributeFilter,
    awakeningFilter,
    drafts,
    enabledFilter,
    missingOnly,
    monsters,
    query,
    variantFilter,
  ]);

  const summary = useMemo(() => {
    const values = monsters.map((monster) => drafts[monster.code] ?? monster);
    const enabled = values.filter((monster) => monster.enabled !== false);
    const missingKoreanName = enabled.filter((monster) => !monster.koreanName?.trim());

    return {
      total: values.length,
      enabled: enabled.length,
      disabled: values.length - enabled.length,
      missingKoreanName: missingKoreanName.length,
      collab: monsters.filter((monster) => getVariantType(monster.code) === "collab").length,
      original: monsters.filter((monster) => getVariantType(monster.code) === "original").length,
    };
  }, [drafts, monsters]);

  function changeVariantFilter(nextFilter) {
    setVariantFilter(nextFilter);

    if (nextFilter === "original") {
      setEnabledFilter("ALL");
    }
  }

  return (
    <main className="space-y-4">
      <GuildApprovalPanel />

      <section className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{TEXT.title}</h2>
            <p className="text-sm text-gray-500">{TEXT.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadMonsters}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
            >
              {TEXT.refresh}
            </button>
            <button
              type="button"
              disabled={dirtyCodes.length === 0 || savingAll}
              onClick={saveDirtyDrafts}
              className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {savingAll
                ? TEXT.saving
                : dirtyCodes.length > 0
                  ? `${TEXT.saveChanges} (${dirtyCodes.length})`
                  : TEXT.noChanges}
            </button>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          <SummaryBox label={TEXT.total} value={summary.total} />
          <SummaryBox label={TEXT.enabled} value={summary.enabled} />
          <SummaryBox label={TEXT.disabled} value={summary.disabled} />
          <SummaryBox label={TEXT.missingKoreanName} value={summary.missingKoreanName} />
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          <VariantTabButton
            active={variantFilter === "ALL"}
            label={`${TEXT.allVariants} ${summary.total}`}
            onClick={() => changeVariantFilter("ALL")}
          />
          <VariantTabButton
            active={variantFilter === "collab"}
            label={`${TEXT.collab} ${summary.collab}`}
            onClick={() => changeVariantFilter("collab")}
          />
          <VariantTabButton
            active={variantFilter === "original"}
            label={`${TEXT.original} ${summary.original}`}
            onClick={() => changeVariantFilter("original")}
          />
        </div>

        <div className="grid gap-2 md:grid-cols-5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={TEXT.queryPlaceholder}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm md:col-span-2"
          />
          <select
            value={enabledFilter}
            onChange={(e) => setEnabledFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="enabled">{TEXT.enabledOnly}</option>
            <option value="disabled">{TEXT.disabledOnly}</option>
            <option value="ALL">{TEXT.total}</option>
          </select>
          <select
            value={attributeFilter}
            onChange={(e) => setAttributeFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="ALL">{TEXT.allAttributes}</option>
            {Object.entries(ATTRIBUTE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={awakeningFilter}
            onChange={(e) => setAwakeningFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="ALL">{TEXT.allAwakening}</option>
            <option value="0">{TEXT.unawakened}</option>
            <option value="1">{TEXT.firstAwakened}</option>
            <option value="2">{TEXT.secondAwakened}</option>
            <option value="OTHER">{TEXT.other}</option>
          </select>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={missingOnly}
            onChange={(e) => setMissingOnly(e.target.checked)}
          />
          {TEXT.missingOnly}
        </label>
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm text-gray-600">
          <span>{loading ? TEXT.loading : `${rows.length}${TEXT.countSuffix}`}</span>
          {dirtyCodes.length > 0 && (
            <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
              {TEXT.saveChanges} {dirtyCodes.length}
            </span>
          )}
        </div>

        <div className="max-h-[620px] overflow-auto">
          <table className="min-w-[1180px] text-left text-sm">
            <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">{TEXT.action}</th>
                <th className="px-3 py-2">{TEXT.display}</th>
                <th className="px-3 py-2">{TEXT.image}</th>
                <th className="px-3 py-2">{TEXT.code}</th>
                <th className="px-3 py-2">{TEXT.attribute}</th>
                <th className="px-3 py-2">{TEXT.awakening}</th>
                <th className="px-3 py-2">{TEXT.koreanName}</th>
                <th className="px-3 py-2">{TEXT.englishName}</th>
                <th className="px-3 py-2">{TEXT.aliases}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((monster) => {
                const draft = drafts[monster.code] ?? monster;
                const dirty = getRowSignature(monster) !== getRowSignature(draft);

                return (
                  <tr key={monster.code} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-3 py-2">
                      <button
                        type="button"
                        disabled={!dirty || savingCode === monster.code || savingAll}
                        onClick={() => saveDraft(monster.code)}
                        className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {savingCode === monster.code ? TEXT.saving : dirty ? TEXT.save : TEXT.saved}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={draft.enabled !== false}
                        onChange={(e) => updateDraft(monster.code, { enabled: e.target.checked })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      {monster.imageUrl ? (
                        <img
                          src={monster.imageUrl}
                          alt={draft.koreanName || monster.englishName || monster.code}
                          className="h-11 w-11 rounded border border-gray-200 bg-gray-50 object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-11 w-11 items-center justify-center rounded border border-gray-200 bg-gray-50 text-xs text-gray-400">
                          {TEXT.none}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">{monster.code}</td>
                    <td className="px-3 py-2">
                      {ATTRIBUTE_LABELS[monster.attribute] ?? monster.attribute ?? "-"}
                    </td>
                    <td className="px-3 py-2">{getAwakeningLabel(monster.awakeningLevel)}</td>
                    <td className="px-3 py-2">
                      <input
                        value={draft.koreanName}
                        onChange={(e) => updateDraft(monster.code, { koreanName: e.target.value })}
                        className="w-36 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-gray-700">{monster.englishName}</td>
                    <td className="px-3 py-2">
                      <textarea
                        value={draft.aliasesText}
                        onChange={(e) => updateDraft(monster.code, { aliasesText: e.target.value })}
                        className="h-16 w-80 rounded-md border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function SummaryBox({ label, value }) {
  return (
    <div className="rounded-md bg-gray-50 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function VariantTabButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm ${
        active
          ? "border-blue-500 bg-blue-50 font-semibold text-blue-700"
          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

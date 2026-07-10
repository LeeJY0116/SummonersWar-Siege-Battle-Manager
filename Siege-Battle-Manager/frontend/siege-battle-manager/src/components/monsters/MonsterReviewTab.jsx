import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api.js";

const TEXT = {
  title: "\uBAAC\uC2A4\uD130 \uAD00\uB9AC",
  description:
    "\uAD00\uB9AC \uD30C\uC77C\uC758 \uD55C\uAE00\uBA85, \uBCC4\uCE6D, \uD45C\uC2DC \uC5EC\uBD80\uB97C \uC218\uC815\uD569\uB2C8\uB2E4.",
  refresh: "\uC0C8\uB85C\uACE0\uCE68",
  saveChanges: "\uBCC0\uACBD \uB0B4\uC6A9 \uC800\uC7A5",
  saving: "\uC800\uC7A5 \uC911",
  saved: "\uC800\uC7A5\uB428",
  save: "\uC800\uC7A5",
  noChanges: "\uC800\uC7A5\uD560 \uBCC0\uACBD \uC5C6\uC74C",
  loadError: "\uBAAC\uC2A4\uD130 \uAD00\uB9AC \uBAA9\uB85D\uC744 \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
  saveError: "\uBAAC\uC2A4\uD130 \uAD00\uB9AC \uC815\uBCF4\uB97C \uC800\uC7A5\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.",
  queryPlaceholder: "\uC774\uB984, \uCF54\uB4DC, \uBCC4\uCE6D \uAC80\uC0C9",
  total: "\uC804\uCCB4",
  enabled: "\uD45C\uC2DC",
  disabled: "\uC228\uAE40",
  missingKoreanName: "\uD55C\uAE00\uBA85 \uB204\uB77D",
  enabledOnly: "\uD45C\uC2DC\uB9CC",
  disabledOnly: "\uC228\uAE40\uB9CC",
  allAttributes: "\uC804\uCCB4 \uC18D\uC131",
  allAwakening: "\uC804\uCCB4 \uAC01\uC131",
  missingOnly: "\uD45C\uC2DC \uB300\uC0C1 \uC911 \uD55C\uAE00\uBA85\uC774 \uBE44\uC5B4 \uC788\uB294 \uBAAC\uC2A4\uD130\uB9CC \uBCF4\uAE30",
  loading: "\uBD88\uB7EC\uC624\uB294 \uC911",
  countSuffix: "\uAC1C \uD45C\uC2DC",
  display: "\uD45C\uC2DC",
  image: "\uC774\uBBF8\uC9C0",
  code: "\uCF54\uB4DC",
  attribute: "\uC18D\uC131",
  awakening: "\uAC01\uC131",
  koreanName: "\uD55C\uAE00\uBA85",
  englishName: "\uC6D0\uBB38\uBA85",
  aliases: "\uBCC4\uCE6D",
  action: "\uC800\uC7A5",
  none: "\uC5C6\uC74C",
  unawakened: "\uBE44\uAC01\uC131",
  firstAwakened: "1\uAC01",
  secondAwakened: "2\uAC01",
  other: "\uAE30\uD0C0",
};

const ATTRIBUTE_LABELS = {
  FIRE: "\uBD88",
  WATER: "\uBB3C",
  WIND: "\uD48D",
  LIGHT: "\uBE5B",
  DARK: "\uC554",
};

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
  }, [attributeFilter, awakeningFilter, drafts, enabledFilter, missingOnly, monsters, query]);

  const summary = useMemo(() => {
    const values = monsters.map((monster) => drafts[monster.code] ?? monster);
    const enabled = values.filter((monster) => monster.enabled !== false);
    const missingKoreanName = enabled.filter((monster) => !monster.koreanName?.trim());

    return {
      total: values.length,
      enabled: enabled.length,
      disabled: values.length - enabled.length,
      missingKoreanName: missingKoreanName.length,
    };
  }, [drafts, monsters]);

  return (
    <main className="space-y-4">
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

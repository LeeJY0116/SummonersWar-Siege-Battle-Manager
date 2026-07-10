import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api.js";

const ATTRIBUTE_LABELS = {
  FIRE: "불",
  WATER: "물",
  WIND: "풍",
  LIGHT: "빛",
  DARK: "암",
};

function getAwakeningLevel(code) {
  if (!code?.startsWith?.("sw_")) return null;

  const id = Number(code.slice(3));
  const suffix = id % 100;

  if (suffix >= 1 && suffix <= 5) return 0;
  if (suffix >= 11 && suffix <= 15) return 1;
  if (suffix >= 31 && suffix <= 35) return 2;

  return null;
}

function getAwakeningLabel(level) {
  if (level === 0) return "비각성";
  if (level === 1) return "1각";
  if (level === 2) return "2각";
  return "기타";
}

function normalizeAliases(aliases) {
  if (Array.isArray(aliases)) return aliases;
  if (!aliases) return [];
  return String(aliases)
    .split(",")
    .map((alias) => alias.trim())
    .filter(Boolean);
}

export default function MonsterReviewTab() {
  const [monsters, setMonsters] = useState([]);
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
      const body = await apiFetch("/monsters");
      setMonsters(body.data ?? []);
    } catch (e) {
      setError(e.message || "몬스터 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMonsters();
  }, []);

  const rows = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return monsters
      .map((monster) => ({
        ...monster,
        aliases: normalizeAliases(monster.aliases),
        awakeningLevel: getAwakeningLevel(monster.code),
      }))
      .filter((monster) => {
        if (enabledFilter === "enabled" && monster.enabled === false) return false;
        if (enabledFilter === "disabled" && monster.enabled !== false) return false;
        if (attributeFilter !== "ALL" && monster.attribute !== attributeFilter) return false;
        if (
          awakeningFilter !== "ALL" &&
          String(monster.awakeningLevel ?? "OTHER") !== awakeningFilter
        ) {
          return false;
        }
        if (missingOnly && monster.enabled !== false && monster.koreanName?.trim()) {
          return false;
        }
        if (!keyword) return true;

        return [
          monster.code,
          monster.name,
          monster.koreanName,
          monster.attribute,
          ...monster.aliases,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      })
      .sort((a, b) => {
        const enabledCompare = Number(a.enabled === false) - Number(b.enabled === false);
        if (enabledCompare !== 0) return enabledCompare;
        return String(a.code).localeCompare(String(b.code));
      });
  }, [attributeFilter, awakeningFilter, enabledFilter, missingOnly, monsters, query]);

  const summary = useMemo(() => {
    const enabled = monsters.filter((monster) => monster.enabled !== false);
    const missingKoreanName = enabled.filter((monster) => !monster.koreanName?.trim());

    return {
      total: monsters.length,
      enabled: enabled.length,
      disabled: monsters.length - enabled.length,
      missingKoreanName: missingKoreanName.length,
    };
  }, [monsters]);

  return (
    <main className="space-y-4">
      <section className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">몬스터 검수</h2>
            <p className="text-sm text-gray-500">
              DB에 반영된 몬스터 이미지, 이름, 별칭, 표시 여부를 확인합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={loadMonsters}
            className="self-start rounded-md border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 md:self-auto"
          >
            새로고침
          </button>
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          <SummaryBox label="전체" value={summary.total} />
          <SummaryBox label="표시" value={summary.enabled} />
          <SummaryBox label="숨김" value={summary.disabled} />
          <SummaryBox label="한글명 누락" value={summary.missingKoreanName} />
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-2 md:grid-cols-5">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름, 코드, 별칭 검색"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm md:col-span-2"
          />
          <select
            value={enabledFilter}
            onChange={(e) => setEnabledFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="enabled">표시만</option>
            <option value="disabled">숨김만</option>
            <option value="ALL">전체</option>
          </select>
          <select
            value={attributeFilter}
            onChange={(e) => setAttributeFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="ALL">전체 속성</option>
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
            <option value="ALL">전체 각성</option>
            <option value="0">비각성</option>
            <option value="1">1각</option>
            <option value="2">2각</option>
            <option value="OTHER">기타</option>
          </select>
        </div>

        <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={missingOnly}
            onChange={(e) => setMissingOnly(e.target.checked)}
          />
          표시 대상 중 한글명이 비어 있는 몬스터만 보기
        </label>
      </section>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-4 py-3 text-sm text-gray-600">
          {loading ? "불러오는 중" : `${rows.length}개 표시`}
        </div>

        <div className="max-h-[620px] overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">상태</th>
                <th className="px-3 py-2">이미지</th>
                <th className="px-3 py-2">코드</th>
                <th className="px-3 py-2">속성</th>
                <th className="px-3 py-2">각성</th>
                <th className="px-3 py-2">표시명</th>
                <th className="px-3 py-2">영문명</th>
                <th className="px-3 py-2">별칭</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((monster) => (
                <tr key={monster.code} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        monster.enabled === false
                          ? "bg-gray-100 text-gray-500"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {monster.enabled === false ? "숨김" : "표시"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {monster.imageUrl ? (
                      <img
                        src={monster.imageUrl}
                        alt={monster.koreanName || monster.name || monster.code}
                        className="h-11 w-11 rounded border border-gray-200 bg-gray-50 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-11 w-11 items-center justify-center rounded border border-gray-200 bg-gray-50 text-xs text-gray-400">
                        없음
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                    {monster.code}
                  </td>
                  <td className="px-3 py-2">
                    {ATTRIBUTE_LABELS[monster.attribute] ?? monster.attribute ?? "-"}
                  </td>
                  <td className="px-3 py-2">{getAwakeningLabel(monster.awakeningLevel)}</td>
                  <td className="px-3 py-2 font-medium">
                    {monster.koreanName || <span className="text-red-500">미입력</span>}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{monster.name}</td>
                  <td className="max-w-md px-3 py-2 text-gray-600">
                    {monster.aliases.length > 0 ? monster.aliases.join(", ") : "-"}
                  </td>
                </tr>
              ))}
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

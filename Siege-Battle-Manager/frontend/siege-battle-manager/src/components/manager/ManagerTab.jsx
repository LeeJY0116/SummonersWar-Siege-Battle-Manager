import React, { useMemo, useState } from "react";
import MonsterSelect from "../monsters/MonsterSelect.jsx";
import TrioSlot from "../trios/TrioSlot.jsx";

const LEADER_EFFECT_OPTIONS = [
  "효과적중",
  "공격속도",
  "공격력",
  "체력",
  "방어력",
  "효과저항",
  "치명타 확률",
  "치명타 피해",
];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("이미지 읽기 실패"));
    reader.readAsDataURL(file);
  });
}

export default function ManagerTab({
  monsters,
  trios,
  onCreateMonster,
  onCreateTrio,
  onDeleteTrio,
  onChangeCount,
  onReorderLeader,
}) {
  // 폼 상태
  const [newMonsterName, setNewMonsterName] = useState("");
  const [newMonsterIcon, setNewMonsterIcon] = useState(null);

  const [newTrioName, setNewTrioName] = useState("");
  const [newTrioIcon, setNewTrioIcon] = useState(null);
  const [sel1, setSel1] = useState("");
  const [sel2, setSel2] = useState("");
  const [sel3, setSel3] = useState("");

  // 필터 상태
  const [leaderFilter, setLeaderFilter] = useState("");
  const [containsAnyOf, setContainsAnyOf] = useState([]);
  const [nameQuery, setNameQuery] = useState("");
  const [fourStarDefenseOnly, setFourStarDefenseOnly] = useState(false);

  // 리더 상태
  const [newMonsterLeaderType, setNewMonsterLeaderType] = useState("none");
  const [newMonsterLeaderText, setNewMonsterLeaderText] = useState("");

  const monsterMap = useMemo(() => {
    const m = new Map();
    monsters.forEach((x) => m.set(x.id, x));
    return m;
  }, [monsters]);

  const filteredTrios = useMemo(() => {
    return trios.filter((t) => {
      // 1) 리더 필터
      if (leaderFilter) {
        const leaderMonster = monsterMap.get(t.monsterIds[0]); // 리더 몬스터
        if (!leaderMonster || leaderMonster.leaderEffectType !== leaderFilter) {
            return false;
        }
      } 

      // 2) 포함 필터
      if (containsAnyOf.length > 0) {
        const hasAny = t.monsterIds.some((mid) => containsAnyOf.includes(mid));
        if (!hasAny) return false;
      }

      // 3) 4성 방덱 토글 : 조합에 5성이 하나라도 있으면 제외
      if (fourStarDefenseOnly){
        const allWithinLimit = t.monsterIds.every((mid) => {
          const m = monsterMap.get(mid);
          if (!m || m.grade == null) {
            // grade 없는 몬스터는 일단 통과 (원하면 false로 바꿔도 됨)
            return true;
          }
          return m.grade < 5;
        });
        if (!allWithinLimit) return false;
      }

      // 4) 이름/몬스터 검색 필터
      if (nameQuery.trim()) {
        const q = nameQuery.trim().toLowerCase();
        const name = (t.name || "").toLowerCase();
        const monsterNames = t.monsterIds
          .map((id) => (monsterMap.get(id)?.name || "").toLowerCase())
          .join(" ");
        if (!name.includes(q) && !monsterNames.includes(q)) return false;
      }

      return true;
    });
  }, [trios, leaderFilter, containsAnyOf, nameQuery, monsterMap, fourStarDefenseOnly]);

  // 몬스터 추가
  async function handleAddMonster(e) {
    e.preventDefault();
    const name = newMonsterName.trim();
    if (!name) return;

  // "리더 효과 없음" 이면 타입은 null로 넘김
  const leaderEffectType =
    newMonsterLeaderType === "none" ? null : newMonsterLeaderType;

  const leaderEffectText =
    leaderEffectType && newMonsterLeaderText.trim()
      ? newMonsterLeaderText.trim()
      : "";

    onCreateMonster({
      name,
      iconDataUrl: newMonsterIcon || null,
      leaderEffectType,
      leaderEffectText,
    });

    // 폼 초기화
    setNewMonsterName("");
    setNewMonsterIcon(null);
    setNewMonsterLeaderType("none");
    setNewMonsterLeaderText("");
  }

  async function onPickMonsterIcon(ev) {
    const f = ev.target.files?.[0];
    if (!f) return;
    const dataUrl = await fileToDataUrl(f);
    setNewMonsterIcon(dataUrl);
  }

  // 3마리 조합 추가(매니저 탭)
  async function handleAddTrio(e) {
    e.preventDefault();
    if (!sel1 || !sel2 || !sel3) return;
    if (new Set([sel1, sel2, sel3]).size !== 3) {
      alert("서로 다른 3마리를 선택해주세요.");
      return;
    }

    onCreateTrio({
      monsterIds: [sel1, sel2, sel3],
      name: newTrioName.trim(),
      iconDataUrl: newTrioIcon || null,
    });

    setNewTrioName("");
    setNewTrioIcon(null);
    setSel1("");
    setSel2("");
    setSel3("");
  }

  async function onPickTrioIcon(ev) {
    const f = ev.target.files?.[0];
    if (!f) return;
    const dataUrl = await fileToDataUrl(f);
    setNewTrioIcon(dataUrl);
  }

  function handleDeleteMonster(id) {
    if (
      !window.confirm(
        "이 몬스터를 삭제할까요? 관련된 조합도 함께 삭제됩니다."
      )
    )
      return;
    onDeleteMonster(id);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* LEFT COLUMN */}
      <div className="md:col-span-1 flex flex-col gap-6">
        {/* 몬스터 추가 */}
        <section className="bg-white rounded-2xl shadow p-4 md:p-5">
          <h2 className="text-lg font-bold mb-3">몬스터 추가</h2>
          <form className="flex flex-col gap-3" onSubmit={handleAddMonster}>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">이름</span>
              <input
                className="px-3 py-2 rounded-xl border border-gray-200 shadow-sm"
                placeholder="예) 예니퍼"
                value={newMonsterName}
                onChange={(e) => setNewMonsterName(e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">
                아이콘 (작은 이미지)
              </span>
              <input type="file" accept="image/*" onChange={onPickMonsterIcon} />
              {newMonsterIcon && (
                <img
                  src={newMonsterIcon}
                  alt="미리보기"
                  className="w-10 h-10 mt-1 rounded"
                />
              )}
            </label>

            {/* 리더 효과 타입 선택 */}
            <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
                리더 효과 타입 (선택)
            </span>
            <select
                className="px-3 py-2 rounded-xl border border-gray-200 shadow-sm bg-white text-sm"
                value={newMonsterLeaderType}
                onChange={(e) => setNewMonsterLeaderType(e.target.value)}
            >
                <option value="none">리더 효과 없음</option>
                {LEADER_EFFECT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
                ))}
            </select>
            </label>

            {/* 리더 효과 상세 설명 */}
            <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
                리더 효과 상세 설명 (선택)
            </span>
            <textarea
                className="px-3 py-2 rounded-xl border border-gray-200 shadow-sm text-sm resize-none h-16"
                placeholder="예) 길드전 아군 몬스터의 방어력 21% 증가"
                value={newMonsterLeaderText}
                onChange={(e) => setNewMonsterLeaderText(e.target.value)}
                disabled={newMonsterLeaderType === "none"}
            />
            <span className="text-[11px] text-gray-400">
                * 리더 효과 타입을 선택하면 카드에 이 문장이 표시됩니다.
            </span>
            </label>

            {/* 추가 버튼 */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-2xl bg-gray-900 text-white shadow hover:opacity-90"
              >
                추가
              </button>
            </div>
          </form>
        </section>

        {/* 필터 */}
        <section className="bg-white rounded-2xl shadow p-4 md:p-5">
          <h2 className="text-lg font-bold mb-3">필터</h2>

          <div className="grid grid-cols-1 gap-3">
            {/* 리더 필터 */}
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">
                리더로 필터링
              </span>
              <select
                className="px-3 py-2 rounded-xl border border-gray-200 shadow-sm bg-white"
                value={leaderFilter}
                onChange={(e) => setLeaderFilter(e.target.value)}
              >
                <option value="">(전체)</option>
                {LEADER_EFFECT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>

            {/* 포함 필터 */}
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">
                다음 중 하나 이상 포함
              </span>
              <div className="flex flex-wrap gap-2">
                {monsters.map((m) => {
                  const active = containsAnyOf.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`px-3 py-1 rounded-full border shadow-sm text-sm ${
                        active ? "bg-gray-900 text-white" : "bg-white border-gray-200"
                      }`}
                      onClick={() =>
                        setContainsAnyOf((prev) =>
                          prev.includes(m.id)
                            ? prev.filter((x) => x !== m.id)
                            : [...prev, m.id]
                        )
                      }
                    >
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </label>

            {/* 검색 */}
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">
                이름/몬스터 검색
              </span>
              <input
                className="px-3 py-2 rounded-xl border border-gray-200 shadow-sm"
                placeholder="예) 예니퍼"
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
              />
            </label>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => setLeaderFilter("")}
                className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm"
              >
                리더 필터 초기화
              </button>
              <button
                type="button"
                onClick={() => setContainsAnyOf([])}
                className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm"
              >
                포함 필터 초기화
              </button>
              <button
                type="button"
                onClick={() => setNameQuery("")}
                className="px-3 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm"
              >
                검색 초기화
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* RIGHT COLUMN: 조합 목록 */}
      <div className="md:col-span-2">
        <section className="bg-white rounded-2xl shadow p-4 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">조합 목록</h2>
            {/* 4성 방덱 토글 버튼 */}
            <button
            type="button"
            onClick={() =>
                setFourStarDefenseOnly((prev) => !prev)
            }
            className={
                "px-3 py-1 rounded-full text-xs font-semibold border transition " +
                (fourStarDefenseOnly
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100")
            }
            >
            4성 방덱
                </button>
            <span className="text-sm text-gray-600">
              {filteredTrios.length}개 표시
            </span>
          </div>

          {filteredTrios.length === 0 ? (
            <p className="text-sm text-gray-600">
              조건에 맞는 조합이 없습니다. 필터를 조정해보세요.
            </p>
          ) : (
            <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTrios.map((t) => {
                const leaderId = t.monsterIds[0];
                const m1 = monsterMap.get(t.monsterIds[0]);
                const m2 = monsterMap.get(t.monsterIds[1]);
                const m3 = monsterMap.get(t.monsterIds[2]);
                const leaderMonster = m1; // 현재 리더 몬스터

                return (
                  <li
                    key={t.id}
                    className="border border-gray-200 rounded-2xl p-4 shadow-sm bg-white"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex flex-col">
                        <div className="font-bold text-base">
                          {t.name || "점령전 조합"}
                        </div>
                        
                        {leaderMonster?.leaderEffectText && (
                            <div className="mt-1 text-[10px] text-blue-700">
                                리더 효과 : {leaderMonster.leaderEffectText}
                            </div> 
                        )}
                      </div>
                      <button
                        className="px-2 py-1 text-xs rounded-xl bg-gray-100 hover:bg-gray-200"
                        onClick={() => onDeleteTrio(t.id)}
                      >
                        삭제
                      </button>
                    </div>

                    {/* 슬롯 3개 */}
                    <div className="flex items-center gap-2">
                      <TrioSlot monster={m1} isLeader size="md" />
                      <TrioSlot monster={m2} size="md" />
                      <TrioSlot monster={m3} size="md" />
                    </div>

                    {/* 리더 바꾸기 - 이미지 */}
                    <div className="mt-3 text-xs text-gray-600 flex items-center gap-2">
                      <span>리더 바꾸기:</span>
                      <div className="flex gap-1">
                        {t.monsterIds.map((mid) => {
                          const m = monsterMap.get(mid);
                          return (
                            <button
                              key={mid}
                              type="button"
                              className={`w-7 h-7 rounded-full border ${
                                mid === leaderId
                                  ? "border-yellow-400 ring-2 ring-yellow-300"
                                  : "border-gray-200"
                              } overflow-hidden bg-gray-100 flex items-center justify-center`}
                              onClick={() => onReorderLeader(t.id, mid)}
                            >
                              {m?.iconDataUrl ? (
                                <img
                                  src={m.iconDataUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 카운터 */}
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
                        onClick={() => onChangeCount(t.id, -1)}
                        aria-label="decrement"
                      >
                        -
                      </button>
                      <div className="min-w-[3rem] text-center font-bold">
                        {t.count || 0}
                      </div>
                      <button
                        className="px-3 py-2 rounded-xl bg-gray-900 text-white hover:opacity-90"
                        onClick={() => onChangeCount(t.id, +1)}
                        aria-label="increment"
                      >
                        +
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

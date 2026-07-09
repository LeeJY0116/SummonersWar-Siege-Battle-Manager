import React, { useEffect, useRef, useState } from "react";
import HeaderBar from "./components/layout/HeaderBar.jsx";
import FooterBar from "./components/layout/FooterBar.jsx";
import ManagerTab from "./components/manager/ManagerTab.jsx";
import SiegeBattleTab from "./components/siege/SiegeBattleTab.jsx";
import defaultMonsters from "./data/defaultMonsters.json";
import { fetchMyGuild, createGuild, fetchMyGuildMembers } from "./lib/guild.js";
import LoginPage from "./components/auth/LoginPage.jsx";
import SignupPage from "./components/auth/SignupPage.jsx";
import GuildTab from "./components/guild/GuildTab.jsx";
import { apiFetch } from "./lib/api.js";


const ALL_DEFAULT_MONSTERS = [
  ...defaultMonsters.fire,
  ...defaultMonsters.water,
  ...defaultMonsters.wind,
  ...defaultMonsters.light,
  ...defaultMonsters.dark,
];



const STORAGE_KEY = "siege-battle-manager@v1";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function loadInitialMonsters() {
  return ALL_DEFAULT_MONSTERS;
}

function normalizeBackendMonster(monster) {
  const monsterCode = monster.code ?? monster.monsterCode ?? String(monster.id);

  return {
    id: monsterCode,
    monsterCode,
    backendId: monster.id,
    name: monster.name,
    element: monster.attribute?.toLowerCase?.() ?? monster.element ?? "",
    attribute: monster.attribute,
    grade: monster.naturalStars ?? monster.grade ?? null,
    naturalStars: monster.naturalStars ?? null,
    iconDataUrl: monster.imageUrl ?? monster.iconDataUrl ?? null,
    imageUrl: monster.imageUrl ?? null,
    leaderEffectType: monster.leaderEffectType ?? null,
    leaderEffectText: monster.leaderEffectText ?? "",
    nicknames: monster.nicknames ?? [],
    isDefault: true,
  };
}

function normalizeLocalMonster(monster) {
  const monsterCode = monster.monsterCode ?? monster.code ?? monster.id;

  return {
    ...monster,
    id: monsterCode,
    monsterCode,
    imageUrl: monster.imageUrl ?? monster.iconDataUrl ?? null,
    iconDataUrl: monster.iconDataUrl ?? monster.imageUrl ?? null,
  };
}

async function loadBackendMonsters() {
  const body = await apiFetch("/monsters");
  return (body.data ?? []).map(normalizeBackendMonster);
}

export default function SiegeBattleManager() {
  const [activeTab, setActiveTab] = useState("manager");
  const [monsters, setMonsters] = useState(loadInitialMonsters());
  const [trios, setTrios] = useState([]);
  const importRef = useRef(null);
  const [guild, setGuild] = useState(null);
  const [members, setMembers] = useState([]);
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    document.title = "Siege-Battle-Manager";
  }, []);


  // 로그인
// 로그인
  const token = localStorage.getItem("accessToken");

  if (!token) {
    if (authMode === "signup") {
      return (
        <SignupPage
          onBackToLogin={() => setAuthMode("login")}
        />
      );
    }

    return (
      <LoginPage
        onGoSignup={() => setAuthMode("signup")}
      />
    );
  }

  useEffect(() => {
    if (!token) return;
  
  // if (!token) {
    // window.location.href = "/login"; 라우터 만들 때 주석 해제
  // }

  fetchMyGuild()
  .then(setGuild)
  .catch(() => setGuild(null));
}, [token]);


  // 길드 멤버 로드

  useEffect(() => {
  if (!guild) return;

  fetchMyGuildMembers()
  .then(setMembers)
  .catch(() => setMembers([]));
}, [guild]);

  useEffect(() => {
    loadBackendMonsters()
      .then((loadedMonsters) => {
        if (loadedMonsters.length > 0) {
          setMonsters(loadedMonsters);
        }
      })
      .catch((e) => {
        console.warn("Failed to load backend monsters", e);
      });
  }, []);


  // 로컬 스토리지 로드

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
    // 🆕 처음 실행하는 사용자 → 기본 몬스터 자동 등록
    loadMonsters().then((ms) => {
      setMonsters(ms);
      setTrios([]);
    });
    return;
    } 

    try {
      const parsed = JSON.parse(raw);
      const loadedMonsters =
      parsed.monsters && parsed.monsters.length > 0
        ? parsed.monsters
        : ALL_DEFAULT_MONSTERS;

        setMonsters(loadedMonsters);
        setTrios(parsed.trios || []);
      } catch (e) {
        console.warn("Failed to parse saved data", e);
        setMonsters(ALL_DEFAULT_MONSTERS);
        setTrios([]);
      }
  }, []);

  // 로컬 스토리지 저장
  useEffect(() => {
    const payload = JSON.stringify({ monsters, trios });
    localStorage.setItem(STORAGE_KEY, payload);
  }, [monsters, trios]);

  // 백엔드 연동할 때 사용
  const USE_BACKEND = false; // 나중에 true로 바꾸면 API 사용

async function fetchMonstersFromBackend() {
  const res = await fetch("http://localhost:8080/api/monsters");
  const body = await res.json();
  return body.data; // ApiResponse라면
}

async function loadMonsters() {
  if (!USE_BACKEND) return ALL_DEFAULT_MONSTERS;
  try {
    return await fetchMonstersFromBackend();
  } catch (e) {
    console.warn("API failed, fallback to default JSON", e);
    return ALL_DEFAULT_MONSTERS;
  }
}


  // ------- 몬스터 / 조합 CRUD 로직 -------

  function handleCreateMonster({
    name,
    iconDataUrl,
    leaderEffectType,
    leaderEffectText,
}) {
    setMonsters((prev) => [
      ...prev,
      { 
        id: uid(),
        name, 
        iconDataUrl: iconDataUrl || null,
        leaderEffectType: leaderEffectType || null,
        leaderEffectText: leaderEffectText || "",
        isDefault: false, // 사용자가 직접 추가한 몬스터
      },
    ]);
  }

  function handleDeleteMonster(id) {
    setMonsters((prev) => {
      const target = prev.find((m) => m.id === id);
      if (target?.isDefault) {
        // 기본 몬스터는 삭제 허용 안 함 (이중 안전장치)
        alert("직접 추가한 몬스터만 삭제 가능합니다.");
        return prev;
      }
      return prev.filter((m) => m.id !== id);
    });

    setTrios((prev) => prev.filter((t) => !t.monsterIds.includes(id)));
  }

  function handleCreateTrio({ monsterIds, name, iconDataUrl }) {
    setTrios((prev) => [
      {
        id: uid(),
        monsterIds,
        name: name?.trim() || "",
        iconDataUrl: iconDataUrl || null,
        count: 0,
      },
      ...prev,
    ]);
  }

  function handleCreateTrioFromSiege(monsterIds, name) {
    handleCreateTrio({
      monsterIds,
      name: name?.trim() || "점령전 조합",
      iconDataUrl: null,
    });
  }

  function handleDeleteTrio(id) {
    setTrios((prev) => prev.filter((t) => t.id !== id));
  }

  function handleChangeCount(id, delta) {
    setTrios((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, count: Math.max(0, (t.count || 0) + delta) }
          : t
      )
    );
  }

  function handleReorderLeader(trioId, newLeaderMonsterId) {
    setTrios((prev) =>
      prev.map((t) => {
        if (t.id !== trioId) return t;
        const ids = t.monsterIds.filter((x) => x !== newLeaderMonsterId);
        return { ...t, monsterIds: [newLeaderMonsterId, ...ids] };
      })
    );
  }

  // 길드 생성 로직

  async function handleCreateGuild() {
  const name = prompt("길드 이름을 입력하세요");
  if (!name || !name.trim()) return;

  // 생성 후 다시 내 길드 조회해서 화면 반영
  try {
    const created = await createGuild(name.trim(), "");
    console.log("createGuild response data:", created);

    // ✅ 1) 생성 응답에 길드 정보가 오면 그걸로 바로 setGuild
    // (네 백엔드는 GuildResponse를 바로 반환하니까 이게 가장 간단)
    setGuild(created);

    // ✅ 2) 멤버는 API 구현 후에 로드
    // const ms = await fetchMyGuildMembers();
    // setMembers(ms);
  } catch (e) {
    console.error("create guild failed:", e);
    alert(e.message || "길드 생성 실패");
    setGuild(null);
  }
}


  // ------- Import / Export -------

  function handleExport() {
    const data = { monsters, trios, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `siege_battle_manager_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.monsters) || !Array.isArray(data.trios)) {
        alert("유효한 설정 파일이 아닙니다.");
        return;
      }
      setMonsters(data.monsters);
      setTrios(data.trios);
    } catch (e) {
      console.error(e);
      alert("설정 파일을 불러오는 중 오류가 발생했습니다.");
    }
  }

  function handleClickImport() {
    importRef.current?.click();
  }

  // ---------------- 렌더 ----------------
  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        <HeaderBar
          guild={guild}
          members={members}
          onCreateGuild={handleCreateGuild}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onClickImport={handleClickImport}
          onClickExport={handleExport}
          importInputRef={importRef}
          onImportFile={handleImportFile}
        />

        {activeTab === "manager" ? (
          <ManagerTab
            monsters={monsters}
            trios={trios}
            onCreateMonster={handleCreateMonster}
            onCreateTrio={handleCreateTrio}
            onDeleteTrio={handleDeleteTrio}
            onChangeCount={handleChangeCount}
            onReorderLeader={handleReorderLeader}
          />
        ) : activeTab === "siege" ?(
          <SiegeBattleTab
            monsters={monsters}
            onSaveTrio={handleCreateTrioFromSiege}
            onDeleteMonster={handleDeleteMonster}
          />
        ) : (
          <GuildTab guild={guild} members={members} monsters={monsters} />
        )}

        <FooterBar />
      </div>
    </div>
  );
}

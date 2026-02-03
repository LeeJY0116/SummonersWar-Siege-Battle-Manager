import React, { useEffect, useRef, useState } from "react";
import HeaderBar from "./components/layout/HeaderBar.jsx";
import FooterBar from "./components/layout/FooterBar.jsx";
import ManagerTab from "./components/manager/ManagerTab.jsx";
import SiegeBattleTab from "./components/siege/SiegeBattleTab.jsx";
import defaultMonsters from "./data/defaultMonsters.json";
import { fetchMyGuild } from "./lib/guild.js";
import LoginPage from "./pages/LoginPage.jsx";


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

export default function SiegeBattleManager() {
  const [activeTab, setActiveTab] = useState("manager");
  const [monsters, setMonsters] = useState(loadInitialMonsters());
  const [trios, setTrios] = useState([]);
  const importRef = useRef(null);
  const [guild, setGuild] = useState(null);

  useEffect(() => {
    document.title = "Siege-Battle-Manager";
  }, []);


  // 로그인
  const token = localStorage.getItem("accessToken");
  if (!token) return <LoginPage />;

  useEffect(() => {
    if (!token) return;
  
  // if (!token) {
    // window.location.href = "/login"; 라우터 만들 때 주석 해제
  // }

  fetchMyGuild()
  .then(setGuild)
  .catch(() => setGuild(null));
}, [token]);


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
        ) : (
          <SiegeBattleTab
            monsters={monsters}
            onSaveTrio={handleCreateTrioFromSiege}
            onDeleteMonster={handleDeleteMonster}
          />
        )}

        <FooterBar />
      </div>
    </div>
  );
}

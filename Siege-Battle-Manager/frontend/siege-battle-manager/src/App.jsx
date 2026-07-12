import React, { useEffect, useState } from "react";
import HeaderBar from "./components/layout/HeaderBar.jsx";
import FooterBar from "./components/layout/FooterBar.jsx";
import ManagerTab from "./components/manager/ManagerTab.jsx";
import MonsterReviewTab from "./components/monsters/MonsterReviewTab.jsx";
import SiegeBattleTab from "./components/siege/SiegeBattleTab.jsx";
import { fetchMyGuild, fetchMyGuildMembers } from "./lib/guild.js";
import LoginPage from "./components/auth/LoginPage.jsx";
import { fetchMe } from "./lib/auth.js";
import GuildTab from "./components/guild/GuildTab.jsx";
import { apiFetch } from "./lib/api.js";
import { applyMonsterLocalization, syncSwarfarmMonsters } from "./lib/monsterSync.js";
import { formatLeaderEffectText } from "./lib/monsterLabels.js";


const STORAGE_KEY = "siege-battle-manager@v1";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function resolveMonsterImageUrl(monster) {
  const imageUrl = monster.imageUrl ?? monster.iconDataUrl ?? null;

  if (imageUrl?.startsWith("/monsters/")) {
    return null;
  }

  return imageUrl;
}

function normalizeBackendMonster(monster) {
  const monsterCode = monster.code ?? monster.monsterCode ?? String(monster.id);
  const imageUrl = resolveMonsterImageUrl(monster);
  const englishName = monster.name;
  const displayName = monster.koreanName || monster.name;
  const aliases = normalizeMonsterAliases(monster, englishName);

  return {
    id: monsterCode,
    monsterCode,
    backendId: monster.id,
    com2usId: monster.com2usId ?? extractCom2usId(monsterCode),
    name: displayName,
    englishName,
    koreanName: monster.koreanName ?? null,
    element: monster.attribute?.toLowerCase?.() ?? monster.element ?? "",
    attribute: monster.attribute,
    grade: monster.naturalStars ?? monster.grade ?? null,
    naturalStars: monster.naturalStars ?? null,
    awakeningLevel: monster.awakeningLevel ?? getAwakeningLevel(monsterCode),
    iconDataUrl: imageUrl,
    imageUrl,
    enabled: monster.enabled ?? true,
    leaderEffectType: monster.leaderEffectType ?? null,
    leaderEffectAmount: monster.leaderEffectAmount ?? null,
    leaderEffectArea: monster.leaderEffectArea ?? null,
    leaderEffectElement: monster.leaderEffectElement ?? null,
    leaderEffectText: formatLeaderEffectText(monster),
    aliases,
    nicknames: aliases,
    isDefault: true,
  };
}

function extractCom2usId(monsterCode) {
  const match = String(monsterCode ?? "").match(/^sw_(\d+)$/);
  return match ? Number(match[1]) : 0;
}

function getAwakeningLevel(monsterCode) {
  const com2usId = extractCom2usId(monsterCode);
  const suffix = com2usId % 100;

  if (suffix >= 31 && suffix <= 35) return 2;
  if (suffix >= 11 && suffix <= 15) return 1;
  if (suffix >= 1 && suffix <= 5) return 0;
  return null;
}

function sortMonstersForSelection(monsters) {
  return [...monsters].sort(compareMonstersForSelection);
}

function compareMonstersForSelection(a, b) {
  const awakeningDiff = Number(b.awakeningLevel === 2) - Number(a.awakeningLevel === 2);
  if (awakeningDiff !== 0) return awakeningDiff;

  const starsDiff = (b.naturalStars ?? b.grade ?? 0) - (a.naturalStars ?? a.grade ?? 0);
  if (starsDiff !== 0) return starsDiff;

  return (b.com2usId ?? extractCom2usId(b.monsterCode)) - (a.com2usId ?? extractCom2usId(a.monsterCode));
}

function normalizeMonsterAliases(monster, englishName) {
  const aliases = monster.aliases ?? monster.nicknames ?? [];
  const aliasList = Array.isArray(aliases)
    ? aliases
    : String(aliases).split(",");

  return [englishName, ...aliasList]
    .map((alias) => alias?.trim?.() ?? "")
    .filter(Boolean);
}

async function loadBackendMonsters() {
  const body = await apiFetch("/monsters");
  const loadedMonsters = (body.data ?? [])
    .filter((monster) => monster.enabled !== false)
    .map(normalizeBackendMonster);

  return sortMonstersForSelection(loadedMonsters);
}

export default function SiegeBattleManager() {
  const [activeTab, setActiveTab] = useState("manager");
  const [monsters, setMonsters] = useState([]);
  const [trios, setTrios] = useState([]);
  const [guild, setGuild] = useState(null);
  const [members, setMembers] = useState([]);
  const [me, setMe] = useState(null);
  const [syncingMonsters, setSyncingMonsters] = useState(false);
  const [applyingLocalization, setApplyingLocalization] = useState(false);

  useEffect(() => {
    document.title = "Siege-Battle-Manager";
  }, []);

  const token = localStorage.getItem("accessToken");

  if (!token) {
    return <LoginPage />;
  }

  useEffect(() => {
    if (!token) return;

    fetchMe()
      .then(setMe)
      .catch(() => setMe(null));

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

  const isAdmin = me?.role === "ADMIN";
  const permissionLoaded = Boolean(me) && (!guild || members.length > 0);

  useEffect(() => {
    if (permissionLoaded && !isAdmin && activeTab === "review") {
      setActiveTab("manager");
    }
  }, [activeTab, isAdmin, permissionLoaded]);

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


  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setTrios([]);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      setTrios(parsed.trios || []);
    } catch (e) {
      console.warn("Failed to parse saved data", e);
      setTrios([]);
    }
  }, []);

  useEffect(() => {
    const payload = JSON.stringify({ trios });
    localStorage.setItem(STORAGE_KEY, payload);
  }, [trios]);

  async function refreshBackendMonsters() {
    const loadedMonsters = await loadBackendMonsters();

    if (loadedMonsters.length > 0) {
      setMonsters(loadedMonsters);
    }

    return loadedMonsters;
  }

  async function handleSyncSwarfarmMonsters() {
    if (syncingMonsters) return;

    try {
      setSyncingMonsters(true);
      const syncedCount = await syncSwarfarmMonsters();
      const loadedMonsters = await refreshBackendMonsters();
      alert(`Swarfarm sync complete. Synced ${syncedCount} rows, loaded ${loadedMonsters.length} monsters.`);
    } catch (e) {
      console.error("Swarfarm sync failed:", e);
      alert(e.message || "Swarfarm sync failed");
    } finally {
      setSyncingMonsters(false);
    }
  }

  async function handleApplyMonsterLocalization() {
    if (applyingLocalization) return;

    try {
      setApplyingLocalization(true);
      const appliedCount = await applyMonsterLocalization();
      const loadedMonsters = await refreshBackendMonsters();
      alert(`Monster names applied. Updated ${appliedCount} rows, loaded ${loadedMonsters.length} monsters.`);
    } catch (e) {
      console.error("Monster localization apply failed:", e);
      alert(e.message || "Monster localization apply failed");
    } finally {
      setApplyingLocalization(false);
    }
  }


  // ------- Monster / trio CRUD logic -------

  function handleDeleteMonster(id) {
    setMonsters((prev) => {
      const target = prev.find((m) => m.id === id);
      if (target?.isDefault) {
        // Built-in monsters are not deleted here.
        alert("직접 추가한 몬스터만 삭제할 수 있습니다.");
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
        name: name?.trim() || "점령전 조합",
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

  // ---------------- Render ----------------
  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto p-6 md:p-8">
        <HeaderBar
          guild={guild}
          members={members}
          isAdmin={isAdmin}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onSyncSwarfarmMonsters={handleSyncSwarfarmMonsters}
          syncingMonsters={syncingMonsters}
          onApplyMonsterLocalization={handleApplyMonsterLocalization}
          applyingLocalization={applyingLocalization}
        />

        {activeTab === "manager" ? (
          <ManagerTab
            monsters={monsters}
            trios={trios}
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
        ) : activeTab === "review" ? (
          <MonsterReviewTab />
        ) : (
          <GuildTab guild={guild} members={members} monsters={monsters} />
        )}

        <FooterBar />
      </div>
    </div>
  );
}

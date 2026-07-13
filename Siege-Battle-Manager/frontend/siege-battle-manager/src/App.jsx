import React, { useEffect, useState } from "react";
import HeaderBar from "./components/layout/HeaderBar.jsx";
import FooterBar from "./components/layout/FooterBar.jsx";
import TabGuideCard from "./components/layout/TabGuideCard.jsx";
import ManagerTab from "./components/manager/ManagerTab.jsx";
import MonsterReviewTab from "./components/monsters/MonsterReviewTab.jsx";
import SiegeBattleTab from "./components/siege/SiegeBattleTab.jsx";
import { fetchMyGuild, fetchMyGuildMembers, leaveMyGuild } from "./lib/guild.js";
import LoginPage from "./components/auth/LoginPage.jsx";
import { fetchMe } from "./lib/auth.js";
import GuildTab from "./components/guild/GuildTab.jsx";
import MyInfoTab from "./components/guild/MyInfoTab.jsx";
import GuildJoinRequestPage from "./components/guild/GuildJoinRequestPage.jsx";
import { apiFetch } from "./lib/api.js";
import { applyMonsterLocalization, syncSwarfarmMonsters } from "./lib/monsterSync.js";
import { formatLeaderEffectText } from "./lib/monsterLabels.js";


const STORAGE_KEY = "siege-battle-manager@v1";

const TAB_GUIDES = {
  "guild:inventory": {
    title: "인벤토리",
    description: "길드원별 보유 몬스터 수량을 관리합니다.",
    items: ["속성과 태생으로 필터링 및 검색 기능 사용 가능", "인벤토리에 존재하는 몬스터로 방덱을 생성할 수 있습니다.", "길드장 및 부길드장은 길드원의 인벤토리를 임의로 수정 가능합니다."],
  },
  "guild:battleResearch": {
    title: "전투 연구",
    description: "방덱 조합과 전투 연구 산출물을 게시글과 댓글로 남깁니다.",
    items: ["리더 효과와 포함 몬스터로 검색", "상세 보기를 누르면 댓글을 작성할 수 있습니다."],
  },
  "guild:defenseDeck": {
    title: "방덱",
    description: "길드원 인벤토리를 기준으로 실제 보유 가능한 방덱을 생성합니다.",
    items: ["길드장과 부길드장은 길드원 방덱 관리", "동일 방덱은 묶어서 보유 수 표시"],
  },
  "guild:ownerless": {
    title: "길드 방덱",
    description: "소유자 없이 길드 공용으로 참고할 방덱을 정리합니다.",
    items: ["길드 방덱을 생성하고 어떤 길드원이 생성 가능한지 확인할 수 있습니다.", "생성 가능한 길드원 수 확인"],
  },
  "guild:members": {
    title: "회원 관리",
    description: "가입 요청, 길드원 등급, 더미 계정을 관리합니다.",
    items: ["길드장 및 부길드장만 접근 가능","가입 승인과 거절 처리", "더미 계정을 만들어 길드 방덱 갯수 판단에 사용합니다."],
  },
  myInfo: {
    title: "내 정보",
    description: "내 계정 정보와 소속 길드 상태를 확인합니다.",
    items: ["닉네임 변경 요청", "길드 탈퇴와 가입 상태 확인"],
  },
  review: {
    title: "몬스터 검수",
    description: "관리자용 몬스터 한글명, 별칭, 노출 상태를 검수합니다.",
    items: ["콜라보와 오리지널 구분", "검색용 별칭 관리"],
  },
};

const DEFAULT_TAB_GUIDE = {
  title: "길드",
  description: "길드 전투 준비에 필요한 정보를 한 곳에서 관리합니다.",
  items: ["인벤토리, 방덱, 전투 연구 연결", "권한에 따라 관리 범위 제한"],
};

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
  const [activeTab, setActiveTab] = useState("guild");
  const [guildSubTab, setGuildSubTab] = useState("inventory");
  const [monsters, setMonsters] = useState([]);
  const [trios, setTrios] = useState([]);
  const [guild, setGuild] = useState(null);
  const [guildLoaded, setGuildLoaded] = useState(false);
  const [members, setMembers] = useState([]);
  const [me, setMe] = useState(null);
  const [syncingMonsters, setSyncingMonsters] = useState(false);
  const [applyingLocalization, setApplyingLocalization] = useState(false);

  useEffect(() => {
    document.title = "SW 점령전";
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

    setGuildLoaded(false);
    fetchMyGuild()
      .then(setGuild)
      .catch(() => setGuild(null))
      .finally(() => setGuildLoaded(true));
  }, [token]);


  // 길드 멤버 로드

  useEffect(() => {
  if (!guild) return;

  fetchMyGuildMembers()
  .then(setMembers)
  .catch(() => setMembers([]));
}, [guild]);

  async function refreshMyGuildMembers() {
    if (!guild) return;
    const [loadedGuild, loadedMembers] = await Promise.all([
      fetchMyGuild(),
      fetchMyGuildMembers(),
    ]);
    setGuild(loadedGuild);
    setMembers(loadedMembers);
  }

  const isAdmin = me?.role === "ADMIN";
  const currentGuildMember = members.find(
    (member) =>
      member.realUser &&
      (String(member.userId) === String(me?.id) || member.displayName === me?.nickname)
  );
  const currentGuildRole = currentGuildMember?.role ?? null;
  const currentGuildStatus = currentGuildMember?.status ?? "APPROVED";
  const currentNickname =
    currentGuildMember?.displayName ?? me?.nickname ?? me?.loginId ?? "";
  const canManageGuild =
    currentGuildStatus === "APPROVED" &&
    (currentGuildRole === "MASTER" || currentGuildRole === "SUB_MASTER");
  const permissionLoaded = Boolean(me) && (!guild || members.length > 0);
  const guideKey = activeTab === "guild" ? `guild:${guildSubTab}` : activeTab;
  const guide = TAB_GUIDES[guideKey] ?? DEFAULT_TAB_GUIDE;

  useEffect(() => {
    if (permissionLoaded && !isAdmin && activeTab === "review") {
      setActiveTab("guild");
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

  async function handleLeaveGuild() {
    await leaveMyGuild();
    setGuild(null);
    setMembers([]);
    setActiveTab("guild");
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
  if (me && guildLoaded && !guild && !isAdmin) {
    return <GuildJoinRequestPage me={me} />;
  }

  return (
    <div className="min-h-screen w-full bg-[#17100c] text-[#f6deb0]">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-5 p-6 md:p-8 xl:grid-cols-[280px_minmax(0,72rem)] xl:items-start">
        <div className="xl:sticky xl:top-8">
          <TabGuideCard {...guide} />
        </div>

        <div className="min-w-0">
          <HeaderBar
          guild={guild}
          members={members}
          isAdmin={isAdmin}
          currentNickname={currentNickname}
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
        ) : activeTab === "myInfo" ? (
          <MyInfoTab
            me={me}
            guild={guild}
            currentNickname={currentNickname}
            currentGuildRole={currentGuildRole}
            onLeaveGuild={handleLeaveGuild}
          />
        ) : (
          <GuildTab
            guild={guild}
            members={members}
            monsters={monsters}
            canManageGuild={canManageGuild}
            currentGuildRole={currentGuildRole}
            currentGuildMemberId={currentGuildMember?.id ?? null}
            onRefreshMembers={refreshMyGuildMembers}
            onSubTabChange={setGuildSubTab}
          />
        )}

        <FooterBar />
        </div>
      </div>
    </div>
  );
}

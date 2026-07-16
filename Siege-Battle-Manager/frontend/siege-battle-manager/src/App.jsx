import React, { useEffect, useRef, useState } from "react";
import HeaderBar from "./components/layout/HeaderBar.jsx";
import FooterBar from "./components/layout/FooterBar.jsx";
import TabGuideCard from "./components/layout/TabGuideCard.jsx";
import HelpModal from "./components/layout/HelpModal.jsx";
import ManagerTab from "./components/manager/ManagerTab.jsx";
import MonsterReviewTab from "./components/monsters/MonsterReviewTab.jsx";
import SiegeBattleTab from "./components/siege/SiegeBattleTab.jsx";
import { fetchMyGuild, fetchMyGuildMembers, leaveMyGuild } from "./lib/guild.js";
import LoginPage from "./components/auth/LoginPage.jsx";
import { fetchBootstrap, fetchMe } from "./lib/auth.js";
import GuildTab from "./components/guild/GuildTab.jsx";
import MyInfoTab from "./components/guild/MyInfoTab.jsx";
import GuildJoinRequestPage from "./components/guild/GuildJoinRequestPage.jsx";
import { applyMonsterLocalization, getSwarfarmSyncStatus, syncSwarfarmMonsters } from "./lib/monsterSync.js";
import { getMonsters } from "./components/monsterSource.js";


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
  const [monsterJobStatus, setMonsterJobStatus] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const previousMonsterJobStatusRef = useRef(null);

  useEffect(() => {
    document.title = "SW 점령전";
  }, []);

  const token = localStorage.getItem("accessToken");

  if (!token) {
    return <LoginPage />;
  }

  useEffect(() => {
    if (!token) return;

    setGuildLoaded(false);
    fetchBootstrap()
      .catch(async () => {
        const loadedMe = await fetchMe();
        const loadedGuild = await fetchMyGuild().catch(() => null);
        const loadedMembers = loadedGuild
          ? await fetchMyGuildMembers().catch(() => [])
          : [];

        return {
          me: loadedMe,
          guild: loadedGuild,
          members: loadedMembers,
        };
      })
      .then((data) => {
        setMe(data?.me ?? null);
        setGuild(data?.guild ?? null);
        setMembers(data?.members ?? []);
      })
      .catch(() => {
        setMe(null);
        setGuild(null);
        setMembers([]);
      })
      .finally(() => setGuildLoaded(true));
  }, [token]);


  // 길드 멤버 로드

  useEffect(() => {
  if (!guild) {
    setMembers([]);
    return;
  }
  if (members.length > 0) return;

  fetchMyGuildMembers()
  .then(setMembers)
  .catch(() => setMembers([]));
}, [guild, members.length]);

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
  const monsterJobRunning = monsterJobStatus?.status === "RUNNING";
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
    getMonsters()
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
    if (!isAdmin) return;

    let cancelled = false;

    async function refreshStatus() {
      try {
        const status = await getSwarfarmSyncStatus();
        if (!cancelled) {
          setMonsterJobStatus(status);
        }
      } catch (e) {
        console.warn("Failed to load monster sync status", e);
      }
    }

    refreshStatus();
    const timer = window.setInterval(refreshStatus, monsterJobRunning ? 3000 : 8000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isAdmin, monsterJobRunning]);

  useEffect(() => {
    const previousStatus = previousMonsterJobStatusRef.current;

    if (
      previousStatus?.status === "RUNNING" &&
      monsterJobStatus?.status === "COMPLETED" &&
      ["SWARFARM_SYNC", "APPLY_LOCALIZATION"].includes(monsterJobStatus?.operation)
    ) {
      refreshBackendMonsters().catch((e) => {
        console.warn("Failed to refresh monsters after sync", e);
      });
    }

    if (
      previousStatus?.status === "RUNNING" &&
      monsterJobStatus?.status === "FAILED"
    ) {
      alert(monsterJobStatus.message || "Monster admin job failed");
    }

    previousMonsterJobStatusRef.current = monsterJobStatus;
  }, [monsterJobStatus]);


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
    const loadedMonsters = await getMonsters({ forceRefresh: true });

    if (loadedMonsters.length > 0) {
      setMonsters(loadedMonsters);
    }

    return loadedMonsters;
  }

  async function handleSyncSwarfarmMonsters() {
    if (syncingMonsters || monsterJobRunning) return;

    try {
      setSyncingMonsters(true);
      const status = await syncSwarfarmMonsters();
      setMonsterJobStatus(status);
    } catch (e) {
      console.error("Swarfarm sync failed:", e);
      alert(e.message || "Swarfarm sync failed");
    } finally {
      setSyncingMonsters(false);
    }
  }

  async function handleApplyMonsterLocalization() {
    if (applyingLocalization || monsterJobRunning) return;

    try {
      setApplyingLocalization(true);
      const status = await applyMonsterLocalization();
      setMonsterJobStatus(status);
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
          syncingMonsters={syncingMonsters || monsterJobRunning}
          onApplyMonsterLocalization={handleApplyMonsterLocalization}
          applyingLocalization={applyingLocalization || monsterJobRunning}
          monsterJobStatus={monsterJobStatus}
          onOpenHelp={() => setHelpOpen(true)}
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
            currentUserId={me?.id ?? null}
            currentGuildRole={currentGuildRole}
            currentGuildMemberId={currentGuildMember?.id ?? null}
            onRefreshMembers={refreshMyGuildMembers}
            onSubTabChange={setGuildSubTab}
          />
        )}

        <FooterBar />
        </div>
      </div>
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

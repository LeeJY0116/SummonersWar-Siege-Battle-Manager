import { useEffect, useState } from "react";
import {
  fetchBattleResearchPosts,
  fetchBattleResearchPostDetail,
  createBattleResearchPost,
  createBattleResearchComment,
} from "../../lib/battleResearch.js";
import DeckMonsterSlot from "./DeckMonsterSlot.jsx";
import { matchesMonsterSearch } from "../../lib/monsterSearch.js";
import MonsterFilterControls, {
  matchesMonsterPickerFilters,
} from "../monsters/MonsterFilterControls.jsx";
import { getElementLabel } from "../../lib/monsterLabels.js";

export default function BattleResearchTab({ monsters = []}) {
  const [posts, setPosts] = useState([]);
  const [openedPostId, setOpenedPostId] = useState(null);
  const [detailMap, setDetailMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [commentContentMap, setCommentContentMap] = useState({});
  const [commentAttackMonsterCodesMap, setCommentAttackMonsterCodesMap] = useState({});
  const [commentActiveSlotMap, setCommentActiveSlotMap] = useState({});
  const [commentMonsterSearchMap, setCommentMonsterSearchMap] = useState({});
  const [commentMonsterStarFilterMap, setCommentMonsterStarFilterMap] = useState({});
  const [commentMonsterElementFilterMap, setCommentMonsterElementFilterMap] = useState({});
  const [selectedMonsterCodes, setSelectedMonsterCodes] = useState(["", "", ""]);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);
  const [monsterSearch, setMonsterSearch] = useState("");
  const [monsterStarFilter, setMonsterStarFilter] = useState(5);
  const [monsterElementFilter, setMonsterElementFilter] = useState("");


  const selectedMonsters = selectedMonsterCodes.map((code) =>
    monsters.find((m) => m.id === code)
  );

  const filteredMonsters = monsters.filter((m) => {
    return (
      matchesMonsterSearch(m, monsterSearch) &&
      matchesMonsterPickerFilters(m, {
        query: monsterSearch,
        starFilter: monsterStarFilter,
        elementFilter: monsterElementFilter,
      })
    );
  });

  function findMonsterByResearchItem(item) {
    return monsters.find((m) => m.id === item.monsterCode);
  }

  function renderResearchMonsterDeck(items = []) {
    return (
      <div className="mt-3 flex gap-2">
        {items.map((item, index) => {
          const monster = findMonsterByResearchItem(item);
          const monsterName = monster?.name ?? item.monsterName;
          const elementLabel = getElementLabel(monster?.element ?? monster?.attribute);

          return (
            <div
              key={`${item.monsterCode ?? item.monsterId}-${index}`}
              className="w-20 rounded-md border-2 border-[#b79148] bg-[#4b3421] p-1.5 text-center shadow-[inset_0_0_0_1px_rgba(255,237,169,0.25)]"
            >
              <div className="mb-1 text-[10px] font-semibold text-[#c8a96a]">
                {index === 0 ? "리더" : `${index + 1}번`}
              </div>

              {monster?.iconDataUrl ? (
                <img
                  src={monster.iconDataUrl}
                  alt={monsterName}
                  className="mx-auto h-12 w-12 rounded-sm border border-[#3c2414] object-cover"
                />
              ) : (
                <div className="mx-auto h-12 w-12 rounded-sm border border-[#3c2414] bg-[#2f241b]" />
              )}

              <div className="mt-1 truncate text-xs font-semibold text-[#f6deb0] antialiased">
                {monsterName}
              </div>
              {elementLabel && (
                <div className="text-[10px] font-semibold text-[#c8a96a]">
                  {elementLabel}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function selectMonster(code) {
    if (selectedMonsterCodes.includes(code)) {
      alert("이미 선택된 몬스터입니다.");
      return;
    }

    setSelectedMonsterCodes((prev) => {
      const next = [...prev];
      next[activeSlotIndex] = code;

      const nextEmptyIndex = next.findIndex((v) => !v);
      setActiveSlotIndex(nextEmptyIndex !== -1 ? nextEmptyIndex : 2);

      return next;
    });
  }


  function getCommentAttackMonsterCodes(postId) {
    return commentAttackMonsterCodesMap[postId] ?? ["", "", ""];
  }

  function getCommentFilteredMonsters(postId) {
    const query = commentMonsterSearchMap[postId] ?? "";
    const starFilter = commentMonsterStarFilterMap[postId] ?? 5;
    const elementFilter = commentMonsterElementFilterMap[postId] ?? "";

    return monsters.filter(
      (m) =>
        matchesMonsterSearch(m, query) &&
        matchesMonsterPickerFilters(m, {
          query,
          starFilter,
          elementFilter,
        }),
    );
  }

  function selectCommentAttackMonster(postId, code) {
    const currentCodes = getCommentAttackMonsterCodes(postId);

    if (currentCodes.includes(code)) {
      alert("이미 선택된 몬스터입니다.");
      return;
    }

    setCommentAttackMonsterCodesMap((prev) => {
      const next = [...(prev[postId] ?? ["", "", ""])];
      const activeSlotIndex = commentActiveSlotMap[postId] ?? next.findIndex((v) => !v);
      next[activeSlotIndex === -1 ? 2 : activeSlotIndex] = code;

      const nextEmptyIndex = next.findIndex((v) => !v);
      setCommentActiveSlotMap((activePrev) => ({
        ...activePrev,
        [postId]: nextEmptyIndex !== -1 ? nextEmptyIndex : 2,
      }));

      return {
        ...prev,
        [postId]: next,
      };
    });
  }

  async function loadPosts() {
    try {
      setLoading(true);
      const data = await fetchBattleResearchPosts();
      setPosts(data || []);
    } catch (e) {
      console.error(e);
      alert(e.message || "전투 연구 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  async function toggleDetail(postId) {
    if (openedPostId === postId) {
      setOpenedPostId(null);
      return;
    }

    setOpenedPostId(postId);

    if (detailMap[postId]) return;

    try {
      const detail = await fetchBattleResearchPostDetail(postId);

      setDetailMap((prev) => ({
        ...prev,
        [postId]: detail,
      }));
    } catch (e) {
      console.error(e);
      alert(e.message || "전투 연구 상세 조회 실패");
    }
  }

  async function handleCreatePost() {
    if (!title.trim()) {
        alert("제목을 입력해주세요.");
        return;
    }

    if (selectedMonsterCodes.some((code) => !code)) {
      alert("방덱 몬스터 3마리를 모두 선택해주세요.");
      return;
    }

    if (new Set(selectedMonsterCodes).size !== 3) {
      alert("같은 몬스터를 중복 선택할 수 없습니다.");
      return;
    }

    try {
        setLoading(true);

        await createBattleResearchPost({
        title: title.trim(),
        content: content.trim(),
        monsterCodes: selectedMonsterCodes,
        });

        alert("전투 연구가 등록되었습니다.");
        setTitle("");
        setContent("");
        await loadPosts();

        setSelectedMonsterCodes(["", "", ""]);
        setActiveSlotIndex(0);
        setMonsterSearch("");
    } catch (e) {
        console.error(e);
        alert(e.message || "전투 연구 등록 실패");
    } finally {
        setLoading(false);
    }
    }
    //

    // 댓글 작성
async function handleCreateComment(postId) {
  const content = commentContentMap[postId]?.trim();
  const attackMonsterCodes = getCommentAttackMonsterCodes(postId).filter(Boolean);

  if (!content) {
    alert("댓글 내용을 입력해주세요.");
    return;
  }

  try {
    setLoading(true);

    await createBattleResearchComment(postId, {
      content,
      attackMonsterCodes,
    });

    alert("댓글이 등록되었습니다.");

    setCommentContentMap((prev) => ({
      ...prev,
      [postId]: "",
    }));

    setCommentAttackMonsterCodesMap((prev) => ({
      ...prev,
      [postId]: ["", "", ""],
    }));

    setCommentActiveSlotMap((prev) => ({
      ...prev,
      [postId]: 0,
    }));

    setCommentMonsterSearchMap((prev) => ({
      ...prev,
      [postId]: "",
    }));

    setCommentMonsterStarFilterMap((prev) => ({
      ...prev,
      [postId]: 5,
    }));

    setCommentMonsterElementFilterMap((prev) => ({
      ...prev,
      [postId]: "",
    }));

    const detail = await fetchBattleResearchPostDetail(postId);

    setDetailMap((prev) => ({
      ...prev,
      [postId]: detail,
    }));

    await loadPosts();
  } catch (e) {
    console.error(e);
    alert(e.message || "댓글 등록 실패");
  } finally {
    setLoading(false);
  }
}

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">전투 연구</h3>

        <button
          onClick={loadPosts}
          disabled={loading}
          className="rounded-xl border px-3 py-1 text-sm"
        >
          새로고침
        </button>
      </div>

        <section className="rounded-2xl border border-[#8b6a2e] bg-[#2f241b] p-4 text-[#f6deb0] shadow-[0_10px_24px_rgba(31,20,10,0.18)]">
        <h4 className="mb-3 font-bold">전투 연구 작성</h4>

        <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="mb-3 w-full rounded-xl border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] placeholder:text-[#bda981] outline-none focus:border-[#f6c44f]"
        />

        <div className="mb-4 rounded-xl border border-[#745320] bg-[#211813] p-3">
          <div className="mb-2 text-sm font-semibold text-[#f6deb0]">연구 대상 방덱</div>

          <div className="mb-4 flex gap-3">
            {[0, 1, 2].map((index) => (
              <DeckMonsterSlot
                key={index}
                monster={selectedMonsters[index]}
                isLeader={index === 0}
                isActive={activeSlotIndex === index}
                onClick={() => setActiveSlotIndex(index)}
              />
            ))}
          </div>

          <div className="mb-2 text-sm text-[#d7be80]">
            현재 선택 슬롯:{" "}
            <span className="font-semibold">
              {activeSlotIndex === 0 ? "리더" : `${activeSlotIndex + 1}번`}
            </span>
          </div>

          <input
            value={monsterSearch}
            onChange={(e) => setMonsterSearch(e.target.value)}
            placeholder="몬스터 검색"
            className="mb-3 w-full rounded-xl border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] placeholder:text-[#bda981] outline-none focus:border-[#f6c44f]"
          />

          <MonsterFilterControls
            starFilter={monsterStarFilter}
            onChangeStarFilter={setMonsterStarFilter}
            elementFilter={monsterElementFilter}
            onChangeElementFilter={setMonsterElementFilter}
            disabled={Boolean(monsterSearch.trim())}
            variant="dark"
          />

          <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto rounded-xl border border-[#745320] bg-[#211813] p-3 [scrollbar-color:#9b743a_#2f241b] [scrollbar-width:thin] sm:grid-cols-6 md:grid-cols-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#9b743a] [&::-webkit-scrollbar-track]:bg-[#2f241b]">
            {filteredMonsters.map((m) => {
              const selected = selectedMonsterCodes.includes(m.id);

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectMonster(m.id)}
                  disabled={selected}
                  className={`rounded-md border-2 p-1.5 text-center text-[11px] transition hover:border-[#ffd86a] hover:brightness-110 disabled:opacity-45 ${
                    selected
                      ? "border-[#f6c44f] bg-[#2a170c] ring-2 ring-[#f6c44f]/40"
                      : "border-[#b79148] bg-[#4b3421]"
                  }`}
                >
                  {m.iconDataUrl ? (
                    <img
                      src={m.iconDataUrl}
                      alt={m.name}
                      className="mx-auto h-14 w-14 rounded-sm border border-[#3c2414] object-cover"
                    />
                  ) : (
                    <div className="mx-auto h-14 w-14 rounded-sm border border-[#3c2414] bg-[#2f241b]" />
                  )}

                  <div className="mt-1 flex min-h-[28px] items-center justify-center px-1 font-semibold leading-tight text-[#f6deb0] antialiased">
                    {m.name}
                  </div>
                  <div className="truncate text-[10px] font-semibold text-[#c8a96a]">
                    {getElementLabel(m.element ?? m.attribute)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="연구 내용"
            rows={4}
            className="mb-3 w-full rounded-xl border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] placeholder:text-[#bda981] outline-none focus:border-[#f6c44f]"
        />

        <button
            onClick={handleCreatePost}
            disabled={loading}
            className="rounded-xl bg-black px-4 py-2 text-white disabled:bg-gray-400"
        >
            등록
        </button>
        </section>

        

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#745320] bg-[#211813] p-6 text-center text-sm text-[#d7be80]">
          등록된 전투 연구가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const postId = post.postId ?? post.id;
            const detail = detailMap[postId];
            const commentAttackMonsterCodes = getCommentAttackMonsterCodes(postId);
            const commentSelectedMonsters = commentAttackMonsterCodes.map((code) =>
              monsters.find((m) => m.id === code)
            );
            const commentActiveSlotIndex = commentActiveSlotMap[postId] ?? 0;
            const commentFilteredMonsters = getCommentFilteredMonsters(postId);

            return (
              <div
                key={postId}
                className="rounded-xl border border-[#745320] bg-[#211813] p-4 text-[#f6deb0] shadow-[inset_0_0_0_1px_rgba(255,237,169,0.12)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {post.title ?? "제목 없는 연구"}
                    </div>

                    <div className="mt-1 text-sm font-semibold text-[#d7be80]">
                      작성자: {post.authorName ?? post.writerName ?? "-"}
                    </div>

                    {renderResearchMonsterDeck(post.defenseMonsters ?? [])}
                    
                    <div className="mt-1 text-xs font-semibold text-[#c8a96a]">
                      댓글 {post.commentCount ?? 0}개
                    </div>
                  </div>

                  <button
                    onClick={() => toggleDetail(postId)}
                    className="rounded-xl border border-[#9b743a] bg-[#221913] px-3 py-1 text-sm font-semibold text-[#f8e0ad] hover:border-[#f6c44f]"
                  >
                    {openedPostId === postId ? "닫기" : "상세 보기"}
                  </button>
                </div>

                {openedPostId === postId && detail && (
                  <div className="mt-4 rounded-xl border border-[#745320] bg-[#2f241b] p-4">



                    <div className="mt-4 text-sm font-semibold">
                      연구 대상 방덱
                    </div>

                    {renderResearchMonsterDeck(post.defenseMonsters ?? [])}

                    <div className="mb-3 text-sm font-semibold">
                      연구 내용
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-[#f6deb0]">
                      {detail.content ?? detail.description ?? "내용 없음"}
                    </p>
                    <div className="mt-4 text-sm font-semibold">
                      댓글
                    </div>

                    <div className="mt-2 space-y-2">
                      {(detail.comments ?? []).length === 0 ? (
                          <div className="text-sm text-[#c8a96a]">
                          등록된 댓글이 없습니다.
                        </div>
                      ) : (
                        detail.comments.map((comment) => (
                          <div
                            key={comment.commentId ?? comment.id}
                            className="rounded-xl border border-[#745320] bg-[#211813] px-3 py-2 text-sm text-[#f6deb0]"
                          >
                            <div className="font-semibold">
                              {comment.authorName ?? comment.writerName ?? "-"}
                            </div>
                            <div className="mt-1 text-[#f6deb0]">
                              {comment.content}
                            </div>
                            {renderResearchMonsterDeck(comment.attackMonsters ?? [])}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="mt-4 rounded-xl border border-[#745320] bg-[#211813] p-3">
                      <div className="mb-3 text-sm font-semibold">
                        댓글 공격덱
                      </div>

                      <div className="mb-3 flex gap-3">
                        {[0, 1, 2].map((index) => (
                          <DeckMonsterSlot
                            key={index}
                            monster={commentSelectedMonsters[index]}
                            isLeader={index === 0}
                            isActive={commentActiveSlotIndex === index}
                            onClick={() =>
                              setCommentActiveSlotMap((prev) => ({
                                ...prev,
                                [postId]: index,
                              }))
                            }
                          />
                        ))}
                      </div>

                      <input
                        value={commentMonsterSearchMap[postId] ?? ""}
                        onChange={(e) =>
                          setCommentMonsterSearchMap((prev) => ({
                            ...prev,
                            [postId]: e.target.value,
                          }))
                        }
                        placeholder="공격 몬스터 검색"
                        className="mb-3 w-full rounded-xl border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] placeholder:text-[#bda981] outline-none focus:border-[#f6c44f]"
                      />

                      <MonsterFilterControls
                        starFilter={commentMonsterStarFilterMap[postId] ?? 5}
                        onChangeStarFilter={(value) =>
                          setCommentMonsterStarFilterMap((prev) => ({
                            ...prev,
                            [postId]: value,
                          }))
                        }
                        elementFilter={commentMonsterElementFilterMap[postId] ?? ""}
                        onChangeElementFilter={(value) =>
                          setCommentMonsterElementFilterMap((prev) => ({
                            ...prev,
                            [postId]: value,
                          }))
                        }
                        disabled={Boolean((commentMonsterSearchMap[postId] ?? "").trim())}
                        variant="dark"
                      />

                      <div className="mb-3 grid max-h-60 grid-cols-4 gap-2 overflow-y-auto rounded-xl border border-[#745320] bg-[#211813] p-3 [scrollbar-color:#9b743a_#2f241b] [scrollbar-width:thin] sm:grid-cols-6 md:grid-cols-8 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#9b743a] [&::-webkit-scrollbar-track]:bg-[#2f241b]">
                        {commentFilteredMonsters.map((m) => {
                          const selected = commentAttackMonsterCodes.includes(m.id);

                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => selectCommentAttackMonster(postId, m.id)}
                              disabled={selected}
                              className={`rounded-md border-2 p-1.5 text-center text-[11px] transition hover:border-[#ffd86a] hover:brightness-110 disabled:opacity-45 ${
                                selected
                                  ? "border-[#f6c44f] bg-[#2a170c] ring-2 ring-[#f6c44f]/40"
                                  : "border-[#b79148] bg-[#4b3421]"
                              }`}
                            >
                              {m.iconDataUrl ? (
                                <img
                                  src={m.iconDataUrl}
                                  alt={m.name}
                                  className="mx-auto h-14 w-14 rounded-sm border border-[#3c2414] object-cover"
                                />
                              ) : (
                                <div className="mx-auto h-14 w-14 rounded-sm border border-[#3c2414] bg-[#2f241b]" />
                              )}

                              <div className="mt-1 flex min-h-[28px] items-center justify-center px-1 font-semibold leading-tight text-[#f6deb0] antialiased">
                                {m.name}
                              </div>
                              <div className="truncate text-[10px] font-semibold text-[#c8a96a]">
                                {getElementLabel(m.element ?? m.attribute)}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <textarea
                        value={commentContentMap[postId] ?? ""}
                        onChange={(e) =>
                          setCommentContentMap((prev) => ({
                            ...prev,
                            [postId]: e.target.value,
                          }))
                        }
                        placeholder="댓글 내용을 입력하세요"
                        rows={3}
                        className="mb-2 w-full rounded-xl border border-[#8f6732] bg-[#1f1712] px-3 py-2 text-sm font-semibold text-[#fff0c8] placeholder:text-[#bda981] outline-none focus:border-[#f6c44f]"
                      />

                      <button
                        onClick={() => handleCreateComment(postId)}
                        disabled={loading}
                        className="rounded-xl bg-black px-3 py-1 text-sm text-white disabled:bg-gray-400"
                      >
                        댓글 등록
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  fetchBattleResearchPosts,
  fetchBattleResearchPostDetail,
  createBattleResearchPost,
  createBattleResearchComment,
} from "../../lib/battleResearch.js";
import DeckMonsterSlot from "./DeckMonsterSlot.jsx";

export default function BattleResearchTab({ monsters = []}) {
  const [posts, setPosts] = useState([]);
  const [openedPostId, setOpenedPostId] = useState(null);
  const [detailMap, setDetailMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [commentContentMap, setCommentContentMap] = useState({});
  const [selectedMonsterCodes, setSelectedMonsterCodes] = useState(["", "", ""]);
  const [activeSlotIndex, setActiveSlotIndex] = useState(0);
  const [monsterSearch, setMonsterSearch] = useState("");


  const selectedMonsters = selectedMonsterCodes.map((code) =>
    monsters.find((m) => m.id === code)
  );

  const filteredMonsters = monsters.filter((m) => {
    const q = monsterSearch.trim().toLowerCase();

    if (!q) return true;

    return (
      m.name?.toLowerCase().includes(q) ||
      m.id?.toLowerCase().includes(q) ||
      m.nicknames?.join(" ").toLowerCase().includes(q)
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

          return (
            <div
              key={`${item.monsterCode ?? item.monsterId}-${index}`}
              className="w-20 rounded-xl bg-gray-50 p-2 text-center"
            >
              <div className="mb-1 text-[10px] text-gray-400">
                {index === 0 ? "리더" : `${index + 1}번`}
              </div>

              {monster?.iconDataUrl ? (
                <img
                  src={monster.iconDataUrl}
                  alt={item.monsterName}
                  className="mx-auto h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="mx-auto h-12 w-12 rounded-lg bg-gray-200" />
              )}

              <div className="mt-1 truncate text-xs font-semibold">
                {item.monsterName}
              </div>
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

  if (!content) {
    alert("댓글 내용을 입력해주세요.");
    return;
  }

  try {
    setLoading(true);

    await createBattleResearchComment(postId, {
      content,
      attackMonsterCodes: [],
    });

    alert("댓글이 등록되었습니다.");

    setCommentContentMap((prev) => ({
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

      <section className="rounded-2xl border bg-white p-4">
        <h4 className="mb-3 font-bold">전투 연구 작성</h4>

        <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목"
            className="mb-3 w-full rounded-xl border px-3 py-2"
        />

        <div className="mb-4">
          <div className="mb-2 text-sm font-semibold">연구 대상 방덱</div>

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

          <div className="mb-2 text-sm text-gray-600">
            현재 선택 슬롯:{" "}
            <span className="font-semibold">
              {activeSlotIndex === 0 ? "리더" : `${activeSlotIndex + 1}번`}
            </span>
          </div>

          <input
            value={monsterSearch}
            onChange={(e) => setMonsterSearch(e.target.value)}
            placeholder="몬스터 검색"
            className="mb-3 w-full rounded-xl border px-3 py-2"
          />

          <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto rounded-2xl border p-3">
            {filteredMonsters.map((m) => {
              const selected = selectedMonsterCodes.includes(m.id);

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => selectMonster(m.id)}
                  disabled={selected}
                  className={`rounded-xl border p-2 text-center text-xs transition hover:bg-gray-50 disabled:opacity-40 ${
                    selected ? "bg-gray-100" : "bg-white"
                  }`}
                >
                  {m.iconDataUrl ? (
                    <img
                      src={m.iconDataUrl}
                      alt={m.name}
                      className="mx-auto mb-1 h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="mx-auto mb-1 h-12 w-12 rounded-lg bg-gray-200" />
                  )}

                  <div className="truncate font-semibold">{m.name}</div>
                  <div className="truncate text-[10px] text-gray-400">{m.element}</div>
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
            className="mb-3 w-full rounded-xl border px-3 py-2"
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
        <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-gray-500">
          등록된 전투 연구가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const postId = post.postId ?? post.id;
            const detail = detailMap[postId];

            return (
              <div
                key={postId}
                className="rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">
                      {post.title ?? "제목 없는 연구"}
                    </div>

                    <div className="mt-1 text-sm text-gray-500">
                      작성자: {post.authorName ?? post.writerName ?? "-"}
                    </div>

                    {renderResearchMonsterDeck(post.defenseMonsters ?? [])}
                    
                    <div className="mt-1 text-xs text-gray-400">
                      댓글 {post.commentCount ?? 0}개
                    </div>
                  </div>

                  <button
                    onClick={() => toggleDetail(postId)}
                    className="rounded-xl border px-3 py-1 text-sm"
                  >
                    {openedPostId === postId ? "닫기" : "상세 보기"}
                  </button>
                </div>

                {openedPostId === postId && detail && (
                  <div className="mt-4 rounded-2xl bg-gray-50 p-4">



                    <div className="mt-4 text-sm font-semibold">
                      연구 대상 방덱
                    </div>

                    {renderResearchMonsterDeck(post.defenseMonsters ?? [])}

                    <div className="mb-3 text-sm font-semibold">
                      연구 내용
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                      {detail.content ?? detail.description ?? "내용 없음"}
                    </p>
                    <div className="mt-4 text-sm font-semibold">
                      댓글
                    </div>

                    <div className="mt-2 space-y-2">
                      {(detail.comments ?? []).length === 0 ? (
                        <div className="text-sm text-gray-400">
                          등록된 댓글이 없습니다.
                        </div>
                      ) : (
                        detail.comments.map((comment) => (
                          <div
                            key={comment.commentId ?? comment.id}
                            className="rounded-xl bg-white px-3 py-2 text-sm"
                          >
                            <div className="font-semibold">
                              {comment.authorName ?? comment.writerName ?? "-"}
                            </div>
                            <div className="mt-1 text-gray-700">
                              {comment.content}
                            </div>
                            {renderResearchMonsterDeck(comment.attackMonsters ?? [])}
                          </div>
                        ))
                      )}
                    </div>
                    <div className="mt-4 rounded-xl bg-white p-3">
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
                        className="mb-2 w-full rounded-xl border px-3 py-2 text-sm"
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

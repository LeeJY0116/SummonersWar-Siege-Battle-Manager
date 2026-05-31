import { useEffect, useState } from "react";
import {
  fetchBattleResearchPosts,
  fetchBattleResearchPostDetail,
  createBattleResearchPost,
} from "../../lib/battleResearch.js";

export default function BattleResearchTab() {
  const [posts, setPosts] = useState([]);
  const [openedPostId, setOpenedPostId] = useState(null);
  const [detailMap, setDetailMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

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

    try {
        setLoading(true);

        await createBattleResearchPost({
        title: title.trim(),
        content: content.trim(),
        });

        alert("전투 연구가 등록되었습니다.");
        setTitle("");
        setContent("");
        await loadPosts();
    } catch (e) {
        console.error(e);
        alert(e.message || "전투 연구 등록 실패");
    } finally {
        setLoading(false);
    }
    }
    //


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
                          </div>
                        ))
                      )}
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
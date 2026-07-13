package com.sbm.siegebackend.domain.research.dto;

import java.time.LocalDateTime;
import java.util.List;

public class BattleResearchPostDetailResponse {

    private Long postId;
    private String title;

    private String authorName;
    private Long authorUserId;

    private String content;

    private List<MonsterItem> defenseMonsters;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<BattleResearchCommentResponse> comments;
    private int commentPage;
    private int commentSize;
    private long totalComments;
    private int totalCommentPages;

    public BattleResearchPostDetailResponse(Long postId,
                                            String title,
                                            String authorName,
                                            Long authorUserId,
                                            String content,
                                            List<MonsterItem> defenseMonsters,
                                            LocalDateTime createdAt,
                                            LocalDateTime updatedAt,
                                            List<BattleResearchCommentResponse> comments) {
        this(postId, title, authorName, authorUserId, content, defenseMonsters, createdAt, updatedAt, comments, 0, comments == null ? 0 : comments.size(), comments == null ? 0 : comments.size(), 1);
    }

    public BattleResearchPostDetailResponse(Long postId,
                                            String title,
                                            String authorName,
                                            Long authorUserId,
                                            String content,
                                            List<MonsterItem> defenseMonsters,
                                            LocalDateTime createdAt,
                                            LocalDateTime updatedAt,
                                            List<BattleResearchCommentResponse> comments,
                                            int commentPage,
                                            int commentSize,
                                            long totalComments,
                                            int totalCommentPages) {
        this.postId = postId;
        this.title = title;
        this.authorName = authorName;
        this.authorUserId = authorUserId;
        this.content = content;
        this.defenseMonsters = defenseMonsters;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.comments = comments;
        this.commentPage = commentPage;
        this.commentSize = commentSize;
        this.totalComments = totalComments;
        this.totalCommentPages = totalCommentPages;
    }

    public static class MonsterItem {
        private Long monsterId;
        private String monsterCode;
        private String monsterName;

        public MonsterItem(Long monsterId, String monsterCode, String monsterName) {
            this.monsterId = monsterId;
            this.monsterCode = monsterCode;
            this.monsterName = monsterName;
        }

        public Long getMonsterId() { return monsterId; }
        public String getMonsterCode() { return monsterCode; }
        public String getMonsterName() { return monsterName; }
    }

    public Long getPostId() { return postId; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public String getAuthorName() { return authorName; }
    public Long getAuthorUserId() { return authorUserId; }
    public List<MonsterItem> getDefenseMonsters() { return defenseMonsters; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<BattleResearchCommentResponse> getComments() { return comments; }
    public int getCommentPage() { return commentPage; }
    public int getCommentSize() { return commentSize; }
    public long getTotalComments() { return totalComments; }
    public int getTotalCommentPages() { return totalCommentPages; }
}

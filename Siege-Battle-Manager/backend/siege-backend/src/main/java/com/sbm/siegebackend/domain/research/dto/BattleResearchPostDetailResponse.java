package com.sbm.siegebackend.domain.research.dto;

import java.time.LocalDateTime;
import java.util.List;

public class BattleResearchPostDetailResponse {

    private Long postId;
    private String title;

    private String authorName;
    private Long authorUserId;

    private List<MonsterItem> defenseMonsters;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<BattleResearchCommentResponse> comments;

    public BattleResearchPostDetailResponse(Long postId,
                                            String title,
                                            String authorName,
                                            Long authorUserId,
                                            List<MonsterItem> defenseMonsters,
                                            LocalDateTime createdAt,
                                            LocalDateTime updatedAt,
                                            List<BattleResearchCommentResponse> comments) {
        this.postId = postId;
        this.title = title;
        this.authorName = authorName;
        this.authorUserId = authorUserId;
        this.defenseMonsters = defenseMonsters;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.comments = comments;
    }

    public static class MonsterItem {
        private Long monsterId;
        private String monsterName;

        public MonsterItem(Long monsterId, String monsterName) {
            this.monsterId = monsterId;
            this.monsterName = monsterName;
        }

        public Long getMonsterId() { return monsterId; }
        public String getMonsterName() { return monsterName; }
    }

    public Long getPostId() { return postId; }
    public String getTitle() { return title; }
    public String getAuthorName() { return authorName; }
    public Long getAuthorUserId() { return authorUserId; }
    public List<MonsterItem> getDefenseMonsters() { return defenseMonsters; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public List<BattleResearchCommentResponse> getComments() { return comments; }
}

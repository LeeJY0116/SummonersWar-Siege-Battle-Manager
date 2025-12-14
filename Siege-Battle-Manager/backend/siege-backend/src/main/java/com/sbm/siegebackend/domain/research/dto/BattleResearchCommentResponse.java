package com.sbm.siegebackend.domain.research.dto;

import java.time.LocalDateTime;
import java.util.List;

public class BattleResearchCommentResponse {

    private Long commentId;
    private String authorName;
    private Long authorUserId;

    private List<MonsterItem> attackMonsters;
    private String content;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BattleResearchCommentResponse(Long commentId,
                                         String authorName,
                                         Long authorUserId,
                                         List<MonsterItem> attackMonsters,
                                         String content,
                                         LocalDateTime createdAt,
                                         LocalDateTime updatedAt) {
        this.commentId = commentId;
        this.authorName = authorName;
        this.authorUserId = authorUserId;
        this.attackMonsters = attackMonsters;
        this.content = content;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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

    public Long getCommentId() { return commentId; }
    public String getAuthorName() { return authorName; }
    public Long getAuthorUserId() { return authorUserId; }
    public List<MonsterItem> getAttackMonsters() { return attackMonsters; }
    public String getContent() { return content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}

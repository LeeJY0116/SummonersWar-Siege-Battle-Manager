package com.sbm.siegebackend.domain.research.dto;

import java.time.LocalDateTime;
import java.util.List;

public class BattleResearchPostListItemResponse {

    private Long postId;
    private String title;

    private String authorName;
    private Long authorUserId;

    private List<MonsterItem> defenseMonsters;
    private int commentCount;

    private LocalDateTime createdAt;

    public BattleResearchPostListItemResponse(Long postId,
                                              String title,
                                              String authorName,
                                              Long authorUserId,
                                              List<MonsterItem> defenseMonsters,
                                              int commentCount,
                                              LocalDateTime createdAt) {
        this.postId = postId;
        this.title = title;
        this.authorName = authorName;
        this.authorUserId = authorUserId;
        this.defenseMonsters = defenseMonsters;
        this.commentCount = commentCount;
        this.createdAt = createdAt;
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
    public int getCommentCount() { return commentCount; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}

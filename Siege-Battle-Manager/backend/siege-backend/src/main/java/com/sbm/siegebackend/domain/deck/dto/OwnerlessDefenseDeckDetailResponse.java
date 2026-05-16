package com.sbm.siegebackend.domain.deck.dto;

import java.util.List;

public class OwnerlessDefenseDeckDetailResponse {

    private Long deckId;
    private String title;

    private Long leaderMonsterId;
    private String leaderMonsterCode;
    private String leaderMonsterName;
    private String leaderEffectType;

    private List<MonsterItem> monsters;

    private int availableMemberCount;
    private List<AvailableMember> availableMembers;

    public OwnerlessDefenseDeckDetailResponse(Long deckId,
                                              String title,
                                              Long leaderMonsterId,
                                              String leaderMonsterCode,
                                              String leaderMonsterName,
                                              String leaderEffectType,
                                              List<MonsterItem> monsters,
                                              int availableMemberCount,
                                              List<AvailableMember> availableMembers) {
        this.deckId = deckId;
        this.title = title;
        this.leaderMonsterId = leaderMonsterId;
        this.leaderMonsterCode = leaderMonsterCode;
        this.leaderMonsterName = leaderMonsterName;
        this.leaderEffectType = leaderEffectType;
        this.monsters = monsters;
        this.availableMemberCount = availableMemberCount;
        this.availableMembers = availableMembers;
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

    public static class AvailableMember {
        private Long guildMemberId;
        private String displayName;
        private String type; // REAL/VIRTUAL

        public AvailableMember(Long guildMemberId, String displayName, String type) {
            this.guildMemberId = guildMemberId;
            this.displayName = displayName;
            this.type = type;
        }

        public Long getGuildMemberId() { return guildMemberId; }
        public String getDisplayName() { return displayName; }
        public String getType() { return type; }
    }

    public Long getDeckId() { return deckId; }
    public String getTitle() { return title; }
    public Long getLeaderMonsterId() { return leaderMonsterId; }
    public String getLeaderMonsterCode() { return leaderMonsterCode; }
    public String getLeaderMonsterName() { return leaderMonsterName; }
    public String getLeaderEffectType() { return leaderEffectType; }
    public List<MonsterItem> getMonsters() { return monsters; }
    public int getAvailableMemberCount() { return availableMemberCount; }
    public List<AvailableMember> getAvailableMembers() { return availableMembers; }
}

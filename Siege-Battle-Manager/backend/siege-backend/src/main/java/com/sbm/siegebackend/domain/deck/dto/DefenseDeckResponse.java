package com.sbm.siegebackend.domain.deck.dto;

import java.util.List;

public class DefenseDeckResponse {

    private Long deckId;
    private Long ownerMemberId;
    private String ownerName;

    private Long leaderMonsterId;
    private String leaderMonsterCode;
    private String leaderMonsterName;
    private String leaderEffectType;

    private List<MonsterItem> monsters;

    public DefenseDeckResponse(Long deckId,
                               Long ownerMemberId,
                               String ownerName,
                               Long leaderMonsterId,
                               String leaderMonsterCode,
                               String leaderMonsterName,
                               String leaderEffectType,
                               List<MonsterItem> monsters) {
        this.deckId = deckId;
        this.ownerMemberId = ownerMemberId;
        this.ownerName = ownerName;
        this.leaderMonsterId = leaderMonsterId;
        this.leaderMonsterCode = leaderMonsterCode;
        this.leaderMonsterName = leaderMonsterName;
        this.leaderEffectType = leaderEffectType;
        this.monsters = monsters;
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

    public Long getDeckId() { return deckId; }
    public Long getOwnerMemberId() { return ownerMemberId; }
    public String getOwnerName() { return ownerName; }
    public Long getLeaderMonsterId() { return leaderMonsterId; }
    public String getLeaderMonsterCode() { return leaderMonsterCode; }
    public String getLeaderMonsterName() { return leaderMonsterName; }
    public String getLeaderEffectType() { return leaderEffectType; }
    public List<MonsterItem> getMonsters() { return monsters; }
}

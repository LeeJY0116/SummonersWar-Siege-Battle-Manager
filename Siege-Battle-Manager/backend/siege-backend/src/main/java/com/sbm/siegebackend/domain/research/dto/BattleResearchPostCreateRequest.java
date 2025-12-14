package com.sbm.siegebackend.domain.research.dto;

import java.util.List;

public class BattleResearchPostCreateRequest {

    private String title;
    private List<Long> defenseMonsterIds; // 3개

    public BattleResearchPostCreateRequest() {}

    public String getTitle() { return title; }
    public List<Long> getDefenseMonsterIds() { return defenseMonsterIds; }

    public void setTitle(String title) { this.title = title; }
    public void setDefenseMonsterIds(List<Long> defenseMonsterIds) {
        this.defenseMonsterIds = defenseMonsterIds;
    }
}

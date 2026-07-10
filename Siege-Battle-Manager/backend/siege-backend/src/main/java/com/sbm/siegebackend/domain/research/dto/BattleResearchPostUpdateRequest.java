package com.sbm.siegebackend.domain.research.dto;

import java.util.List;

public class BattleResearchPostUpdateRequest {

    private String title;
    private List<String> defenseMonsterCodes;
    private List<Long> defenseMonsterIds; // 3개

    public BattleResearchPostUpdateRequest() {}

    public String getTitle() { return title; }
    public List<String> getDefenseMonsterCodes() { return defenseMonsterCodes; }
    public List<Long> getDefenseMonsterIds() { return defenseMonsterIds; }

    public void setTitle(String title) { this.title = title; }
    public void setDefenseMonsterCodes(List<String> defenseMonsterCodes) {
        this.defenseMonsterCodes = defenseMonsterCodes;
    }
    public void setDefenseMonsterIds(List<Long> defenseMonsterIds) {
        this.defenseMonsterIds = defenseMonsterIds;
    }
}

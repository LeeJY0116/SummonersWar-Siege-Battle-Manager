package com.sbm.siegebackend.domain.deck.dto;

import java.util.List;

public class DefenseDeckCreateRequest {

    private List<Long> monsterIds; // 반드시 3개

    public DefenseDeckCreateRequest() {}

    public List<Long> getMonsterIds() {
        return monsterIds;
    }

    public void setMonsterIds(List<Long> monsterIds) {
        this.monsterIds = monsterIds;
    }
}

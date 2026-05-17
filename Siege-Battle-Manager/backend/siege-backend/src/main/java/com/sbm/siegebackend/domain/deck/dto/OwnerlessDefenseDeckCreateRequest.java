package com.sbm.siegebackend.domain.deck.dto;

import java.util.List;

public class OwnerlessDefenseDeckCreateRequest {

    private String title;
    private List<String> monsterCodes; // 3개

    public OwnerlessDefenseDeckCreateRequest() {}

    public String getTitle() { return title; }

    public List<String> getMonsterCodes() { return monsterCodes; }

    public void setTitle(String title) { this.title = title; }

    public void setMonsterIds(List<Long> monsterIds) { this.monsterCodes = monsterCodes; }
}

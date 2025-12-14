package com.sbm.siegebackend.domain.deck.dto;

import java.util.List;

public class OwnerlessDefenseDeckCreateRequest {

    private String title;
    private List<Long> monsterIds; // 3개

    public OwnerlessDefenseDeckCreateRequest() {}

    public String getTitle() { return title; }

    public List<Long> getMonsterIds() { return monsterIds; }

    public void setTitle(String title) { this.title = title; }

    public void setMonsterIds(List<Long> monsterIds) { this.monsterIds = monsterIds; }
}

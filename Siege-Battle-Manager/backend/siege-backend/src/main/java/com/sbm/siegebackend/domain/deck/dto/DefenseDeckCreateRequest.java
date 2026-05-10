package com.sbm.siegebackend.domain.deck.dto;

import java.util.List;

public class DefenseDeckCreateRequest {

    private List<String> monsterCodes;

    public DefenseDeckCreateRequest() {}

    public List<String> getMonsterCodes() {
        return monsterCodes;
    }

    public void setMonsterCodes(List<String> monsterCodes) {
        this.monsterCodes = monsterCodes;
    }

}

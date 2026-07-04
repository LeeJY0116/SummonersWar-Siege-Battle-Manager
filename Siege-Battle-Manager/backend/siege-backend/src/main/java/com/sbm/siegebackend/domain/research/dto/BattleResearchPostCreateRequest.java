package com.sbm.siegebackend.domain.research.dto;

import java.util.List;

public class BattleResearchPostCreateRequest {

    private String title;
    private List<String> monsterCodes;
    private String content;

    public String getTitle() {
        return title;
    }


    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<String> getMonsterCodes() {
        return monsterCodes;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setMonsterCodes(List<String> monsterCodes) {
        this.monsterCodes = monsterCodes;
    }
}
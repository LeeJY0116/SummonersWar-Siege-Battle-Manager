package com.sbm.siegebackend.domain.research.dto;

import java.util.List;

public class BattleResearchCommentUpdateRequest {

    private List<String> attackMonsterCodes;

    private List<Long> attackMonsterIds; // 0~3
    private String content;

    public BattleResearchCommentUpdateRequest() {}

    public List<String> getAttackMonsterCodes() { return attackMonsterCodes; }
    public List<Long> getAttackMonsterIds() { return attackMonsterIds; }
    public String getContent() { return content; }

    public void setAttackMonsterCodes(List<String> attackMonsterCodes) { this.attackMonsterCodes = attackMonsterCodes; }
    public void setAttackMonsterIds(List<Long> attackMonsterIds) { this.attackMonsterIds = attackMonsterIds; }
    public void setContent(String content) { this.content = content; }
}

package com.sbm.siegebackend.domain.research.dto;

import java.util.List;

public class BattleResearchCommentCreateRequest {

    private List<Long> attackMonsterIds; // 0~3개 가능
    private String content;

    public BattleResearchCommentCreateRequest() {}

    public List<Long> getAttackMonsterIds() { return attackMonsterIds; }
    public String getContent() { return content; }

    public void setAttackMonsterIds(List<Long> attackMonsterIds) { this.attackMonsterIds = attackMonsterIds; }
    public void setContent(String content) { this.content = content; }
}

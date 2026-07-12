package com.sbm.siegebackend.domain.guild.dto;

import java.time.LocalDateTime;

public class UserNicknameHistoryResponse {

    private Long id;
    private String previousNickname;
    private String newNickname;
    private String changedByLoginId;
    private String changeType;
    private LocalDateTime createdAt;

    public UserNicknameHistoryResponse(Long id,
                                       String previousNickname,
                                       String newNickname,
                                       String changedByLoginId,
                                       String changeType,
                                       LocalDateTime createdAt) {
        this.id = id;
        this.previousNickname = previousNickname;
        this.newNickname = newNickname;
        this.changedByLoginId = changedByLoginId;
        this.changeType = changeType;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getPreviousNickname() {
        return previousNickname;
    }

    public String getNewNickname() {
        return newNickname;
    }

    public String getChangedByLoginId() {
        return changedByLoginId;
    }

    public String getChangeType() {
        return changeType;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

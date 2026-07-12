package com.sbm.siegebackend.domain.user.dto;

import com.sbm.siegebackend.domain.guild.GuildMemberStatus;

import java.time.LocalDateTime;

public class UserNicknameChangeRequestResponse {

    private Long id;
    private Long userId;
    private String loginId;
    private String email;
    private String previousNickname;
    private String requestedNickname;
    private GuildMemberStatus status;
    private String reviewedByLoginId;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;

    public UserNicknameChangeRequestResponse(Long id,
                                             Long userId,
                                             String loginId,
                                             String email,
                                             String previousNickname,
                                             String requestedNickname,
                                             GuildMemberStatus status,
                                             String reviewedByLoginId,
                                             LocalDateTime reviewedAt,
                                             LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.loginId = loginId;
        this.email = email;
        this.previousNickname = previousNickname;
        this.requestedNickname = requestedNickname;
        this.status = status;
        this.reviewedByLoginId = reviewedByLoginId;
        this.reviewedAt = reviewedAt;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getLoginId() {
        return loginId;
    }

    public String getEmail() {
        return email;
    }

    public String getPreviousNickname() {
        return previousNickname;
    }

    public String getRequestedNickname() {
        return requestedNickname;
    }

    public GuildMemberStatus getStatus() {
        return status;
    }

    public String getReviewedByLoginId() {
        return reviewedByLoginId;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

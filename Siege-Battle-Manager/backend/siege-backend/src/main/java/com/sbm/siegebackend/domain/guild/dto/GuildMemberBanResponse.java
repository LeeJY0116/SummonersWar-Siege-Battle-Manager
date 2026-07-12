package com.sbm.siegebackend.domain.guild.dto;

import java.time.LocalDateTime;

public class GuildMemberBanResponse {

    private Long id;
    private Long userId;
    private String loginId;
    private String nickname;
    private String reason;
    private String bannedByLoginId;
    private String bannedByNickname;
    private LocalDateTime createdAt;

    public GuildMemberBanResponse(Long id,
                                  Long userId,
                                  String loginId,
                                  String nickname,
                                  String reason,
                                  String bannedByLoginId,
                                  String bannedByNickname,
                                  LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.loginId = loginId;
        this.nickname = nickname;
        this.reason = reason;
        this.bannedByLoginId = bannedByLoginId;
        this.bannedByNickname = bannedByNickname;
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

    public String getNickname() {
        return nickname;
    }

    public String getReason() {
        return reason;
    }

    public String getBannedByLoginId() {
        return bannedByLoginId;
    }

    public String getBannedByNickname() {
        return bannedByNickname;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}

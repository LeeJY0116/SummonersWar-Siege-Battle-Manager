package com.sbm.siegebackend.domain.guild.dto;

import com.sbm.siegebackend.domain.guild.GuildMemberRole;
import com.sbm.siegebackend.domain.guild.GuildMemberStatus;
import com.sbm.siegebackend.domain.guild.GuildMemberType;

public class GuildMemberResponse {

    private Long id;
    private Long userId;
    private String loginId;
    private String email;
    private String nickname;
    private String displayName;
    private GuildMemberRole role;
    private GuildMemberType type;
    private GuildMemberStatus status;
    private boolean realUser;
    private String currentGuildName;

    public GuildMemberResponse(Long id,
                               Long userId,
                               String loginId,
                               String email,
                               String nickname,
                               String displayName,
                               GuildMemberRole role,
                               GuildMemberType type,
                               GuildMemberStatus status,
                               boolean realUser) {
        this(id, userId, loginId, email, nickname, displayName, role, type, status, realUser, null);
    }

    public GuildMemberResponse(Long id,
                               Long userId,
                               String loginId,
                               String email,
                               String nickname,
                               String displayName,
                               GuildMemberRole role,
                               GuildMemberType type,
                               GuildMemberStatus status,
                               boolean realUser,
                               String currentGuildName) {
        this.id = id;
        this.userId = userId;
        this.loginId = loginId;
        this.email = email;
        this.nickname = nickname;
        this.displayName = displayName;
        this.role = role;
        this.type = type;
        this.status = status;
        this.realUser = realUser;
        this.currentGuildName = currentGuildName;
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

    public String getNickname() {
        return nickname;
    }

    public String getDisplayName() {
        return displayName;
    }

    public GuildMemberRole getRole() {
        return role;
    }

    public GuildMemberType getType() {
        return type;
    }

    public GuildMemberStatus getStatus() {
        return status;
    }

    public boolean isRealUser() {
        return realUser;
    }

    public String getCurrentGuildName() {
        return currentGuildName;
    }
}

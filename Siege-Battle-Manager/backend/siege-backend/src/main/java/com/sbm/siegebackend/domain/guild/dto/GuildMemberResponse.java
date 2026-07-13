package com.sbm.siegebackend.domain.guild.dto;

import com.sbm.siegebackend.domain.guild.GuildMemberRole;
import com.sbm.siegebackend.domain.guild.GuildMemberStatus;
import com.sbm.siegebackend.domain.guild.GuildMemberType;

import java.time.LocalDateTime;

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
    private LocalDateTime lastLoginAt;
    private String lastLoginIp;
    private long guildHistoryCount;
    private long nicknameHistoryCount;

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
        this(id, userId, loginId, email, nickname, displayName, role, type, status, realUser, null, null);
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
        this(id, userId, loginId, email, nickname, displayName, role, type, status, realUser, currentGuildName, null);
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
                               String currentGuildName,
                               LocalDateTime lastLoginAt) {
        this(id, userId, loginId, email, nickname, displayName, role, type, status, realUser, currentGuildName, lastLoginAt, null, 0, 0);
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
                               String currentGuildName,
                               LocalDateTime lastLoginAt,
                               String lastLoginIp,
                               long guildHistoryCount,
                               long nicknameHistoryCount) {
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
        this.lastLoginAt = lastLoginAt;
        this.lastLoginIp = lastLoginIp;
        this.guildHistoryCount = guildHistoryCount;
        this.nicknameHistoryCount = nicknameHistoryCount;
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

    public LocalDateTime getLastLoginAt() {
        return lastLoginAt;
    }

    public String getLastLoginIp() {
        return lastLoginIp;
    }

    public long getGuildHistoryCount() {
        return guildHistoryCount;
    }

    public long getNicknameHistoryCount() {
        return nicknameHistoryCount;
    }
}

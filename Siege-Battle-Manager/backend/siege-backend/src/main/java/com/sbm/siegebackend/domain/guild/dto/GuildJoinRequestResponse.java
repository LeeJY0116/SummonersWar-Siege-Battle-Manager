package com.sbm.siegebackend.domain.guild.dto;

import com.sbm.siegebackend.domain.guild.GuildMemberRole;
import com.sbm.siegebackend.domain.guild.GuildMemberStatus;

import java.time.LocalDateTime;

public class GuildJoinRequestResponse {

    private Long memberId;
    private String requestSource;
    private Long guildId;
    private String guildName;
    private Long userId;
    private String loginId;
    private String nickname;
    private String email;
    private String displayName;
    private GuildMemberRole role;
    private GuildMemberStatus status;
    private LocalDateTime requestedAt;

    public GuildJoinRequestResponse(Long memberId,
                                    String requestSource,
                                    Long guildId,
                                    String guildName,
                                    Long userId,
                                    String loginId,
                                    String nickname,
                                    String email,
                                    String displayName,
                                    GuildMemberRole role,
                                    GuildMemberStatus status,
                                    LocalDateTime requestedAt) {
        this.memberId = memberId;
        this.requestSource = requestSource;
        this.guildId = guildId;
        this.guildName = guildName;
        this.userId = userId;
        this.loginId = loginId;
        this.nickname = nickname;
        this.email = email;
        this.displayName = displayName;
        this.role = role;
        this.status = status;
        this.requestedAt = requestedAt;
    }

    public Long getMemberId() {
        return memberId;
    }

    public String getRequestSource() {
        return requestSource;
    }

    public Long getGuildId() {
        return guildId;
    }

    public String getGuildName() {
        return guildName;
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

    public String getEmail() {
        return email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public GuildMemberRole getRole() {
        return role;
    }

    public GuildMemberStatus getStatus() {
        return status;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }
}

package com.sbm.siegebackend.domain.guild.dto;

import com.sbm.siegebackend.domain.guild.GuildMemberRole;
import com.sbm.siegebackend.domain.guild.GuildMemberStatus;

import java.time.LocalDateTime;

public class GuildMemberHistoryResponse {

    private Long memberId;
    private Long guildId;
    private String guildName;
    private String displayName;
    private GuildMemberRole role;
    private GuildMemberStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public GuildMemberHistoryResponse(Long memberId,
                                      Long guildId,
                                      String guildName,
                                      String displayName,
                                      GuildMemberRole role,
                                      GuildMemberStatus status,
                                      LocalDateTime createdAt,
                                      LocalDateTime updatedAt) {
        this.memberId = memberId;
        this.guildId = guildId;
        this.guildName = guildName;
        this.displayName = displayName;
        this.role = role;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getMemberId() {
        return memberId;
    }

    public Long getGuildId() {
        return guildId;
    }

    public String getGuildName() {
        return guildName;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}

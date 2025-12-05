package com.sbm.siegebackend.domain.guild.dto;

import com.sbm.siegebackend.domain.guild.GuildMemberRole;
import com.sbm.siegebackend.domain.guild.GuildMemberType;

public class GuildMemberResponse {

    private Long id;
    private String displayName;
    private GuildMemberRole role;
    private GuildMemberType type;
    private boolean realUser;   // 실제 사이트 계정인지 여부

    public GuildMemberResponse(Long id,
                               String displayName,
                               GuildMemberRole role,
                               GuildMemberType type,
                               boolean realUser) {
        this.id = id;
        this.displayName = displayName;
        this.role = role;
        this.type = type;
        this.realUser = realUser;
    }

    public Long getId() {
        return id;
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

    public boolean isRealUser() {
        return realUser;
    }
}

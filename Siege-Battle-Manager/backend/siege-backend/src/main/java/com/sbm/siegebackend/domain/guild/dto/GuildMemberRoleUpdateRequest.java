package com.sbm.siegebackend.domain.guild.dto;

import com.sbm.siegebackend.domain.guild.GuildMemberRole;

public class GuildMemberRoleUpdateRequest {

    private GuildMemberRole role;

    public GuildMemberRoleUpdateRequest() {
    }

    public GuildMemberRole getRole() {
        return role;
    }

    public void setRole(GuildMemberRole role) {
        this.role = role;
    }
}

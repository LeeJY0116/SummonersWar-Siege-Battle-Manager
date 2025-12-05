package com.sbm.siegebackend.domain.guild.dto;

public class GuildMemberCreateRequest {

    private String displayName; // 임의 길드원의 이름

    public GuildMemberCreateRequest() {}

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
}

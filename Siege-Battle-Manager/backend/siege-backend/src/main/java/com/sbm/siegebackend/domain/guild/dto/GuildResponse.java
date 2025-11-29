package com.sbm.siegebackend.domain.guild.dto;

public class GuildResponse {

    private Long id;
    private String name;
    private String description;
    private String masterNickname;
    private int memberCount;

    public GuildResponse(Long id, String name, String description,
                         String masterNickname, int memberCount) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.masterNickname = masterNickname;
        this.memberCount = memberCount;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getMasterNickname() {
        return masterNickname;
    }

    public int getMemberCount() {
        return memberCount;
    }
}

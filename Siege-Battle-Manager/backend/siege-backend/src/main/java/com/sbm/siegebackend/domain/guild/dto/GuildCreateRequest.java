package com.sbm.siegebackend.domain.guild.dto;

public class GuildCreateRequest {

    private String name;
    private String description;

    public GuildCreateRequest() {
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}

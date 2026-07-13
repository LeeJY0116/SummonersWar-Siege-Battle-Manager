package com.sbm.siegebackend.domain.guild.dto;

public class ExistingGuildCreateRequestCreateRequest {

    private String guildName;
    private String guildNameConfirm;

    public String getGuildName() {
        return guildName;
    }

    public void setGuildName(String guildName) {
        this.guildName = guildName;
    }

    public String getGuildNameConfirm() {
        return guildNameConfirm;
    }

    public void setGuildNameConfirm(String guildNameConfirm) {
        this.guildNameConfirm = guildNameConfirm;
    }
}

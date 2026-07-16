package com.sbm.siegebackend.domain.guild.dto;

public class GuildMemberInventoryItemResponse {

    private String monsterCode;
    private int quantity;

    public GuildMemberInventoryItemResponse(String monsterCode,
                                            int quantity) {

        this.monsterCode = monsterCode;
        this.quantity = quantity;
    }

    public String getMonsterCode() { return monsterCode; }

    public int getQuantity() { return quantity; }
}

package com.sbm.siegebackend.domain.guild.dto;

public class GuildMemberInventoryItemResponse {

    private Long monsterId;
    private String monsterCode;
    private String monsterName;
    private String attribute;
    private int quantity;

    public GuildMemberInventoryItemResponse(Long monsterId,
                                            String monsterCode,
                                            String monsterName,
                                            String attribute,
                                            int quantity) {

        this.monsterId = monsterId;
        this.monsterCode = monsterCode;
        this.monsterName = monsterName;
        this.attribute = attribute;
        this.quantity = quantity;
    }

    public Long getMonsterId() { return monsterId; }

    public String getMonsterCode() { return monsterCode; }

    public String getMonsterName() { return monsterName; }

    public String getAttribute() { return attribute; }

    public int getQuantity() { return quantity; }
}

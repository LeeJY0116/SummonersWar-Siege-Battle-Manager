package com.sbm.siegebackend.domain.guild.dto;

import java.util.List;

public class GuildMemberInventoryUpdateRequest {

    private List<Item> items;

    public GuildMemberInventoryUpdateRequest() {}

    public List<Item> getItems() {
        return items;
    }

    public void setItems(List<Item> items) {
        this.items = items;
    }

    public static class Item {
        private String monsterCode;
        private int quantity;

        public Item() {}

        public String getMonsterCode() {
            return monsterCode;
        }

        public int getQuantity() {
            return quantity;
        }

        public void setMonsterCode(String monsterCode) {
            this.monsterCode = monsterCode;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }
    }
}

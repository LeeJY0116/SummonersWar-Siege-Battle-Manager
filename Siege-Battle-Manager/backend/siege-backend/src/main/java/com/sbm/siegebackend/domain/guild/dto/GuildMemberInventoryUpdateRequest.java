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
        private Long monsterId;
        private int quantity;

        public Item() {}

        public Long getMonsterId() {
            return monsterId;
        }

        public int getQuantity() {
            return quantity;
        }

        public void setMonsterId(Long monsterId) {
            this.monsterId = monsterId;
        }

        public void setQuantity(int quantity) {
            this.quantity = quantity;
        }
    }
}

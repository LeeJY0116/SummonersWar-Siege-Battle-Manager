package com.sbm.siegebackend.domain.research.dto;

import java.util.List;

public class BattleResearchPostPageResponse {

    private List<BattleResearchPostListItemResponse> items;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;

    public BattleResearchPostPageResponse(List<BattleResearchPostListItemResponse> items,
                                          int page,
                                          int size,
                                          long totalElements,
                                          int totalPages) {
        this.items = items;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
    }

    public List<BattleResearchPostListItemResponse> getItems() {
        return items;
    }

    public int getPage() {
        return page;
    }

    public int getSize() {
        return size;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public int getTotalPages() {
        return totalPages;
    }
}

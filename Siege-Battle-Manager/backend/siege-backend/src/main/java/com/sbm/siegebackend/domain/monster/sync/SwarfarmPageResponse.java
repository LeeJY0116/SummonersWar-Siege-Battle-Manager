package com.sbm.siegebackend.domain.monster.sync;

import java.util.List;

public class SwarfarmPageResponse<T> {

    private Integer count;
    private String next;
    private String previous;
    private List<T> results;

    public Integer getCount() {
        return count;
    }

    public String getNext() {
        return next;
    }

    public String getPrevious() {
        return previous;
    }

    public List<T> getResults() {
        return results;
    }
}
package com.sbm.siegebackend.domain.user.dto;

public class UserNicknameChangeRequestCreateRequest {

    private String requestedNickname;

    public String getRequestedNickname() {
        return requestedNickname;
    }

    public void setRequestedNickname(String requestedNickname) {
        this.requestedNickname = requestedNickname;
    }
}

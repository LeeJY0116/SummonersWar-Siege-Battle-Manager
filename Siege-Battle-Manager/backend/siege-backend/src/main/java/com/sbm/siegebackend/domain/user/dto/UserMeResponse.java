package com.sbm.siegebackend.domain.user.dto;

public class UserMeResponse {

    private Long id;
    private String loginId;
    private String email;
    private String nickname;
    private String role;

    public UserMeResponse(Long id, String loginId, String email, String nickname, String role) {
        this.id = id;
        this.loginId = loginId;
        this.email = email;
        this.nickname = nickname;
        this.role = role;
    }

    public Long getId() {
        return id;
    }

    public String getLoginId() {
        return loginId;
    }

    public String getEmail() {
        return email;
    }

    public String getNickname() {
        return nickname;
    }

    public String getRole() {
        return role;
    }
}

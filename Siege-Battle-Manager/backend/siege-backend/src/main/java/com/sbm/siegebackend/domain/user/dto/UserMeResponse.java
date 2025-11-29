package com.sbm.siegebackend.domain.user.dto;

public class UserMeResponse {

    private Long id;
    private String email;
    private String nickname;
    private String role;

    public UserMeResponse(Long id, String email, String nickname, String role) {
        this.id = id;
        this.email = email;
        this.nickname = nickname;
        this.role = role;
    }

    public Long getId() {
        return id;
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

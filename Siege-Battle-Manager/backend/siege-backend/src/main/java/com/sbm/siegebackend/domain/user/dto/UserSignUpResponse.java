package com.sbm.siegebackend.domain.user.dto;

/**
 * 회원가입 응답 DTO
 */
public class UserSignUpResponse {

    private Long id;
    private String email;
    private String nickname;

    public UserSignUpResponse(Long id, String email, String nickname) {
        this.id = id;
        this.email = email;
        this.nickname = nickname;
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
}

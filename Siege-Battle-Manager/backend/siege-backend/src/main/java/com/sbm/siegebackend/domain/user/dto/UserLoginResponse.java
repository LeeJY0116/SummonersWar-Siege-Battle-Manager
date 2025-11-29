package com.sbm.siegebackend.domain.user.dto;

/**
 * 로그인 응답 DTO
 */
public class UserLoginResponse {

    private Long userId;
    private String email;
    private String nickname;
    private String token; // 나중에 JWT 토큰 들어갈 자리

    public UserLoginResponse(Long userId, String email, String nickname, String token) {
        this.userId = userId;
        this.email = email;
        this.nickname = nickname;
        this.token = token;
    }

    public Long getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getNickname() {
        return nickname;
    }

    public String getToken() {
        return token;
    }
}

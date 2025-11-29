package com.sbm.siegebackend.domain.user.dto;

/**
 * 회원가입 요청 DTO
 */
public class UserSignUpRequest {

    private String email;
    private String password;   // 평문 비밀번호 (서비스에서 해시)
    private String nickname;

    public UserSignUpRequest() {
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public String getNickname() {
        return nickname;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }
}

package com.sbm.siegebackend.domain.user.dto;

/**
 * 로그인 요청 DTO
 */
public class UserLoginRequest {

    private String email;
    private String password;

    public UserLoginRequest() {
    }

    public String getEmail() {
        return email;
    }

    public String getPassword() {
        return password;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

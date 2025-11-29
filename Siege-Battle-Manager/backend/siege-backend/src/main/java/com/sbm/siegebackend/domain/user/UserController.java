package com.sbm.siegebackend.domain.user;

import com.sbm.siegebackend.domain.user.dto.UserLoginRequest;
import com.sbm.siegebackend.domain.user.dto.UserLoginResponse;
import com.sbm.siegebackend.domain.user.dto.UserSignUpRequest;
import com.sbm.siegebackend.domain.user.dto.UserSignUpResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.sbm.siegebackend.domain.user.dto.UserMeResponse;
import org.springframework.security.core.Authentication;

/**
 * User 관련 REST API 컨트롤러
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    // 생성자 주입
    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * 회원가입 API
     * POST /api/users/signup
     */
    @PostMapping("/signup")
    public ResponseEntity<UserSignUpResponse> signUp(@RequestBody UserSignUpRequest request) {
        UserSignUpResponse response = userService.signUp(request);
        return ResponseEntity.ok(response);
    }

    /**
     * 로그인 API
     * POST /api/users/login
     */
    @PostMapping("/login")
    public ResponseEntity<UserLoginResponse> login(@RequestBody UserLoginRequest request) {
        UserLoginResponse response = userService.login(request);
        return ResponseEntity.ok(response);
    }


    /**
     * 내 정보 조회 (JWT 필요)
     * GET /api/users/me
     */
    @GetMapping("/me")
    public ResponseEntity<UserMeResponse> me(Authentication authentication) {
        // JwtAuthenticationFilter에서 principal에 email을 넣어줬음
        String email = (String) authentication.getPrincipal();

        User user = userService.findByEmailOrThrow(email);

        UserMeResponse response = new UserMeResponse(
                user.getId(),
                user.getEmail(),
                user.getNickname(),
                user.getRole().name()
        );

        return ResponseEntity.ok(response);
    }
}

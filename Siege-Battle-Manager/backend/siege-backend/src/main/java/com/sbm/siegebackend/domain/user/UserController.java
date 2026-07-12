package com.sbm.siegebackend.domain.user;

import com.sbm.siegebackend.domain.user.dto.UserLoginRequest;
import com.sbm.siegebackend.domain.user.dto.UserLoginResponse;
import com.sbm.siegebackend.domain.user.dto.UserNicknameChangeRequestCreateRequest;
import com.sbm.siegebackend.domain.user.dto.UserNicknameChangeRequestResponse;
import com.sbm.siegebackend.domain.user.dto.UserSignUpRequest;
import com.sbm.siegebackend.domain.user.dto.UserSignUpResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.sbm.siegebackend.domain.user.dto.UserMeResponse;
import org.springframework.security.core.Authentication;
import com.sbm.siegebackend.global.api.ApiResponse;

import java.util.List;


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
    public ResponseEntity<ApiResponse<UserSignUpResponse>> signUp(@RequestBody UserSignUpRequest request) {
        UserSignUpResponse response = userService.signUp(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 로그인 API
     * POST /api/users/login
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserLoginResponse>> login(@RequestBody UserLoginRequest request) {
        UserLoginResponse response = userService.login(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }


    /**
     * 내 정보 조회 (JWT 필요)
     * GET /api/users/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserMeResponse>> me(Authentication authentication) {
        String loginId = (String) authentication.getPrincipal();

        User user = userService.findByLoginIdOrThrow(loginId);

        UserMeResponse response = new UserMeResponse(
                user.getId(),
                user.getLoginId(),
                user.getEmail(),
                user.getNickname(),
                user.getRole().name()
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/me/nickname-change-requests")
    public ResponseEntity<ApiResponse<UserNicknameChangeRequestResponse>> requestNicknameChange(
            Authentication authentication,
            @RequestBody UserNicknameChangeRequestCreateRequest request
    ) {
        String loginId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                userService.requestNicknameChange(loginId, request.getRequestedNickname())
        ));
    }

    @GetMapping("/me/nickname-change-requests/pending")
    public ResponseEntity<ApiResponse<UserNicknameChangeRequestResponse>> getMyPendingNicknameChangeRequest(
            Authentication authentication
    ) {
        String loginId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                userService.getMyPendingNicknameChangeRequest(loginId)
        ));
    }

    @DeleteMapping("/me/nickname-change-requests/pending")
    public ResponseEntity<ApiResponse<Void>> cancelMyPendingNicknameChangeRequest(Authentication authentication) {
        String loginId = (String) authentication.getPrincipal();
        userService.cancelMyPendingNicknameChangeRequest(loginId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/admin/nickname-change-requests")
    public ResponseEntity<ApiResponse<List<UserNicknameChangeRequestResponse>>> getPendingNicknameChangeRequests(
            Authentication authentication
    ) {
        String loginId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                userService.getPendingNicknameChangeRequests(loginId)
        ));
    }

    @PostMapping("/admin/nickname-change-requests/{requestId}/approve")
    public ResponseEntity<ApiResponse<Void>> approveNicknameChangeRequest(
            Authentication authentication,
            @PathVariable Long requestId
    ) {
        String loginId = (String) authentication.getPrincipal();
        userService.approveNicknameChangeRequest(loginId, requestId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/admin/nickname-change-requests/{requestId}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectNicknameChangeRequest(
            Authentication authentication,
            @PathVariable Long requestId
    ) {
        String loginId = (String) authentication.getPrincipal();
        userService.rejectNicknameChangeRequest(loginId, requestId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}

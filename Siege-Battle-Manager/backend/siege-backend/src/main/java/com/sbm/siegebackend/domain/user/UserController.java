package com.sbm.siegebackend.domain.user;

import com.sbm.siegebackend.domain.guild.GuildService;
import com.sbm.siegebackend.domain.guild.dto.GuildBootstrapResponse;
import com.sbm.siegebackend.domain.guild.dto.GuildMemberResponse;
import com.sbm.siegebackend.domain.guild.dto.GuildResponse;
import com.sbm.siegebackend.domain.user.dto.UserBootstrapResponse;
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
import org.springframework.transaction.annotation.Transactional;
import com.sbm.siegebackend.global.api.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import com.sbm.siegebackend.global.exception.NotFoundException;

import java.util.List;


/**
 * User 관련 REST API 컨트롤러
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final GuildService guildService;

    // 생성자 주입
    public UserController(UserService userService, GuildService guildService) {
        this.userService = userService;
        this.guildService = guildService;
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
    public ResponseEntity<ApiResponse<UserLoginResponse>> login(
            @RequestBody UserLoginRequest request,
            HttpServletRequest httpRequest
    ) {
        UserLoginResponse response = userService.login(request, resolveClientIp(httpRequest));
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String cloudflareIp = request.getHeader("CF-Connecting-IP");
        if (cloudflareIp != null && !cloudflareIp.isBlank()) {
            return normalizeIp(cloudflareIp.trim());
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return normalizeIp(forwardedFor.split(",")[0].trim());
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return normalizeIp(realIp.trim());
        }

        return normalizeIp(request.getRemoteAddr());
    }

    private String normalizeIp(String ip) {
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            return "127.0.0.1";
        }
        if (ip != null && ip.startsWith("::ffff:")) {
            return ip.substring("::ffff:".length());
        }
        return ip;
    }


    /**
     * 내 정보 조회 (JWT 필요)
     * GET /api/users/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserMeResponse>> me(Authentication authentication) {
        String loginId = (String) authentication.getPrincipal();

        User user = userService.findByLoginIdOrThrow(loginId);

        UserMeResponse response = toMeResponse(user);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/bootstrap")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<UserBootstrapResponse>> bootstrap(Authentication authentication) {
        String loginId = (String) authentication.getPrincipal();
        User user = userService.findByLoginIdOrThrow(loginId);
        GuildResponse guild = null;
        List<GuildMemberResponse> members = List.of();

        try {
            GuildBootstrapResponse guildBootstrap = guildService.getMyGuildBootstrap(user);
            guild = guildBootstrap.guild();
            members = guildBootstrap.members();
        } catch (NotFoundException ignored) {
            // 길드가 없는 사용자는 내 정보만 내려준다.
        }

        return ResponseEntity.ok(ApiResponse.success(
                new UserBootstrapResponse(toMeResponse(user), guild, members)
        ));
    }

    private UserMeResponse toMeResponse(User user) {
        return new UserMeResponse(
                user.getId(),
                user.getLoginId(),
                user.getEmail(),
                user.getNickname(),
                user.getRole().name()
        );
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

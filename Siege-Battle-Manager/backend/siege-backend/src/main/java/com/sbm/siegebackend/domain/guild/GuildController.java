package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.guild.dto.GuildCreateRequest;
import com.sbm.siegebackend.domain.guild.dto.GuildMemberResponse;
import com.sbm.siegebackend.domain.guild.dto.GuildResponse;
import com.sbm.siegebackend.global.api.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guilds")
public class GuildController {

    private final GuildService guildService;

    public GuildController(GuildService guildService) {
        this.guildService = guildService;


    }

    /**
     * 길드 생성 (JWT 필요)
     * POST /api/guilds
     */
    @PostMapping
    public ResponseEntity<ApiResponse<GuildResponse>> createGuild(
            Authentication authentication,
            @RequestBody GuildCreateRequest request
    ) {
        String email = (String) authentication.getPrincipal();

        GuildResponse response = guildService.createGuild(email, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 길드 목록 조회 (관리자 전용)
     * GET /api/guilds
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<GuildResponse>>> getGuilds(Authentication authentication) {
        String loginId = (String) authentication.getPrincipal();
        List<GuildResponse> guilds = guildService.getAllGuilds(loginId);
        return ResponseEntity.ok(ApiResponse.success(guilds));
    }

    /**
     * 내가 가입한 길드 정보 조회
     * GET /api/guilds/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<GuildResponse>> getMyGuild(Authentication authentication) {
        String email = (String) authentication.getPrincipal();
        GuildResponse response = guildService.getMyGuild(email);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me/members")
    public ResponseEntity<ApiResponse<List<GuildMemberResponse>>> getMyGuildMembers(
            Authentication authentication
    ) {
        String email = (String) authentication.getPrincipal();
        List<GuildMemberResponse> members = guildService.getMyGuildMembers(email);
        return ResponseEntity.ok(ApiResponse.success(members));
    }

    @DeleteMapping("/me/membership")
    public ResponseEntity<ApiResponse<Void>> leaveMyGuild(Authentication authentication) {
        String email = (String) authentication.getPrincipal();
        guildService.leaveMyGuild(email);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

}

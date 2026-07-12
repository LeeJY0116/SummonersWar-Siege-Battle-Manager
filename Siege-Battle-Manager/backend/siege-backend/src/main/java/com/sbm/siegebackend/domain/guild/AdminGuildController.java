package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.guild.dto.GuildMemberResponse;
import com.sbm.siegebackend.domain.guild.dto.GuildMemberHistoryResponse;
import com.sbm.siegebackend.domain.guild.dto.GuildResponse;
import com.sbm.siegebackend.domain.guild.dto.UserNicknameHistoryResponse;
import com.sbm.siegebackend.global.api.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/guilds")
public class AdminGuildController {

    private final GuildService guildService;

    public AdminGuildController(GuildService guildService) {
        this.guildService = guildService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<GuildResponse>>> getAdminGuilds(Authentication authentication) {
        String loginId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(guildService.getAdminGuilds(loginId)));
    }

    @GetMapping("/{guildId}/members")
    public ResponseEntity<ApiResponse<List<GuildMemberResponse>>> getAdminGuildMembers(
            Authentication authentication,
            @PathVariable Long guildId
    ) {
        String loginId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(guildService.getAdminGuildMembers(loginId, guildId)));
    }

    @GetMapping("/members/{guildMemberId}/history")
    public ResponseEntity<ApiResponse<List<GuildMemberHistoryResponse>>> getAdminGuildMemberHistory(
            Authentication authentication,
            @PathVariable Long guildMemberId
    ) {
        String loginId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                guildService.getAdminGuildMemberHistory(loginId, guildMemberId)
        ));
    }

    @GetMapping("/members/{guildMemberId}/nickname-histories")
    public ResponseEntity<ApiResponse<List<UserNicknameHistoryResponse>>> getAdminNicknameHistories(
            Authentication authentication,
            @PathVariable Long guildMemberId
    ) {
        String loginId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                guildService.getAdminNicknameHistories(loginId, guildMemberId)
        ));
    }
}

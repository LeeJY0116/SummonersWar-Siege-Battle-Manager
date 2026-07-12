package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.guild.dto.GuildJoinRequestResponse;
import com.sbm.siegebackend.global.api.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class GuildApprovalController {

    private final GuildApprovalService guildApprovalService;

    public GuildApprovalController(GuildApprovalService guildApprovalService) {
        this.guildApprovalService = guildApprovalService;
    }

    @GetMapping("/api/admin/guild-join-requests/masters")
    public ResponseEntity<ApiResponse<List<GuildJoinRequestResponse>>> getPendingMasterRequests(
            Authentication authentication
    ) {
        String loginId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                guildApprovalService.getPendingMasterRequests(loginId)
        ));
    }

    @PostMapping("/api/admin/guild-join-requests/{memberId}/approve")
    public ResponseEntity<ApiResponse<Void>> approveMasterRequest(
            Authentication authentication,
            @PathVariable Long memberId
    ) {
        String loginId = (String) authentication.getPrincipal();
        guildApprovalService.approveMasterRequest(loginId, memberId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/api/admin/guild-join-requests/{memberId}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectMasterRequest(
            Authentication authentication,
            @PathVariable Long memberId
    ) {
        String loginId = (String) authentication.getPrincipal();
        guildApprovalService.rejectMasterRequest(loginId, memberId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/api/guilds/me/join-requests")
    public ResponseEntity<ApiResponse<List<GuildJoinRequestResponse>>> getPendingMemberRequests(
            Authentication authentication
    ) {
        String loginId = (String) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                guildApprovalService.getPendingMemberRequests(loginId)
        ));
    }

    @PostMapping("/api/guilds/me/join-requests/{memberId}/approve")
    public ResponseEntity<ApiResponse<Void>> approveMemberRequest(
            Authentication authentication,
            @PathVariable Long memberId
    ) {
        String loginId = (String) authentication.getPrincipal();
        guildApprovalService.approveMemberRequest(loginId, memberId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PostMapping("/api/guilds/me/join-requests/{memberId}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectMemberRequest(
            Authentication authentication,
            @PathVariable Long memberId
    ) {
        String loginId = (String) authentication.getPrincipal();
        guildApprovalService.rejectMemberRequest(loginId, memberId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}

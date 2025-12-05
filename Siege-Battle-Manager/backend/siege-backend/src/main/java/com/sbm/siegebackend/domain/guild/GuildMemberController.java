package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.guild.dto.GuildMemberCreateRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.sbm.siegebackend.domain.guild.dto.GuildMemberResponse;
import java.util.List;

@RestController
@RequestMapping("/api/guild-members")
public class GuildMemberController {

    private final GuildMemberService guildMemberService;

    public GuildMemberController(GuildMemberService guildMemberService) {
        this.guildMemberService = guildMemberService;
    }

    /**
     * 임의 길드원 추가
     */
    @PostMapping("/{guildId}/virtual")
    public ResponseEntity<?> addVirtualMember(
            @PathVariable Long guildId,
            @RequestBody GuildMemberCreateRequest request,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        GuildMember member = guildMemberService.addVirtualMember(guildId, email, request);
        return ResponseEntity.ok(member.getId());
    }

    /**
     * 임의 길드원 삭제
     */
    @DeleteMapping("/{guildMemberId}")
    public ResponseEntity<?> deleteVirtualMember(
            @PathVariable Long guildMemberId,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        guildMemberService.deleteVirtualMember(guildMemberId, email);
        return ResponseEntity.ok().build();
    }

    /**
     * 내가 속한 길드의 멤버 목록 조회 (REAL + VIRTUAL 전부)
     * GET /api/guild-members/me
     */
    @GetMapping("/me")
    public ResponseEntity<List<GuildMemberResponse>> getMyGuildMembers(
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        List<GuildMemberResponse> members = guildMemberService.getMembersOfMyGuild(email);
        return ResponseEntity.ok(members);
    }
}

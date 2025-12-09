package com.sbm.siegebackend.domain.guild;

import com.sbm.siegebackend.domain.guild.dto.GuildMemberInventoryItemResponse;
import com.sbm.siegebackend.domain.guild.dto.GuildMemberInventoryUpdateRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guild-members")
public class GuildMemberInventoryController {

    private final GuildMemberInventoryService inventoryService;

    public GuildMemberInventoryController(GuildMemberInventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /**
     * 특정 길드원의 인벤 조회
     * GET /api/guild-members/{guildMemberId}/inventory
     */
    @GetMapping("/{guildMemberId}/inventory")
    public ResponseEntity<List<GuildMemberInventoryItemResponse>> getInventory(
            @PathVariable Long guildMemberId,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        List<GuildMemberInventoryItemResponse> items =
                inventoryService.getInventory(guildMemberId, email);
        return ResponseEntity.ok(items);
    }

    /**
     * 특정 길드원의 인벤 수정
     * PUT /api/guild-members/{guildMemberId}/inventory
     */
    @PutMapping("/{guildMemberId}/inventory")
    public ResponseEntity<Void> updateInventory(
            @PathVariable Long guildMemberId,
            @RequestBody GuildMemberInventoryUpdateRequest request,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        inventoryService.updateInventory(guildMemberId, email, request);
        return ResponseEntity.ok().build();
    }
}

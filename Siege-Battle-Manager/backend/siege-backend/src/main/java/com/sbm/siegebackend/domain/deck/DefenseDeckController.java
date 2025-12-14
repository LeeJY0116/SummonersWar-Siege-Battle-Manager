package com.sbm.siegebackend.domain.deck;

import com.sbm.siegebackend.domain.deck.dto.DefenseDeckCreateRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.sbm.siegebackend.domain.deck.dto.DefenseDeckResponse;
import java.util.List;
import com.sbm.siegebackend.global.api.ApiResponse;


@RestController
@RequestMapping("/api/defense-decks")
public class DefenseDeckController {

    private final DefenseDeckService defenseDeckService;

    public DefenseDeckController(DefenseDeckService defenseDeckService) {
        this.defenseDeckService = defenseDeckService;
    }

    /**
     * 방덱 생성
     */
    @PostMapping("/{guildMemberId}")
    public ResponseEntity<ApiResponse<Long>> createDeck(
            @PathVariable Long guildMemberId,
            @RequestBody DefenseDeckCreateRequest request,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        Long deckId = defenseDeckService.createDeck(guildMemberId, email, request);
        return ResponseEntity.ok(ApiResponse.success(deckId));
    }

    /**
     * 방덱 삭제
     */
    @DeleteMapping("/{deckId}")
    public ResponseEntity<ApiResponse<Void>> deleteDeck(
            @PathVariable Long deckId,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        defenseDeckService.deleteDeck(deckId, email);
        return ResponseEntity.ok(ApiResponse.success());
    }

    /**
     * 길드 방덱 목록 조회 + 필터
     *
     * GET /api/defense-decks
     * ?monsterId=
     * &leaderEffect=
     * &ownerMemberId=
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DefenseDeckResponse>>> getDecks(
            @RequestParam(required = false) Long monsterId,
            @RequestParam(required = false) String leaderEffect,
            @RequestParam(required = false) Long ownerMemberId,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        var decks =
                defenseDeckService.getGuildDecks(email, monsterId, leaderEffect, ownerMemberId);
        return ResponseEntity.ok(ApiResponse.success(decks));
    }
}

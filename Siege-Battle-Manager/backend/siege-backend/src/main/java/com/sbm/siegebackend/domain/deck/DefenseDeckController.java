package com.sbm.siegebackend.domain.deck;

import com.sbm.siegebackend.domain.deck.dto.DefenseDeckCreateRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<Long> createDeck(
            @PathVariable Long guildMemberId,
            @RequestBody DefenseDeckCreateRequest request,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        Long deckId = defenseDeckService.createDeck(guildMemberId, email, request);
        return ResponseEntity.ok(deckId);
    }

    /**
     * 방덱 삭제
     */
    @DeleteMapping("/{deckId}")
    public ResponseEntity<Void> deleteDeck(
            @PathVariable Long deckId,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        defenseDeckService.deleteDeck(deckId, email);
        return ResponseEntity.ok().build();
    }
}

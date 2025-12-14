package com.sbm.siegebackend.domain.deck;

import com.sbm.siegebackend.domain.deck.dto.OwnerlessDefenseDeckCreateRequest;
import com.sbm.siegebackend.domain.deck.dto.OwnerlessDefenseDeckDetailResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ownerless-defense-decks")
public class OwnerlessDefenseDeckController {

    private final OwnerlessDefenseDeckService service;

    public OwnerlessDefenseDeckController(OwnerlessDefenseDeckService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Long> create(
            @RequestBody OwnerlessDefenseDeckCreateRequest request,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        Long id = service.create(email, request);
        return ResponseEntity.ok(id);
    }

    @GetMapping("/{deckId}")
    public ResponseEntity<OwnerlessDefenseDeckDetailResponse> detail(
            @PathVariable Long deckId,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(service.getDetail(email, deckId));
    }

    @DeleteMapping("/{deckId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long deckId,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        service.delete(email, deckId);
        return ResponseEntity.ok().build();
    }
}

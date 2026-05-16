package com.sbm.siegebackend.domain.deck;

import com.sbm.siegebackend.domain.deck.dto.OwnerlessDefenseDeckCreateRequest;
import com.sbm.siegebackend.domain.deck.dto.OwnerlessDefenseDeckDetailResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.sbm.siegebackend.global.api.ApiResponse;
import java.util.List;


@RestController
@RequestMapping("/api/ownerless-defense-decks")
public class OwnerlessDefenseDeckController {

    private final OwnerlessDefenseDeckService service;

    public OwnerlessDefenseDeckController(OwnerlessDefenseDeckService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Long>> create(
            @RequestBody OwnerlessDefenseDeckCreateRequest request,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        Long id = service.create(email, request);
        return ResponseEntity.ok(ApiResponse.success(id));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OwnerlessDefenseDeckDetailResponse>>> list(
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();

        List<OwnerlessDefenseDeckDetailResponse> decks =
                service.getList(email);

        return ResponseEntity.ok(ApiResponse.success(decks));
    }

    @DeleteMapping("/{deckId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long deckId,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        service.delete(email, deckId);
        return ResponseEntity.ok(ApiResponse.success());
    }
}

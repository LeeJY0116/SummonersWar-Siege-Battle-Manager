package com.sbm.siegebackend.domain.research;

import com.sbm.siegebackend.domain.research.dto.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/research")
public class BattleResearchController {

    private final BattleResearchService service;

    public BattleResearchController(BattleResearchService service) {
        this.service = service;
    }

    // ===== Posts =====

    @PostMapping("/posts")
    public ResponseEntity<Long> createPost(
            @RequestBody BattleResearchPostCreateRequest request,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(service.createPost(email, request));
    }

    @GetMapping("/posts")
    public ResponseEntity<List<BattleResearchPostListItemResponse>> listPosts(
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(service.listPosts(email));
    }

    @GetMapping("/posts/{postId}")
    public ResponseEntity<BattleResearchPostDetailResponse> detail(
            @PathVariable Long postId,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(service.getPostDetail(email, postId));
    }

    @PutMapping("/posts/{postId}")
    public ResponseEntity<Void> updatePost(
            @PathVariable Long postId,
            @RequestBody BattleResearchPostUpdateRequest request,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        service.updatePost(email, postId, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long postId,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        service.deletePost(email, postId);
        return ResponseEntity.ok().build();
    }

    // ===== Comments =====

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<Long> createComment(
            @PathVariable Long postId,
            @RequestBody BattleResearchCommentCreateRequest request,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        return ResponseEntity.ok(service.createComment(email, postId, request));
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<Void> updateComment(
            @PathVariable Long commentId,
            @RequestBody BattleResearchCommentUpdateRequest request,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        service.updateComment(email, commentId, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        service.deleteComment(email, commentId);
        return ResponseEntity.ok().build();
    }
}

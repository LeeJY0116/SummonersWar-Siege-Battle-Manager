package com.sbm.siegebackend.domain.research;

import com.sbm.siegebackend.domain.research.dto.*;
import com.sbm.siegebackend.global.api.ApiResponse;
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
    public ResponseEntity<ApiResponse<Long>> createPost(
            @RequestBody BattleResearchPostCreateRequest request,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        Long postId = service.createPost(email, request);
        return ResponseEntity.ok(ApiResponse.success(postId));
    }

    @GetMapping("/posts")
    public ResponseEntity<ApiResponse<List<BattleResearchPostListItemResponse>>> listPosts(
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        List<BattleResearchPostListItemResponse> posts = service.listPosts(email);
        return ResponseEntity.ok(ApiResponse.success(posts));
    }

    @GetMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<BattleResearchPostDetailResponse>> detail(
            @PathVariable Long postId,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        BattleResearchPostDetailResponse detail = service.getPostDetail(email, postId);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PutMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<Void>> updatePost(
            @PathVariable Long postId,
            @RequestBody BattleResearchPostUpdateRequest request,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        service.updatePost(email, postId, request);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @PathVariable Long postId,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        service.deletePost(email, postId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    // ===== Comments =====

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<Long>> createComment(
            @PathVariable Long postId,
            @RequestBody BattleResearchCommentCreateRequest request,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        Long commentId = service.createComment(email, postId, request);
        return ResponseEntity.ok(ApiResponse.success(commentId));
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> updateComment(
            @PathVariable Long commentId,
            @RequestBody BattleResearchCommentUpdateRequest request,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        service.updateComment(email, commentId, request);
        return ResponseEntity.ok(ApiResponse.success());
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable Long commentId,
            Authentication auth
    ) {
        String email = (String) auth.getPrincipal();
        service.deleteComment(email, commentId);
        return ResponseEntity.ok(ApiResponse.success());
    }
}

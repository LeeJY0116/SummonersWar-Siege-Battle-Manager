package com.sbm.siegebackend.domain.monster.localization;

import com.sbm.siegebackend.global.api.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/monsters")
public class MonsterLocalizationAdminController {

    private final MonsterLocalizationApplyService applyService;

    public MonsterLocalizationAdminController(MonsterLocalizationApplyService applyService) {
        this.applyService = applyService;
    }

    @PostMapping("/apply-localization")
    public ResponseEntity<ApiResponse<Integer>> applyLocalization() {
        int count = applyService.applyLocalization();
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}

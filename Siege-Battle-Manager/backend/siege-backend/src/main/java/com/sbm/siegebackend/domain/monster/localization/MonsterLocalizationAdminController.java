package com.sbm.siegebackend.domain.monster.localization;

import com.sbm.siegebackend.global.api.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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

    @GetMapping("/localization")
    public ResponseEntity<ApiResponse<List<MonsterLocalizationResponse>>> getLocalizationEntries() {
        return ResponseEntity.ok(ApiResponse.success(applyService.getLocalizationEntries()));
    }

    @PutMapping("/localization/{code}")
    public ResponseEntity<ApiResponse<MonsterLocalizationResponse>> updateLocalizationEntry(
            @PathVariable String code,
            @RequestBody MonsterLocalizationUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(applyService.updateLocalizationEntry(code, request)));
    }
}

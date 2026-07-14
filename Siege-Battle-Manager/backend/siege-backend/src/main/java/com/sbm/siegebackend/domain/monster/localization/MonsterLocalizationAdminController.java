package com.sbm.siegebackend.domain.monster.localization;

import com.sbm.siegebackend.domain.monster.sync.MonsterAdminJobService;
import com.sbm.siegebackend.domain.monster.sync.MonsterAdminJobStatusResponse;
import com.sbm.siegebackend.global.api.ApiResponse;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.concurrent.CustomizableThreadFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@RestController
@RequestMapping("/api/admin/monsters")
public class MonsterLocalizationAdminController {

    private static final Logger log = LoggerFactory.getLogger(MonsterLocalizationAdminController.class);

    private final MonsterLocalizationApplyService applyService;
    private final MonsterAdminJobService jobService;
    private final ExecutorService executorService =
            Executors.newSingleThreadExecutor(new CustomizableThreadFactory("monster-localization-"));

    public MonsterLocalizationAdminController(MonsterLocalizationApplyService applyService,
                                              MonsterAdminJobService jobService) {
        this.applyService = applyService;
        this.jobService = jobService;
    }

    @PostMapping("/apply-localization")
    public ResponseEntity<ApiResponse<MonsterAdminJobStatusResponse>> applyLocalization() {
        MonsterAdminJobStatusResponse status = jobService.start("APPLY_LOCALIZATION", "몬스터 이름 적용을 시작했습니다.");

        executorService.submit(() -> {
            try {
                log.info("Monster localization apply started");
                int count = applyService.applyLocalization();
                log.info("Monster localization apply completed. count={}", count);
                jobService.complete("몬스터 이름 적용이 완료되었습니다.", count, count);
            } catch (RuntimeException e) {
                log.error("Monster localization apply failed", e);
                jobService.fail(e.getMessage() == null ? "몬스터 이름 적용 중 오류가 발생했습니다." : e.getMessage());
            }
        });

        return ResponseEntity.ok(ApiResponse.success(status));
    }

    @PreDestroy
    public void shutdown() {
        executorService.shutdownNow();
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

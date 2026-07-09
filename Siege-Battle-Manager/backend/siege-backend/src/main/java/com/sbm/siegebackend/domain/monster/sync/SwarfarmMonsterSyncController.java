package com.sbm.siegebackend.domain.monster.sync;

import com.sbm.siegebackend.global.api.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/monsters")
public class SwarfarmMonsterSyncController {

    private final SwarfarmMonsterSyncService syncService;

    public SwarfarmMonsterSyncController(SwarfarmMonsterSyncService syncService) {
        this.syncService = syncService;
    }

    @PostMapping("/sync-swarfarm")
    public ResponseEntity<ApiResponse<Integer>> syncSwarfarmMonsters() {
        int count = syncService.syncMonsters();
        return ResponseEntity.ok(ApiResponse.success(count));
    }
}
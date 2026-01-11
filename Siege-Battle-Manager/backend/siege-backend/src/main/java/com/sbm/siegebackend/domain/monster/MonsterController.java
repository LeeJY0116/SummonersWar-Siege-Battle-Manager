package com.sbm.siegebackend.domain.monster;

import com.sbm.siegebackend.domain.monster.dto.MonsterCreateRequest;
import com.sbm.siegebackend.domain.monster.dto.MonsterResponse;
import com.sbm.siegebackend.global.api.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/monsters")
@RequiredArgsConstructor
public class MonsterController {

    private final MonsterService monsterService;

    // ✅ 프론트에서 몬스터 카탈로그 불러오는 API
    @GetMapping
    public ApiResponse<List<MonsterResponse>> getAll() {
        return ApiResponse.success(monsterService.getAll());
    }

    // (선택) 사용자 몬스터 추가
    @PostMapping
    public ApiResponse<Long> create(@RequestBody MonsterCreateRequest request) {
        return ApiResponse.success(monsterService.create(request));
    }
}
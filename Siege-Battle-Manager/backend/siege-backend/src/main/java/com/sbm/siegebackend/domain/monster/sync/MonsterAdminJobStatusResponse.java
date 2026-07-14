package com.sbm.siegebackend.domain.monster.sync;

import java.time.LocalDateTime;

public record MonsterAdminJobStatusResponse(
        String operation,
        String status,
        Integer processedCount,
        Integer totalCount,
        String message,
        LocalDateTime startedAt,
        LocalDateTime finishedAt
) {
    public boolean running() {
        return "RUNNING".equals(status);
    }
}

package com.sbm.siegebackend.global.health;

import com.sbm.siegebackend.global.api.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<HealthResponse>> health() {
        boolean databaseUp = isDatabaseUp();
        HealthResponse response = new HealthResponse(
                databaseUp ? "UP" : "DEGRADED",
                databaseUp ? "UP" : "DOWN",
                Instant.now().toString()
        );

        return ResponseEntity
                .status(databaseUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE)
                .body(ApiResponse.success(response));
    }

    private boolean isDatabaseUp() {
        try {
            Integer result = jdbcTemplate.queryForObject("select 1", Integer.class);
            return result != null && result == 1;
        } catch (Exception ignored) {
            return false;
        }
    }

    public record HealthResponse(
            String status,
            String database,
            String timestamp
    ) {
    }
}

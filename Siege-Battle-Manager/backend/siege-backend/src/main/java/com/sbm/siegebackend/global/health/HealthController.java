package com.sbm.siegebackend.global.health;

import com.sbm.siegebackend.global.api.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    @GetMapping
    public ResponseEntity<ApiResponse<HealthResponse>> health() {
        HealthResponse response = new HealthResponse(
                "UP",
                Instant.now().toString()
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    public record HealthResponse(
            String status,
            String timestamp
    ) {
    }
}

package com.ulis.business.controller;

import com.ulis.core.http.ResponseBuilder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Skeleton health check — trả về envelope ApiResponse chuẩn.
 * Dùng để verify toàn bộ plumbing (context boot + CORS + handler) chạy từ đầu.
 */
@RestController
@RequestMapping("/health")
@Tag(name = "HealthController", description = "Health check cho skeleton")
public class HealthController {

    @GetMapping
    @Operation(summary = "Trạng thái hệ thống")
    public ResponseEntity<Object> health() {
        Map<String, Object> health = new LinkedHashMap<>();
        health.put("status", "UP");
        return ResponseBuilder.ok(health);
    }
}

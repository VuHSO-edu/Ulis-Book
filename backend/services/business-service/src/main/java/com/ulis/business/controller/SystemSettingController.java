package com.ulis.business.controller;

import com.ulis.business.entity.SystemSetting;
import com.ulis.business.repository.SystemSettingRepository;
import com.ulis.core.http.ResponseBuilder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Cấu hình giao diện công khai (TASK-04: Màu nền hệ thống & TASK-05: Loop Ảnh Hero Banner).
 */
@RestController
@RequestMapping("/system-settings")
@Tag(name = "SystemSettingController", description = "Cấu hình giao diện & Banner Loop công khai")
@RequiredArgsConstructor
public class SystemSettingController {

    public static final String KEY_BG_COLOR = "APPEARANCE_BG_COLOR";
    public static final String KEY_SURFACE_COLOR = "APPEARANCE_SURFACE_COLOR";
    public static final String KEY_PRIMARY_COLOR = "APPEARANCE_PRIMARY_COLOR";
    public static final String KEY_HERO_BANNERS = "HERO_LOOP_BANNERS_JSON";

    private final SystemSettingRepository settingRepository;

    @GetMapping("/public")
    @Transactional(readOnly = true)
    @Operation(summary = "Lấy màu nền hệ thống & danh sách ảnh Loop Hero Banner đang kích hoạt")
    public ResponseEntity<Object> getPublicSettings() {
        Map<String, String> map = new LinkedHashMap<>();
        map.put(KEY_BG_COLOR, getVal(KEY_BG_COLOR, "#fff4eb"));
        map.put(KEY_SURFACE_COLOR, getVal(KEY_SURFACE_COLOR, "#f6e0b6"));
        map.put(KEY_PRIMARY_COLOR, getVal(KEY_PRIMARY_COLOR, "#3e4b8e"));
        map.put(KEY_HERO_BANNERS, getVal(KEY_HERO_BANNERS, ""));
        return ResponseBuilder.ok(map);
    }

    private String getVal(String key, String fallback) {
        return settingRepository.findById(key)
                .map(SystemSetting::getSettingValue)
                .filter(v -> v != null && !v.isBlank())
                .orElse(fallback);
    }
}

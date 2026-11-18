package com.ulis.business.controller;

import com.ulis.business.dto.request.UpdateProfileRequest;
import com.ulis.business.dto.response.ProfileResponse;
import com.ulis.business.security.SecurityUtils;
import com.ulis.business.service.ProfileService;
import com.ulis.core.helper.MessageHelper;
import com.ulis.core.http.ResponseBuilder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Hồ sơ người dùng (ticket 03) — endpoint được bảo vệ, xác thực qua JWT.
 */
@RestController
@RequestMapping("/profile")
@Tag(name = "ProfileController", description = "Hồ sơ người dùng (JWT bảo vệ)")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final MessageHelper messageHelper;

    @GetMapping("/me")
    @Operation(summary = "Xem hồ sơ của tôi")
    public ResponseEntity<Object> getMe() {
        return ResponseBuilder.ok(profileService.getProfile(SecurityUtils.currentUser().getId()));
    }

    @PutMapping("/me")
    @Operation(summary = "Cập nhật hồ sơ của tôi")
    public ResponseEntity<Object> updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        ProfileResponse updated = profileService.updateProfile(
                SecurityUtils.currentUser().getId(), request);
        return ResponseBuilder.ok(updated, messageHelper.getMessage("profile.updated"));
    }
}

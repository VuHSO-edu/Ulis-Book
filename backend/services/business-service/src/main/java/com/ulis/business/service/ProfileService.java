package com.ulis.business.service;

import com.ulis.business.dto.request.UpdateProfileRequest;
import com.ulis.business.dto.response.ProfileResponse;

/**
 * Nghiệp vụ hồ sơ người dùng (ticket 03) — xem / cập nhật qua /profile/me.
 */
public interface ProfileService {

    ProfileResponse getProfile(Long userId);

    ProfileResponse updateProfile(Long userId, UpdateProfileRequest request);
}

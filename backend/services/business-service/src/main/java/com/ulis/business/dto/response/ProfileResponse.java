package com.ulis.business.dto.response;

import com.ulis.business.entity.User;
import com.ulis.business.enums.UserRole;
import com.ulis.business.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Hồ sơ người dùng (ticket 03) — xem / chỉnh sửa qua /profile/me.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {

    private Long id;

    private String email;

    private String fullName;

    private String faculty;

    private String major;

    private String className;

    private String phone;

    private String avatarUrl;

    private UserRole role;

    private UserStatus status;

    private LocalDateTime createdAt;

    public static ProfileResponse from(User user) {
        return ProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .faculty(user.getFaculty())
                .major(user.getMajor())
                .className(user.getClassName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

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

    private String msv;

    private String faculty;

    private String major;

    private String className;

    private String phone;

    private String avatarUrl;

    private UserRole role;

    private UserStatus status;

    private Integer reputationScore;

    private Integer monthlyPostCount;

    private Integer monthlyPostLimit;

    private LocalDateTime createdAt;

    public static ProfileResponse from(User user) {
        return from(user, 0, 15);
    }

    public static ProfileResponse from(User user, int monthlyPostCount, int monthlyPostLimit) {
        return ProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .msv(user.getMsv())
                .faculty(user.getFaculty())
                .major(user.getMajor())
                .className(user.getClassName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .status(user.getStatus())
                .reputationScore(user.getReputationScore() == null ? 3 : user.getReputationScore())
                .monthlyPostCount(monthlyPostCount)
                .monthlyPostLimit(monthlyPostLimit)
                .createdAt(user.getCreatedAt())
                .build();
    }
}

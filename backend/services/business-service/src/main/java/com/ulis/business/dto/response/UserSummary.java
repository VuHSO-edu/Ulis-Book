package com.ulis.business.dto.response;

import com.ulis.business.entity.User;
import com.ulis.business.enums.UserRole;
import com.ulis.business.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Thông tin tóm tắt người dùng đính kèm token khi login (ticket 03).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummary {

    private Long id;

    private String email;

    private String fullName;

    private UserRole role;

    private UserStatus status;

    public static UserSummary from(User user) {
        return UserSummary.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }
}

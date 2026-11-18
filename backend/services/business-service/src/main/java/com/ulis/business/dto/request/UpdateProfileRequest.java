package com.ulis.business.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request cập nhật hồ sơ người dùng (ticket 03).
 * Toàn bộ field tuỳ chọn trừ fullName (bắt buộc).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @NotBlank(message = "{profile.fullName.required}")
    @Size(max = 100, message = "{profile.fullName.length}")
    private String fullName;

    @Size(max = 100, message = "{profile.faculty.length}")
    private String faculty;

    @Size(max = 100, message = "{profile.major.length}")
    private String major;

    @Size(max = 50, message = "{profile.className.length}")
    private String className;

    @Size(max = 20, message = "{profile.phone.length}")
    @Pattern(regexp = "^$|^[0-9+][0-9 .-]{0,19}$", message = "{profile.phone.invalid}")
    private String phone;

    @Size(max = 500, message = "{profile.avatarUrl.length}")
    private String avatarUrl;
}

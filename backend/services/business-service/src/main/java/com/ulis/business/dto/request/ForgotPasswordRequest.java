package com.ulis.business.dto.request;

import com.ulis.business.constants.AuthConstants;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Yêu cầu gửi OTP đặt lại mật khẩu (ticket 10) — chỉ chấp nhận email giáo dục
 * giống đăng ký, vì mọi tài khoản hợp lệ đều được tạo qua luồng đó.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ForgotPasswordRequest {

    @NotBlank(message = "{auth.email.required}")
    @Email(message = "{auth.email.invalid}")
    @Pattern(regexp = AuthConstants.EDU_EMAIL_REGEX, message = "{auth.email.domain}")
    private String email;
}

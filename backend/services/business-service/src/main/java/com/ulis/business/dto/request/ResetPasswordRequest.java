package com.ulis.business.dto.request;

import com.ulis.business.constants.AuthConstants;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Đặt lại mật khẩu bằng OTP (ticket 10): email + mã OTP + mật khẩu mới.
 * Mật khẩu mới dùng đúng luật độ dài của đăng ký (8–64).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

    @NotBlank(message = "{auth.email.required}")
    @Email(message = "{auth.email.invalid}")
    @Pattern(regexp = AuthConstants.EDU_EMAIL_REGEX, message = "{auth.email.domain}")
    private String email;

    @NotBlank(message = "{auth.otp.required}")
    @Pattern(regexp = AuthConstants.OTP_CODE_REGEX, message = "{auth.otp.format}")
    private String otpCode;

    @NotBlank(message = "{auth.password.required}")
    @Size(min = 8, max = 64, message = "{auth.password.length}")
    private String newPassword;
}

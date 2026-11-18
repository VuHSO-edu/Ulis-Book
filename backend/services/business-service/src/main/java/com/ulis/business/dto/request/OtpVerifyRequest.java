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
 * Request xác minh OTP (kích hoạt tài khoản).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpVerifyRequest {

    @NotBlank(message = "{auth.email.required}")
    @Email(message = "{auth.email.invalid}")
    private String email;

    @NotBlank(message = "{auth.otp.required}")
    @Pattern(regexp = AuthConstants.OTP_CODE_REGEX, message = "{auth.otp.format}")
    private String otpCode;
}

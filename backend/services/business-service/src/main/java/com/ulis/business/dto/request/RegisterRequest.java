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
 * Request đăng ký — theo vuhso-java-backend-rules §5.2 (Lombok, không record).
 * Luật domain email .edu/.edu.vn đặt ngay ở tầng validation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "{auth.email.required}")
    @Email(message = "{auth.email.invalid}")
    @Pattern(regexp = AuthConstants.EDU_EMAIL_REGEX, message = "{auth.email.domain}")
    private String email;

    @NotBlank(message = "{auth.password.required}")
    @Size(min = 8, max = 64, message = "{auth.password.length}")
    private String password;

    @NotBlank(message = "{auth.fullName.required}")
    @Size(max = 100, message = "{auth.fullName.length}")
    private String fullName;

    @Size(max = 50)
    private String msv;

    @Size(max = 100)
    private String faculty;

    @Size(max = 100)
    private String major;

    @Size(max = 50)
    private String className;

    @Size(max = 20)
    private String phone;
}

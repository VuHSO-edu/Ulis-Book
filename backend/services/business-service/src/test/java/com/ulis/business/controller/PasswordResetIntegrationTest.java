package com.ulis.business.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ulis.business.config.properties.AuthProperties;
import com.ulis.business.entity.User;
import com.ulis.business.enums.UserStatus;
import com.ulis.business.repository.UserRepository;
import com.ulis.business.service.impl.DevOtpSender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test quên/đặt lại mật khẩu bằng OTP (ticket 10) tại seam API:
 * - gửi OTP reset cho tài khoản ACTIVE (dev OTP), cooldown chống spam;
 * - OTP đúng đổi được mật khẩu, mật khẩu cũ hết hiệu lực, OTP một lần;
 * - OTP sai/hết hạn/vượt số lần bị từ chối với message rõ ràng;
 * - email không tồn tại 404, INACTIVE/BANNED bị chặn, validate 400.
 */
@SpringBootTest
@AutoConfigureMockMvc
class PasswordResetIntegrationTest {

    private static final String EMAIL = "reset.user@ulis.edu.vn";
    private static final String OLD_PASSWORD = "Matkhau@123";
    private static final String NEW_PASSWORD = "Matkhaumoi@456";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DevOtpSender devOtpSender;

    @Autowired
    private AuthProperties authProperties;

    @BeforeEach
    void setUp() {
        devOtpSender.reset();
        userRepository.deleteAll();
    }

    // ------------------------------------------------------------------ helpers

    private ResultActions postJson(String url, Object body) throws Exception {
        return mockMvc.perform(post(url)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }

    private Map<String, String> registerBody(String email, String password) {
        return Map.of("email", email, "password", password, "fullName", "Nguyễn Văn Reset");
    }

    private void registerAndActivate(String email) throws Exception {
        postJson("/auth/register", registerBody(email, OLD_PASSWORD))
                .andExpect(status().isOk());
        String otp = devOtpSender.lastSent(email);
        postJson("/auth/otp/verify", Map.of("email", email, "otpCode", otp))
                .andExpect(status().isOk());
    }

    private ResultActions forgot(String email) throws Exception {
        return postJson("/auth/password/forgot", Map.of("email", email));
    }

    private ResultActions reset(String email, String otp, String newPassword) throws Exception {
        return postJson("/auth/password/reset",
                Map.of("email", email, "otpCode", otp, "newPassword", newPassword));
    }

    private User user(String email) {
        return userRepository.findByEmailIgnoreCase(email).orElseThrow();
    }

    // ------------------------------------------------------------------ tests

    @Test
    @DisplayName("Quên -> OTP -> đổi mật khẩu: mật khẩu cũ hết hiệu lực, OTP dùng một lần")
    void forgotAndResetFlow() throws Exception {
        registerAndActivate(EMAIL);

        forgot(EMAIL)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message")
                        .value("Mã OTP đặt lại mật khẩu đã được gửi tới email của bạn"));

        String otp = devOtpSender.lastSent(EMAIL);
        assertThat(otp).hasSize(authProperties.getOtpLength()).containsOnlyDigits();

        // Sai OTP -> từ chối rõ ràng, không đổi mật khẩu
        reset(EMAIL, "000000", NEW_PASSWORD)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Mã OTP không đúng"));

        // Đúng OTP -> đổi mật khẩu
        reset(EMAIL, otp, NEW_PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message")
                        .value("Đặt lại mật khẩu thành công, vui lòng đăng nhập lại"));

        // Mật khẩu cũ không còn dùng được; mật khẩu mới đăng nhập được
        postJson("/auth/login", Map.of("email", EMAIL, "password", OLD_PASSWORD))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Email hoặc mật khẩu không đúng"));
        postJson("/auth/login", Map.of("email", EMAIL, "password", NEW_PASSWORD))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty());

        // OTP một lần: dùng lại mã cũ -> chưa có OTP mới
        reset(EMAIL, otp, "Matkhaukhac@789")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Chưa có mã OTP cho email này"));
    }

    @Test
    @DisplayName("OTP hết hạn bị từ chối")
    void expiredOtpRejected() throws Exception {
        registerAndActivate(EMAIL);
        forgot(EMAIL).andExpect(status().isOk());
        String otp = devOtpSender.lastSent(EMAIL);

        User u = user(EMAIL);
        u.setOtpExpiryAt(LocalDateTime.now().minusMinutes(1));
        userRepository.save(u);

        reset(EMAIL, otp, NEW_PASSWORD)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Mã OTP đã hết hạn"));
    }

    @Test
    @DisplayName("Sai OTP quá số lần -> chặn bằng attempt limit")
    void tooManyWrongAttemptsBlocked() throws Exception {
        registerAndActivate(EMAIL);
        forgot(EMAIL).andExpect(status().isOk());
        String otp = devOtpSender.lastSent(EMAIL);

        for (int i = 0; i < authProperties.getOtpMaxAttempts(); i++) {
            reset(EMAIL, "000000", NEW_PASSWORD)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Mã OTP không đúng"));
        }
        reset(EMAIL, otp, NEW_PASSWORD)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value("Bạn đã nhập sai OTP quá số lần cho phép, vui lòng gửi lại mã"));
    }

    @Test
    @DisplayName("Email không tồn tại 404; tài khoản INACTIVE/BANNED bị chặn")
    void accountStateGuards() throws Exception {
        // Không tồn tại
        forgot("khong.ton.tai@ulis.edu.vn")
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Không tìm thấy tài khoản"));

        // Đăng ký nhưng chưa kích hoạt
        postJson("/auth/register", registerBody(EMAIL, OLD_PASSWORD))
                .andExpect(status().isOk());
        forgot(EMAIL)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value("Tài khoản chưa kích hoạt, vui lòng xác minh email trước"));

        // Bị khoá
        User u = user(EMAIL);
        u.setStatus(UserStatus.BANNED);
        userRepository.save(u);
        forgot(EMAIL)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Tài khoản đã bị khoá"));
    }

    @Test
    @DisplayName("Cooldown chống spam + validate email/OTP/mật khẩu mới")
    void cooldownAndValidation() throws Exception {
        registerAndActivate(EMAIL);
        forgot(EMAIL).andExpect(status().isOk());
        forgot(EMAIL)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value("Vui lòng chờ một chút trước khi gửi lại OTP"));

        // Thiếu email -> VALIDATION_FAILED
        postJson("/auth/password/forgot", Map.of())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.email").value("Vui lòng nhập email"));

        // Email ngoài domain giáo dục -> VALIDATION_FAILED
        forgot("reset.user@gmail.com")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.email").value("Chỉ chấp nhận email giáo dục (.edu / .edu.vn)"));

        // OTP sai định dạng + mật khẩu mới quá ngắn -> VALIDATION_FAILED
        reset(EMAIL, "abc", "123")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.otpCode").value("Mã OTP gồm 6 chữ số"))
                .andExpect(jsonPath("$.error.newPassword")
                        .value("Mật khẩu phải dài từ 8 đến 64 ký tự"));
    }
}

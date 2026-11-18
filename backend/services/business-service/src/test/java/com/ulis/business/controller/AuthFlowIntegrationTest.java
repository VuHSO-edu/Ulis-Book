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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDateTime;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test luồng đăng ký + OTP tại seam API (REST).
 * OTP lấy từ DevOtpSender (profile default) — giống cách dev xem trong log.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuthFlowIntegrationTest {

    private static final String BASE_EMAIL = "nguyen.van.a@ulis.edu.vn";
    private static final String PASSWORD = "Matkhau@123";

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

    private ResultActions postJson(String url, Object body) throws Exception {
        return mockMvc.perform(post(url)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }

    private Map<String, String> regBody() {
        return Map.of(
                "email", BASE_EMAIL,
                "password", PASSWORD,
                "fullName", "Nguyễn Văn A");
    }

    private void rewindLastSent() {
        User u = userRepository.findByEmailIgnoreCase(BASE_EMAIL).orElseThrow();
        u.setOtpLastSentAt(LocalDateTime.now()
                .minusSeconds(authProperties.getOtpCooldownSeconds() + 1));
        userRepository.save(u);
    }

    @Test
    @DisplayName("TỪ CHỐI email không phải giáo dục (.edu/.edu.vn)")
    void rejectsNonEduEmail() throws Exception {
        postJson("/auth/register",
                Map.of("email", "nguyen.van.a@gmail.com", "password", PASSWORD, "fullName", "Nguyễn Văn A"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.email").exists());

        assertThat(userRepository.count()).isZero();
    }

    @Test
    @DisplayName("ĐĂNG KÝ .edu tạo INACTIVE + gửi OTP -> verify kích hoạt -> dùng lại OTP/đăng ký lại bị từ chối")
    void registerVerifyFlowThenRejectsReuse() throws Exception {
        MvcResult reg = postJson("/auth/register", regBody())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andReturn();
        assertThat(reg.getResponse().getContentAsString()).contains("OTP");

        User before = userRepository.findByEmailIgnoreCase(BASE_EMAIL).orElseThrow();
        assertThat(before.getStatus()).isEqualTo(UserStatus.INACTIVE);

        String otp = devOtpSender.lastSent(BASE_EMAIL);
        assertThat(otp).hasSize(authProperties.getOtpLength()).containsOnlyDigits();

        // Sai OTP -> lỗi
        postJson("/auth/otp/verify", Map.of("email", BASE_EMAIL, "otpCode", "000000"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Mã OTP không đúng"));

        // Đúng OTP -> kích hoạt
        postJson("/auth/otp/verify", Map.of("email", BASE_EMAIL, "otpCode", otp))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Tài khoản đã kích hoạt thành công"));

        User after = userRepository.findByEmailIgnoreCase(BASE_EMAIL).orElseThrow();
        assertThat(after.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(after.getOtpHash()).isNull();

        // Single-use: verify lại bằng OTP cũ -> từ chối
        postJson("/auth/otp/verify", Map.of("email", BASE_EMAIL, "otpCode", otp))
                .andExpect(status().isBadRequest());

        // Đăng ký lại email đã kích hoạt -> từ chối
        postJson("/auth/register", regBody())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email này đã được đăng ký"));
    }

    @Test
    @DisplayName("TỪ CHỐI OTP đã hết hạn")
    void expiredOtpRejected() throws Exception {
        postJson("/auth/register", regBody()).andExpect(status().isOk());
        String otp = devOtpSender.lastSent(BASE_EMAIL);

        User user = userRepository.findByEmailIgnoreCase(BASE_EMAIL).orElseThrow();
        user.setOtpExpiryAt(LocalDateTime.now().minusMinutes(1));
        userRepository.save(user);

        postJson("/auth/otp/verify", Map.of("email", BASE_EMAIL, "otpCode", otp))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Mã OTP đã hết hạn"));
    }

    @Test
    @DisplayName("GỬI LẠI OTP có giới hạn: tới hạn thì bị từ chối")
    void resendIsBounded() throws Exception {
        postJson("/auth/register", regBody()).andExpect(status().isOk());

        for (int i = 0; i < authProperties.getOtpMaxResend(); i++) {
            rewindLastSent();
            postJson("/auth/otp/resend", Map.of("email", BASE_EMAIL))
                    .andExpect(status().isOk());
        }
        rewindLastSent();
        postJson("/auth/otp/resend", Map.of("email", BASE_EMAIL))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value("Bạn đã yêu cầu gửi lại OTP quá số lần cho phép"));
    }

    @Test
    @DisplayName("GỬI LẠI OTP quá sớm bị chặn (cooldown)")
    void resendTooSoonBlockedByCooldown() throws Exception {
        postJson("/auth/register", regBody()).andExpect(status().isOk());

        postJson("/auth/otp/resend", Map.of("email", BASE_EMAIL))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Vui lòng chờ một chút trước khi gửi lại OTP"));
    }

    @Test
    @DisplayName("Mật khẩu & OTP lưu DẠNG HASH, không phải dạng thô")
    void secretsStoredHashed() throws Exception {
        postJson("/auth/register", regBody()).andExpect(status().isOk());
        String otp = devOtpSender.lastSent(BASE_EMAIL);

        User u = userRepository.findByEmailIgnoreCase(BASE_EMAIL).orElseThrow();
        assertThat(u.getPasswordHash()).isNotEqualTo(PASSWORD);
        assertThat(u.getOtpHash()).isNotEqualTo(otp);
        assertThat(u.getOtpHash()).startsWith("$2");
    }
}

package com.ulis.business.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ulis.business.repository.UserRepository;
import com.ulis.business.service.impl.DevOtpSender;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import java.util.Map;

import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test đăng nhập + JWT tại seam API (ticket 03):
 * login đúng/sai, refresh xoay vòng, endpoint được bảo vệ 401 khi thiếu token.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuthLoginIntegrationTest {

    private static final String EMAIL = "nguyen.van.b@ulis.edu.vn";
    private static final String PASSWORD = "Matkhau@123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DevOtpSender devOtpSender;

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

    /** Đăng ký + xác minh OTP -> tài khoản ACTIVE. */
    private void registerAndActivate() throws Exception {
        postJson("/auth/register", Map.of(
                "email", EMAIL, "password", PASSWORD, "fullName", "Nguyễn Văn B"))
                .andExpect(status().isOk());
        String otp = devOtpSender.lastSent(EMAIL);
        postJson("/auth/otp/verify", Map.of("email", EMAIL, "otpCode", otp))
                .andExpect(status().isOk());
    }

    private String loginAccessToken() throws Exception {
        MvcResult result = postJson("/auth/login",
                Map.of("email", EMAIL, "password", PASSWORD))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    private String loginRefreshToken() throws Exception {
        MvcResult result = postJson("/auth/login",
                Map.of("email", EMAIL, "password", PASSWORD))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("refreshToken").asText();
    }

    @Test
    @DisplayName("ĐĂNG NHẬP đúng -> cặp JWT + thông tin user; token dùng được cho /profile/me")
    void loginSuccessThenAccessProtectedEndpoint() throws Exception {
        registerAndActivate();

        MvcResult login = postJson("/auth/login", Map.of("email", EMAIL, "password", PASSWORD))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken", not(emptyOrNullString())))
                .andExpect(jsonPath("$.data.refreshToken", not(emptyOrNullString())))
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.user.email").value(EMAIL))
                .andExpect(jsonPath("$.data.user.status").value("ACTIVE"))
                .andReturn();

        String accessToken = objectMapper.readTree(login.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();

        mockMvc.perform(get("/profile/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(EMAIL));
    }

    @Test
    @DisplayName("ĐĂNG NHẬP sai mật khẩu / email không tồn tại -> 401 cùng message chung")
    void loginRejectedWithGenericMessage() throws Exception {
        registerAndActivate();

        postJson("/auth/login", Map.of("email", EMAIL, "password", "SaiMatkhau@1"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Email hoặc mật khẩu không đúng"));

        postJson("/auth/login", Map.of("email", "khong-ton-tai@ulis.edu.vn", "password", PASSWORD))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Email hoặc mật khẩu không đúng"));
    }

    @Test
    @DisplayName("ĐĂNG NHẬP tài khoản chưa kích hoạt -> 401 message rõ ràng")
    void loginInactiveRejected() throws Exception {
        postJson("/auth/register", Map.of(
                "email", EMAIL, "password", PASSWORD, "fullName", "Nguyễn Văn B"))
                .andExpect(status().isOk());

        postJson("/auth/login", Map.of("email", EMAIL, "password", PASSWORD))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(
                        "Tài khoản chưa kích hoạt, vui lòng xác minh email trước"));
    }

    @Test
    @DisplayName("Endpoint được bảo vệ trả 401 khi thiếu / sai access token")
    void protectedEndpointRejectsMissingOrBadToken() throws Exception {
        registerAndActivate();

        mockMvc.perform(get("/profile/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("UNAUTHORIZED"));

        mockMvc.perform(get("/profile/me")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer token-giả"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("REFRESH token hợp lệ -> cặp token mới; access mới gọi được API; refresh rác -> 401")
    void refreshRotatesTokensAndRejectsBadToken() throws Exception {
        registerAndActivate();
        String refreshToken = loginRefreshToken();

        MvcResult refresh = postJson("/auth/refresh", Map.of("refreshToken", refreshToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.accessToken", not(emptyOrNullString())))
                .andExpect(jsonPath("$.data.refreshToken", not(emptyOrNullString())))
                .andReturn();

        String newAccess = objectMapper.readTree(refresh.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
        mockMvc.perform(get("/profile/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + newAccess))
                .andExpect(status().isOk());

        postJson("/auth/refresh", Map.of("refreshToken", "khong-phai-token"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(
                        "Phiên đăng nhập đã hết hạn hoặc không hợp lệ, vui lòng đăng nhập lại"));
    }
}

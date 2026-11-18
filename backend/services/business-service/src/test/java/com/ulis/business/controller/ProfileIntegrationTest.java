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

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test hồ sơ người dùng tại seam API (ticket 03):
 * GET/PUT /profile/me với JWT, validation request.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ProfileIntegrationTest {

    private static final String EMAIL = "profile.test@ulis.edu.vn";
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

    /** Tạo user ACTIVE rồi trả về access token. */
    private String accessTokenFor(String email, String password) throws Exception {
        postJson("/auth/register", Map.of("email", email, "password", password, "fullName", "Hồ Sơ Test"))
                .andExpect(status().isOk());
        String otp = devOtpSender.lastSent(email);
        postJson("/auth/otp/verify", Map.of("email", email, "otpCode", otp))
                .andExpect(status().isOk());
        MvcResult login = postJson("/auth/login", Map.of("email", email, "password", password))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(login.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    private ResultActions authedGet(String url, String token) throws Exception {
        return mockMvc.perform(get(url).header(HttpHeaders.AUTHORIZATION, "Bearer " + token));
    }

    private ResultActions authedPut(String url, String token, Object body) throws Exception {
        return mockMvc.perform(put(url)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }

    @Test
    @DisplayName("GET /profile/me trả hồ sơ người dùng đang đăng nhập")
    void getProfileReturnsCurrentUser() throws Exception {
        String token = accessTokenFor(EMAIL, PASSWORD);

        authedGet("/profile/me", token)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(EMAIL))
                .andExpect(jsonPath("$.data.fullName").value("Hồ Sơ Test"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("PUT /profile/me lưu khoa/chuyên ngành/lớp/sđt/avatar; chuỗi rỗng -> null")
    void updateProfileSavesAndClearsOptionalFields() throws Exception {
        String token = accessTokenFor(EMAIL, PASSWORD);

        authedPut("/profile/me", token, Map.of(
                "fullName", "Hồ Sơ Đã Sửa",
                "faculty", "Khoa NN&VH Anh",
                "major", "Ngôn ngữ Anh",
                "className", "21A1",
                "phone", "0912 345 678",
                "avatarUrl", "https://example.com/avatar.png"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cập nhật hồ sơ thành công"))
                .andExpect(jsonPath("$.data.fullName").value("Hồ Sơ Đã Sửa"))
                .andExpect(jsonPath("$.data.faculty").value("Khoa NN&VH Anh"))
                .andExpect(jsonPath("$.data.major").value("Ngôn ngữ Anh"))
                .andExpect(jsonPath("$.data.className").value("21A1"))
                .andExpect(jsonPath("$.data.phone").value("0912 345 678"))
                .andExpect(jsonPath("$.data.avatarUrl").value("https://example.com/avatar.png"));

        // Gửi chuỗi rỗng cho field tuỳ chọn -> lưu null
        authedPut("/profile/me", token, Map.of(
                "fullName", "Hồ Sơ Đã Sửa",
                "faculty", "",
                "major", "",
                "className", "",
                "phone", "",
                "avatarUrl", ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.faculty").value(nullValue()))
                .andExpect(jsonPath("$.data.avatarUrl").value(nullValue()));
    }

    @Test
    @DisplayName("PUT /profile/me với fullName trống -> 400 VALIDATION_FAILED")
    void updateProfileValidatesRequiredField() throws Exception {
        String token = accessTokenFor(EMAIL, PASSWORD);

        authedPut("/profile/me", token, Map.of(
                "fullName", "",
                "faculty", "Khoa A"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.fullName").value("Vui lòng nhập họ tên"));
    }
}

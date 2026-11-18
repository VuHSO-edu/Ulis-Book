package com.ulis.business.controller;

import com.ulis.business.entity.User;
import com.ulis.business.enums.UserRole;
import com.ulis.business.enums.UserStatus;
import com.ulis.business.repository.UserRepository;
import com.ulis.business.service.JwtTokenService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Skeleton test tại seam API — envelope lỗi chuẩn + CORS cho origin frontend.
 * Từ ticket 03, security bảo vệ mọi route (trừ auth/health/swagger), nên test
 * 404 lúc này phải gửi kèm access token hợp lệ.
 */
@SpringBootTest
@AutoConfigureMockMvc
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Test
    @DisplayName("không tìm thấy resource thì trả về envelope lỗi chuẩn 404")
    void unknownResourceReturnsStandardErrorEnvelope() throws Exception {
        User user = userRepository.save(User.builder()
                .email("unknown.test@ulis.edu.vn")
                .fullName("Nguyễn Văn Test")
                .passwordHash(passwordEncoder.encode("Matkhau@123"))
                .role(UserRole.STUDENT)
                .status(UserStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build());
        String token = jwtTokenService.issueTokens(user).getAccessToken();

        mockMvc.perform(get("/api/does-not-exist")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("NOT_FOUND"));
    }

    @Test
    @DisplayName("origin frontend được cho phép qua CORS")
    void corsAllowsConfiguredFrontendOrigin() throws Exception {
        mockMvc.perform(get("/health").header(HttpHeaders.ORIGIN, "http://localhost:5173"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"));
    }
}

package com.ulis.business.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ulis.business.entity.User;
import com.ulis.business.enums.UserRole;
import com.ulis.business.enums.UserStatus;
import com.ulis.business.repository.ReportRepository;
import com.ulis.business.repository.UserRepository;
import com.ulis.business.service.JwtTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ReportIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenService jwtTokenService;

    private User reporter;
    private User targetUser;
    private User admin;
    private String reporterToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        reportRepository.deleteAll();
        userRepository.deleteAll();

        reporter = userRepository.save(User.builder()
                .email("reporter@ulis.edu.vn")
                .passwordHash(passwordEncoder.encode("Matkhau@123"))
                .fullName("Reporter User")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build());

        targetUser = userRepository.save(User.builder()
                .email("target@ulis.edu.vn")
                .passwordHash(passwordEncoder.encode("Matkhau@123"))
                .fullName("Target User")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build());

        admin = userRepository.save(User.builder()
                .email("admin@ulis.edu.vn")
                .passwordHash(passwordEncoder.encode("Matkhau@123"))
                .fullName("Admin User")
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build());

        reporterToken = jwtTokenService.generateAccessToken(reporter);
        adminToken = jwtTokenService.generateAccessToken(admin);
    }

    @Test
    @DisplayName("Người dùng báo cáo vi phạm thành công (PENDING) và không cho phép báo cáo trùng")
    void createReportAndPreventDuplicate() throws Exception {
        Map<String, Object> body = Map.of(
                "sourceType", "USER",
                "targetId", targetUser.getId(),
                "targetTitle", targetUser.getFullName(),
                "targetSubtitle", targetUser.getEmail(),
                "reasonType", "SCAM",
                "reasonLabel", "Lừa đảo",
                "description", "Người dùng có dấu hiệu lừa đảo khi giao dịch."
        );

        mockMvc.perform(post("/reports/create")
                        .header("Authorization", "Bearer " + reporterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.sourceType").value("USER"))
                .andExpect(jsonPath("$.data.targetId").value(targetUser.getId()));

        // Báo cáo trùng cùng target khi đang PENDING -> 400
        mockMvc.perform(post("/reports/create")
                        .header("Authorization", "Bearer " + reporterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isBadRequest());

        // Admin lấy danh sách báo cáo -> thấy bản ghi vừa tạo
        mockMvc.perform(get("/reports/admin/list")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].targetId").value(targetUser.getId()))
                .andExpect(jsonPath("$.data.content[0].status").value("PENDING"));

        // Người dùng thường không được xem danh sách admin -> 403
        mockMvc.perform(get("/reports/admin/list")
                        .header("Authorization", "Bearer " + reporterToken))
                .andExpect(status().isForbidden());
    }
}

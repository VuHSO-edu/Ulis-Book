package com.ulis.business.config;

import com.ulis.business.entity.User;
import com.ulis.business.enums.UserRole;
import com.ulis.business.enums.UserStatus;
import com.ulis.business.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seed tài khoản ADMIN mặc định khi khởi động nếu chưa tồn tại (ticket 12, 13).
 * Ở prod nên override qua biến môi trường ADMIN_EMAIL / ADMIN_PASSWORD.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminUserSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@ulis.edu.vn}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123456}")
    private String adminPassword;

    @Value("${app.admin.full-name:Ban Quản Trị ULIS Books}")
    private String adminFullName;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.findByEmailIgnoreCase(adminEmail).isPresent()) {
            return;
        }
        User admin = User.builder()
                .email(adminEmail.trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(adminPassword))
                .fullName(adminFullName)
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();
        userRepository.save(admin);
        log.info("Seeded default ADMIN user: {}", admin.getEmail());
    }
}

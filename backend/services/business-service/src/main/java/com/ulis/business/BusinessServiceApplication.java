package com.ulis.business;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point của business-service (ULIS Books).
 * scanBasePackages: com.ulis.business (service) + com.ulis.core
 * (để @RestControllerAdvice / bean của ulis-core được quét).
 *
 * Exclude UserDetailsServiceAutoConfiguration: auth hoàn toàn bằng JWT của app,
 * không cần user mặc định "user + password sinh ngẫu nhiên" của Spring Security.
 *
 * @EnableScheduling: job hết hạn bài đăng (ticket 05).
 */
@EnableScheduling
@SpringBootApplication(
        scanBasePackages = {"com.ulis.business", "com.ulis.core"},
        exclude = {UserDetailsServiceAutoConfiguration.class})
public class BusinessServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(BusinessServiceApplication.class, args);
    }
}

package com.ulis.business.config;

import com.ulis.business.config.properties.AuthProperties;
import com.ulis.business.config.properties.JwtProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Config auth: chỉ bật PasswordEncoder (BCrypt) — filter chain JWT nằm ở
 * config/security/SecurityConfig (ticket 03). Properties app.auth.* và
 * app.jwt.* được bind vào AuthProperties / JwtProperties.
 */
@Configuration
@EnableConfigurationProperties({AuthProperties.class, JwtProperties.class})
public class AuthConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}

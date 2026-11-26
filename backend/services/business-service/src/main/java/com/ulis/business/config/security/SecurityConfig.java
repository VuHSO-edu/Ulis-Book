package com.ulis.business.config.security;

import com.ulis.business.filter.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * SecurityConfig (ticket 03) — REST stateless bằng JWT:
 * - permitAll cho auth công khai + health + swagger + preflight OPTIONS.
 * - mọi request còn lại phải có access token hợp lệ (JwtAuthenticationFilter).
 * - 401/403 trả về envelope ApiResponse qua entry point / access denied handler.
 * - CORS đi qua chain (CorsConfigurationSource từ app.cors.allowed-origins).
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String[] allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/auth/login", "/auth/register",
                                "/auth/otp/verify", "/auth/otp/resend", "/auth/otp/dev-peek",
                                "/auth/password/forgot", "/auth/password/reset",
                                "/auth/refresh", "/health").permitAll()
                        .requestMatchers(
                                "/book-categories",
                                "/book-posts/search",
                                "/book-posts/detail/**",
                                "/comments/by-post",
                                "/system-settings/public",
                                "/feedbacks/submit").permitAll()
                        .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        // WebSocket STOMP: handshake tự xác thực JWT (query param token=) trong
                        // WsHandshakeInterceptor — tài khoản không hợp lệ bị từ chối ngay handshake.
                        .requestMatchers("/ws", "/ws/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> patterns = new ArrayList<>();
        if (allowedOrigins != null) {
            for (String origin : allowedOrigins) {
                if (origin != null && !origin.isBlank()) {
                    patterns.add(origin.trim());
                }
            }
        }
        patterns.addAll(List.of(
                "https://nextbooks.online",
                "https://*.nextbooks.online",
                "http://nextbooks.online",
                "http://*.nextbooks.online",
                "https://nextbook.ulis.edu.vn",
                "http://nextbook.ulis.edu.vn",
                "http://localhost:*",
                "http://127.0.0.1:*",
                "*"
        ));
        config.setAllowedOriginPatterns(patterns);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "Content-Disposition"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}

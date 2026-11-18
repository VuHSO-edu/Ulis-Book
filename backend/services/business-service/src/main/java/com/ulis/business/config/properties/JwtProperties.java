package com.ulis.business.config.properties;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Cấu hình JWT — app.jwt.* (theo vuhso-java-backend-rules §5.10).
 * Secret phải đủ dài cho HS256 (>= 32 byte); check ngay lúc boot để không
 * tạo token yếu ở prod.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    private String secret = "dev-only-ulis-books-jwt-secret-change-me-0123456789abcdef";

    private String issuer = "ulis-books";

    private int accessTokenTtlMinutes = 15;

    private int refreshTokenTtlDays = 14;

    @PostConstruct
    public void validate() {
        if (secret == null || secret.getBytes().length < 32) {
            throw new IllegalStateException("app.jwt.secret phải có độ dài >= 32 bytes (HS256)");
        }
    }
}

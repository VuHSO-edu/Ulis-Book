package com.ulis.business.config.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Cấu hình luồng OTP — theo vuhso-java-backend-rules §5.10 (config/properties).
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "app.auth")
public class AuthProperties {

    private int otpLength = 6;

    private int otpExpiryMinutes = 5;

    private int otpMaxResend = 5;

    private int otpCooldownSeconds = 60;

    private int otpMaxAttempts = 5;
}

package com.ulis.business.service.impl;

import com.ulis.business.config.properties.AuthProperties;
import com.ulis.business.service.OtpSender;
import com.ulis.core.helper.MessageHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * OTP dev: in mã ra log, giữ lại mã cuối cho mỗi email (để test/demo trên local),
 * đồng thời nếu có cấu hình MAIL_USERNAME thật thì gửi luôn email qua SMTP.
 */
@Slf4j
@Service
@Profile("default")
@RequiredArgsConstructor
public class DevOtpSender implements OtpSender {

    private final ConcurrentMap<String, String> lastSentByEmail = new ConcurrentHashMap<>();
    private final Optional<JavaMailSender> mailSender;
    private final MessageHelper messageHelper;
    private final AuthProperties authProperties;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Override
    public void send(String toEmail, String otpCode) {
        lastSentByEmail.put(toEmail.toLowerCase(), otpCode);
        log.info("[DEV-OTP] OTP cho {} là: {}", toEmail, otpCode);

        if (mailSender.isPresent() && mailUsername != null && !mailUsername.isBlank()) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(mailUsername);
                message.setTo(toEmail);
                message.setSubject(messageHelper.getMessage("otp.mail.subject"));
                message.setText(messageHelper.getMessage(
                        "otp.mail.body", otpCode, authProperties.getOtpExpiryMinutes()));
                mailSender.get().send(message);
                log.info("[DEV-OTP] Đã gửi email OTP qua SMTP tới {}", toEmail);
            } catch (Exception ex) {
                log.warn("[DEV-OTP] Không gửi được qua SMTP (vẫn dùng được mã dev {}): {}", otpCode, ex.getMessage());
            }
        }
    }

    public String lastSent(String email) {
        return email == null ? null : lastSentByEmail.get(email.trim().toLowerCase());
    }

    public void reset() {
        lastSentByEmail.clear();
    }
}

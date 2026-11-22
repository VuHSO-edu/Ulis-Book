package com.ulis.business.service.impl;

import com.ulis.business.config.properties.AuthProperties;
import com.ulis.business.service.OtpSender;
import com.ulis.core.helper.MessageHelper;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * OTP prod: gửi mail thật qua SMTP (provider mặc định: Brevo free).
 * Chỉ kích hoạt ở profile "prod"; cấu hình qua spring.mail.* (env).
 */
@Slf4j
@Service
@Profile("prod")
@RequiredArgsConstructor
public class SmtpOtpSender implements OtpSender {

    private final JavaMailSender mailSender;
    private final MessageHelper messageHelper;
    private final AuthProperties authProperties;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Override
    public void send(String toEmail, String otpCode) {
        try {
            OtpMailHelper.sendHtmlOtp(
                    mailSender,
                    mailUsername,
                    toEmail,
                    messageHelper.getMessage("otp.mail.subject"),
                    otpCode,
                    authProperties.getOtpExpiryMinutes());
            log.info("OTP email sent to {}", toEmail);
        } catch (MessagingException ex) {
            throw new MailSendException("Failed to build OTP HTML email", ex);
        }
    }
}

package com.ulis.business.service.impl;

import com.ulis.business.config.properties.AuthProperties;
import com.ulis.business.service.OtpSender;
import com.ulis.core.helper.MessageHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
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

    @Override
    public void send(String toEmail, String otpCode) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(messageHelper.getMessage("otp.mail.subject"));
        message.setText(messageHelper.getMessage(
                "otp.mail.body", otpCode, authProperties.getOtpExpiryMinutes()));
        mailSender.send(message);
        log.info("OTP email sent to {}", toEmail);
    }
}

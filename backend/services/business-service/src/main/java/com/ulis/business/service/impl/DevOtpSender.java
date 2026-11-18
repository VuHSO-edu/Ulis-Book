package com.ulis.business.service.impl;

import com.ulis.business.service.OtpSender;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * OTP dev: in mã ra log và giữ lại mã cuối cho mỗi email (để test tại seam API
 * và tiện cho dev demo). Profile "default" = mọi môi trường không đặt profile.
 */
@Slf4j
@Service
@Profile("default")
public class DevOtpSender implements OtpSender {

    private final ConcurrentMap<String, String> lastSentByEmail = new ConcurrentHashMap<>();

    @Override
    public void send(String toEmail, String otpCode) {
        lastSentByEmail.put(toEmail.toLowerCase(), otpCode);
        log.info("[DEV-OTP] OTP cho {} là: {}", toEmail, otpCode);
    }

    public String lastSent(String email) {
        return lastSentByEmail.get(email.toLowerCase());
    }

    public void reset() {
        lastSentByEmail.clear();
    }
}

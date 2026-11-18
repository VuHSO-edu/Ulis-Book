package com.ulis.business.service;

/**
 * Cổng gửi OTP — 2 profile theo quyết định đã chốt:
 * dev: in ra log (DevOtpSender, giữ mã cuối để test/demo);
 * prod: gửi mail thật qua SMTP (SmtpOtpSender).
 */
public interface OtpSender {

    void send(String toEmail, String otpCode);
}

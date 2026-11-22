package com.ulis.business.service.impl;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

import java.nio.charset.StandardCharsets;

/**
 * Helper tạo và gửi email OTP định dạng HTML/CSS cho NextBooks.
 */
final class OtpMailHelper {

    private OtpMailHelper() {
    }

    static void sendHtmlOtp(
            JavaMailSender mailSender,
            String fromEmail,
            String toEmail,
            String subject,
            String otpCode,
            int expiryMinutes) throws MessagingException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(
                mimeMessage, false, StandardCharsets.UTF_8.name());
        if (fromEmail != null && !fromEmail.isBlank()) {
            helper.setFrom(fromEmail);
        }
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(buildHtmlBody(otpCode, expiryMinutes), true);
        mailSender.send(mimeMessage);
    }

    static String buildHtmlBody(String otpCode, int expiryMinutes) {
        return """
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                  <meta charset="UTF-8" />
                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                  <title>NextBooks - Mã xác minh</title>
                </head>
                <body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1e293b;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background-color:#f0f4f8;padding:32px 16px;">
                    <tr>
                      <td align="center">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:540px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 25px rgba(15,23,42,0.08);">
                          <!-- Header -->
                          <tr>
                            <td style="background:linear-gradient(135deg,#1677ff 0%%,#0958d9 100%%);padding:28px 32px;text-align:center;">
                              <div style="display:inline-block;background-color:rgba(255,255,255,0.18);padding:8px 16px;border-radius:999px;margin-bottom:10px;">
                                <span style="color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.6px;">&#128218; NEXTBOOKS</span>
                              </div>
                              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">
                                Xác minh tài khoản của bạn
                              </h1>
                            </td>
                          </tr>
                          <!-- Body -->
                          <tr>
                            <td style="padding:32px;">
                              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">
                                Xin chào,
                              </p>
                              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:#334155;">
                                Cảm ơn bạn đã sử dụng <strong>NextBooks</strong>. Vui lòng nhập mã xác minh (OTP) dưới đây để hoàn tất thao tác của bạn:
                              </p>
                              <!-- OTP Box -->
                              <div style="background:linear-gradient(180deg,#f8fbff 0%%,#eef5ff 100%%);border:2px dashed #91caff;border-radius:12px;padding:22px 16px;text-align:center;margin:0 0 24px 0;">
                                <div style="font-size:12px;text-transform:uppercase;letter-spacing:1.2px;color:#64748b;margin-bottom:8px;font-weight:600;">
                                  Mã xác minh của bạn
                                </div>
                                <div style="font-size:34px;font-weight:800;letter-spacing:8px;color:#1677ff;font-family:'Courier New',Courier,monospace;">
                                  %s
                                </div>
                              </div>
                              <div style="background-color:#fffbeb;border-left:4px solid #f59e0b;border-radius:6px;padding:12px 16px;margin:0 0 20px 0;">
                                <p style="margin:0;font-size:13px;line-height:1.5;color:#92400e;">
                                  <strong>Lưu ý:</strong> Mã này có hiệu lực trong <strong>%d phút</strong>. Tuyệt đối không chia sẻ mã OTP này với bất kỳ ai.
                                </p>
                              </div>
                              <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">
                                Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
                              </p>
                            </td>
                          </tr>
                          <!-- Footer -->
                          <tr>
                            <td style="background-color:#f8fafc;padding:18px 32px;text-align:center;border-top:1px solid #e2e8f0;">
                              <p style="margin:0;font-size:12px;color:#94a3b8;">
                                &copy; 2026 NextBooks &bull; Nền tảng trao đổi &amp; mua bán sách sinh viên
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(otpCode, expiryMinutes);
    }
}

package com.ulis.business.service.impl;

import com.ulis.business.entity.Feedback;
import com.ulis.business.entity.Invoice;
import com.ulis.business.entity.InvoiceItem;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.Locale;

/**
 * Helper gửi email Hóa đơn, Nhắc nhở giao dịch (TASK-01) và Góp ý cuối trang (TASK-09).
 * Tự động log ở chế độ Dev hoặc gửi thật qua SMTP khi đã cấu hình mailSender.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NextBookMailHelper {

    private static final String NEXTBOOK_ADMIN_EMAIL = "nexteraofbooks@gmail.com";

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:nexteraofbooks@gmail.com}")
    private String fromEmail;

    @Value("${app.domain:nextbook.ulis.edu.vn}")
    private String appDomain;

    public void sendInvoiceCreatedEmail(Invoice invoice) {
        String subject = "[NextBook] Xác nhận Hóa đơn giao dịch sách #" + invoice.getInvoiceCode();
        String html = buildInvoiceHtml(invoice, false);
        sendHtmlSafe(invoice.getBuyer().getEmail(), subject, html);
    }

    public void sendInvoiceReminderEmail(Invoice invoice) {
        String subject = String.format(
                "[NextBook] Nhắc nhở xác nhận đơn hàng #%s (Lần %d/3)",
                invoice.getInvoiceCode(), invoice.getReminderCount());
        String html = buildInvoiceHtml(invoice, true);
        sendHtmlSafe(invoice.getBuyer().getEmail(), subject, html);
    }

    public void sendFeedbackToAdminEmail(Feedback feedback) {
        String subject = "[NextBook Góp ý] Từ " + feedback.getSenderName() + " (" + feedback.getSenderEmail() + ")";
        String html = """
                <!DOCTYPE html>
                <html lang="vi">
                <body style="margin:0;padding:24px;background:#fff4eb;font-family:'Lexend',Tahoma,sans-serif;color:#3d1534;">
                  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:8px;padding:24px;border:1px solid #e6d7c8;">
                    <h2 style="margin:0 0 12px;color:#3e4b8e;font-weight:700;">Yêu cầu / Góp ý mới từ NextBook (%s)</h2>
                    <p style="margin:4px 0;"><strong>Người gửi:</strong> %s</p>
                    <p style="margin:4px 0;"><strong>Email liên hệ:</strong> %s</p>
                    <p style="margin:4px 0;"><strong>Phân loại:</strong> %s</p>
                    <div style="margin-top:14px;padding:14px;background:#f6e0b6;border-radius:6px;">
                      <strong>Nội dung góp ý:</strong>
                      <p style="margin:8px 0 0;white-space:pre-wrap;">%s</p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(
                appDomain,
                feedback.getSenderName(),
                feedback.getSenderEmail(),
                feedback.getCategory() == null ? "Góp ý chung" : feedback.getCategory(),
                feedback.getContent());
        sendHtmlSafe(NEXTBOOK_ADMIN_EMAIL, subject, html);
    }

    private String buildInvoiceHtml(Invoice invoice, boolean isReminder) {
        NumberFormat vnd = NumberFormat.getInstance(new Locale("vi", "VN"));
        StringBuilder rows = new StringBuilder();
        for (InvoiceItem item : invoice.getItems()) {
            rows.append("""
                    <tr>
                      <td style="padding:8px 10px;border-bottom:1px solid #f0e6da;"><strong>[%s]</strong> %s</td>
                      <td style="padding:8px 10px;border-bottom:1px solid #f0e6da;text-align:center;">%d</td>
                      <td style="padding:8px 10px;border-bottom:1px solid #f0e6da;text-align:right;">%s đ</td>
                    </tr>
                    """.formatted(
                    item.getBookCode() == null ? item.getCourseCode() : item.getBookCode(),
                    item.getBookTitle(),
                    item.getQuantity(),
                    vnd.format(item.getUnitPrice())));
        }

        String badgeText = isReminder
                ? "NHẮC NHỞ XÁC NHẬN ĐƠN HÀNG (LẦN " + invoice.getReminderCount() + "/3)"
                : "ĐƠN HÀNG ĐÃ ĐƯỢC NGƯỜI BÁN XÁC NHẬN";

        return """
                <!DOCTYPE html>
                <html lang="vi">
                <body style="margin:0;padding:24px;background:#fff4eb;font-family:'Lexend',Tahoma,sans-serif;color:#3d1534;">
                  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e6d7c8;">
                    <div style="background:#3e4b8e;color:#ffffff;padding:20px 24px;">
                      <div style="font-size:12px;font-weight:700;letter-spacing:0.06em;opacity:0.9;">NEXTBOOK · %s</div>
                      <h2 style="margin:6px 0 0;font-size:20px;font-weight:700;">%s — #%s</h2>
                    </div>
                    <div style="padding:24px;">
                      <p style="margin:0 0 12px;">Xin chào <strong>%s</strong>,</p>
                      <p style="margin:0 0 16px;line-height:1.55;">
                        Người bán <strong>%s</strong> (%s) đã chốt hóa đơn giao dịch sách với bạn trên <strong>NextBook</strong>.
                        Sau khi kiểm tra và nhận sách trực tiếp, vui lòng mở khung Chat trên hệ thống để bấm <strong>"Đã nhận sách &amp; Hoàn tất"</strong> (cộng +1 điểm uy tín cho cả hai bên).
                      </p>
                      <table width="100%%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:16px;font-size:13px;">
                        <thead>
                          <tr style="background:#f6e0b6;color:#3d1534;">
                            <th style="padding:8px 10px;text-align:left;">Sách / Giáo trình</th>
                            <th style="padding:8px 10px;text-align:center;">SL</th>
                            <th style="padding:8px 10px;text-align:right;">Đơn giá</th>
                          </tr>
                        </thead>
                        <tbody>
                          %s
                        </tbody>
                      </table>
                      <div style="padding:12px 16px;background:#fff4eb;border-radius:6px;margin-bottom:16px;font-size:13.5px;">
                        <div><strong>Tổng thanh toán:</strong> <span style="color:#3e4b8e;font-weight:700;">%s đ</span></div>
                        <div><strong>Điểm hẹn nhận sách:</strong> %s</div>
                        <div><strong>Thời gian hẹn:</strong> %s</div>
                      </div>
                      <div style="text-align:center;margin-top:20px;">
                        <a href="https://%s/chat" style="display:inline-block;padding:10px 22px;background:#3e4b8e;color:#ffffff;text-decoration:none;border-radius:4px;font-weight:700;">
                          Mở Chat &amp; Xác nhận Giao dịch
                        </a>
                      </div>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(
                appDomain,
                badgeText,
                invoice.getInvoiceCode(),
                invoice.getBuyer().getFullName(),
                invoice.getSeller().getFullName(),
                invoice.getSeller().getEmail(),
                rows.toString(),
                vnd.format(invoice.getTotalAmount()),
                invoice.getMeetLocation() == null ? "Khuôn viên ULIS" : invoice.getMeetLocation(),
                invoice.getMeetTime() == null ? "Theo thỏa thuận trong chat" : invoice.getMeetTime(),
                appDomain);
    }

    private void sendHtmlSafe(String toEmail, String subject, String htmlBody) {
        log.info("[NextBook Mail] To={} | Subject={}", toEmail, subject);
        if (mailSender == null) {
            return;
        }
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    mimeMessage, false, StandardCharsets.UTF_8.name());
            if (fromEmail != null && !fromEmail.isBlank()) {
                helper.setFrom(fromEmail);
            }
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(mimeMessage);
        } catch (Exception ex) {
            log.warn("Could not send real SMTP email to {} (logged for dev/test): {}", toEmail, ex.getMessage());
        }
    }
}

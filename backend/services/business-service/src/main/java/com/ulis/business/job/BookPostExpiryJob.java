package com.ulis.business.job;

import com.ulis.business.enums.BookPostStatus;
import com.ulis.business.repository.BookPostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Job hết hạn bài đăng (ticket 05): định kỳ lật mọi tin SELLING có EXPIRED_AT
 * quá hạn sang EXPIRED — không cần thao tác tay. Câu UPDATE handle both sides:
 * vừa giữ nguyên các trạng thái khác (SOLD/HIDDEN/EXPIRED/BANNED), vừa không
 * loại trừ tin đã hết hạn này khỏi chợ (search chỉ trả SELLING/SOLD).
 *
 * Schedule đọc từ cấu hình {@code app.post.expiry.*}; mặc định chạy mỗi 60s sau
 * 120s khởi động. Test gọi trực tiếp {@link #expire()} để điều khiển chủ động.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BookPostExpiryJob {

    private final BookPostRepository postRepository;

    @Scheduled(
            fixedDelayString = "${app.post.expiry.schedule-ms:60000}",
            initialDelayString = "${app.post.expiry.initial-delay-ms:120000}")
    @Transactional
    public void expire() {
        int updated = postRepository.expireByStatusAndExpiredAtBefore(
                BookPostStatus.SELLING, BookPostStatus.EXPIRED, LocalDateTime.now());
        if (updated > 0) {
            log.info("Book post expiry job flipped {} post(s) to EXPIRED", updated);
        }
    }
}

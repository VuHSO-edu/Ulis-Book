package com.ulis.business.domain;

import com.ulis.business.enums.BookPostStatus;
import com.ulis.business.enums.BookPostStatusTrigger;

/**
 * State machine trạng thái bài đăng (ticket 05) — nguồn duy nhất (single source
 * of truth) cho chuyển trạng thái hợp lệ của một tin đăng:
 *
 * <pre>
 *   CREATE : (không có) → SELLING (quantity &gt; 0) | SOLD (quantity = 0)
 *   UPDATE : SELLING/SOLD/HIDDEN/EXPIRED → SELLING | SOLD   (BANNED = cấm)
 *   MARK_SOLD : SELLING → SOLD
 *   DELETE : SELLING/SOLD/HIDDEN/EXPIRED → HIDDEN            (BANNED = cấm)
 *   EXPIRE : SELLING → EXPIRED
 *   BAN    : bất kỳ → BANNED
 * </pre>
 *
 * Writer khác (admin ticket 12) dùng chung để đảm bảo không có transition trái
 * phép; mọi vi phạm bị service chặn với BadRequestException.
 */
public final class BookPostStatusMachine {

    private BookPostStatusMachine() {
    }

    /**
     * Kiểm tra chuyển {@code from} → {@code to} dưới tác nhân {@code trigger}.
     *
     * @param from    trạng thái hiện tại ({@code null} khi tạo mới)
     * @param to      trạng thái đích
     * @param trigger tác nhân chuyển
     */
    public static boolean isAllowed(BookPostStatus from, BookPostStatus to,
                                    BookPostStatusTrigger trigger) {
        return switch (trigger) {
            case CREATE -> to == BookPostStatus.SELLING || to == BookPostStatus.SOLD;
            case UPDATE -> from != BookPostStatus.BANNED
                    && (to == BookPostStatus.SELLING || to == BookPostStatus.SOLD);
            case MARK_SOLD -> from == BookPostStatus.SELLING && to == BookPostStatus.SOLD;
            case DELETE -> from != BookPostStatus.BANNED && to == BookPostStatus.HIDDEN;
            case EXPIRE -> from == BookPostStatus.SELLING && to == BookPostStatus.EXPIRED;
            case BAN -> to == BookPostStatus.BANNED;
        };
    }
}

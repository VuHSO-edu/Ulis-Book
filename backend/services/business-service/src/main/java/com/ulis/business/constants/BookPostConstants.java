package com.ulis.business.constants;

import com.ulis.business.enums.BookPostStatus;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.time.format.DateTimeFormatter;

/**
 * Hằng số domain bài đăng sách (ticket 04).
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class BookPostConstants {

    /** Ảnh bìa mặc định khi FE không gửi coverUrl/images — khớp fallback FE. */
    public static final String DEFAULT_COVER_URL =
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80";

    /** FE render createdAt/expiredAt dạng chuỗi thô — backend trả DD/MM/YYYY. */
    public static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /** Số ngày hiệu lực mặc định của một tin đăng. */
    public static final int EXPIRE_AFTER_DAYS = 30;

    /** Danh mục chỉ hiển thị ở chợ: đang bán + đã bán. */
    public static final BookPostStatus[] PUBLIC_STATUSES = {
            BookPostStatus.SELLING,
            BookPostStatus.SOLD
    };
}

package com.ulis.business.constants;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * Hằng số auth — theo vuhso-java-backend-rules §5.9.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class AuthConstants {

    /** Chỉ chấp nhận email giáo dục đuôi .edu (hoặc .edu.vn) — quyết định đã chốt ở grilling. */
    public static final String EDU_EMAIL_REGEX = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.(edu|edu\\.vn)$";

    public static final String OTP_CODE_REGEX = "\\d{6}";
}

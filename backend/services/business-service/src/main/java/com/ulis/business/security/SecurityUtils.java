package com.ulis.business.security;

import com.ulis.core.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Tiện ích đọc người dùng hiện tại từ SecurityContext — tương đương
 * SecurityUtils trong fis-security (vuhso-java-backend-rules §12).
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    /**
     * @throws UnauthorizedException nếu chưa xác thực (không nên xảy ra vì
     * endpoint đã được bảo vệ bởi filter chain; an toàn khi gọi ở service).
     */
    public static UserPrincipal currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        throw new UnauthorizedException("UNAUTHORIZED");
    }
}

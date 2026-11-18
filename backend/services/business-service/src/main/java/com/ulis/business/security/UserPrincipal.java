package com.ulis.business.security;

import com.ulis.business.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Principal chứa trong SecurityContext sau khi JwtAuthenticationFilter xác thực
 * access token — controller/service lấy qua SecurityUtils.
 */
@Getter
@AllArgsConstructor
public class UserPrincipal {

    private final Long id;

    private final String email;

    private final String fullName;

    private final UserRole role;
}

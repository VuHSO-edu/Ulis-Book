package com.ulis.business.filter;

import com.ulis.business.entity.User;
import com.ulis.business.enums.JwtTokenType;
import com.ulis.business.enums.UserStatus;
import com.ulis.business.repository.UserRepository;
import com.ulis.business.security.UserPrincipal;
import com.ulis.business.service.JwtTokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JwtAuthenticationFilter (ticket 03) — đọc Authorization: Bearer <access token>,
 * xác minh chữ ký/hạn dùng/loại ACCESS, nạp user ACTIVE và đặt SecurityContext.
 * Token sai/hết hạn => bỏ qua (không đặt context) để entry point trả 401 cho
 * endpoint được bảo vệ; hạ tầng công khai (login/otp/health) vẫn chạy bình thường.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";

    private final JwtTokenService jwtTokenService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith(BEARER_PREFIX)) {
            authenticate(header.substring(BEARER_PREFIX.length()).trim());
        }
        filterChain.doFilter(request, response);
    }

    private void authenticate(String token) {
        try {
            Claims claims = jwtTokenService.verify(token, JwtTokenType.ACCESS);
            Long uid = Long.valueOf(claims.get("uid", Number.class).longValue());
            User user = userRepository.findById(uid).orElse(null);
            if (user != null && user.getStatus() == UserStatus.ACTIVE) {
                UserPrincipal principal = new UserPrincipal(
                        user.getId(), user.getEmail(), user.getFullName(), user.getRole());
                var authentication = new UsernamePasswordAuthenticationToken(
                        principal, null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                SecurityContextHolder.clearContext();
            }
        } catch (JwtException | IllegalArgumentException e) {
            SecurityContextHolder.clearContext();
            log.debug("Bỏ qua JWT không hợp lệ: {}", e.getMessage());
        }
    }
}

package com.ulis.business.websocket;

import com.ulis.business.entity.User;
import com.ulis.business.enums.JwtTokenType;
import com.ulis.business.enums.UserStatus;
import com.ulis.business.repository.UserRepository;
import com.ulis.business.service.JwtTokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Xác thực JWT ngay tại WebSocket handshake (ticket 09): browser không thể đặt
 * header tuỳ chỉnh khi bắt tay WS nên client truyền access token qua query param
 * <code>?token=</code>. Token sai/hết hạn/user không ACTIVE => từ chối handshake
 * (connection không được thiết lập). Principal hợp lệ được lưu vào attributes để
 * WsConfig.determineUser gán cho phiên STOMP.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WsHandshakeInterceptor implements HandshakeInterceptor {

    public static final String ATTR_PRINCIPAL = "ULIS_WS_PRINCIPAL";

    private static final String TOKEN_PARAM = "token";

    private final JwtTokenService jwtTokenService;
    private final UserRepository userRepository;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        String token = extractToken(request);
        if (token == null) {
            log.debug("Từ chối WS handshake: thiếu token");
            return false;
        }
        try {
            Claims claims = jwtTokenService.verify(token, JwtTokenType.ACCESS);
            Long uid = Long.valueOf(claims.get("uid", Number.class).longValue());
            User user = userRepository.findById(uid).orElse(null);
            if (user == null || user.getStatus() != UserStatus.ACTIVE) {
                log.debug("Từ chối WS handshake: user {} không ACTIVE", uid);
                return false;
            }
            attributes.put(ATTR_PRINCIPAL, new WsPrincipal(
                    user.getId(), user.getEmail(), user.getFullName(), user.getRole()));
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Từ chối WS handshake: token không hợp lệ - {}", e.getMessage());
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // không cần xử lý thêm
    }

    private String extractToken(ServerHttpRequest request) {
        URI uri = request.getURI();
        String query = uri.getQuery();
        if (query == null) {
            return null;
        }
        for (String pair : query.split("&")) {
            int eq = pair.indexOf('=');
            if (eq > 0 && TOKEN_PARAM.equals(pair.substring(0, eq))) {
                return URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
            }
        }
        return null;
    }
}

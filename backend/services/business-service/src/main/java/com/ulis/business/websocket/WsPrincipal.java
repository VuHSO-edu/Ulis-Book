package com.ulis.business.websocket;

import com.ulis.business.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.security.Principal;

/**
 * Principal của phiên WebSocket/STOMP (ticket 09) — được tạo lúc handshake sau
 * khi xác thực JWT trong WsHandshakeInterceptor. getName() = userId (dạng chuỗi)
 * để broker định tuyến /user/{userId}/queue/... đúng từng người.
 */
@Getter
@AllArgsConstructor
public class WsPrincipal implements Principal {

    private final Long id;

    private final String email;

    private final String fullName;

    private final UserRole role;

    @Override
    public String getName() {
        return String.valueOf(id);
    }

    /** Lấy userId từ Principal STOMP; null nếu không phải principal WS của ta. */
    public static Long userId(Principal principal) {
        if (principal instanceof WsPrincipal ws) {
            return ws.getId();
        }
        if (principal != null) {
            try {
                return Long.valueOf(principal.getName());
            } catch (NumberFormatException ignored) {
                // principal lạ (vd principal mặc định theo tên) — coi như không xác thực
            }
        }
        return null;
    }
}

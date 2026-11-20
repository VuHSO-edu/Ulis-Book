package com.ulis.business.websocket;

import com.ulis.business.dto.request.ChatRealtimeSendRequest;
import com.ulis.business.service.ChatRealtimeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * Điểm nhận STOMP (ticket 09). Client gửi tới <code>/app/chat.send</code>;
 * userId lấy từ principal đã xác thực ở handshake (WsPrincipal). Kết quả và lỗi
 * được đẩy qua queue cá nhân trong {@link ChatRealtimeService}.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatRealtimeController {

    private final ChatRealtimeService chatRealtimeService;

    @MessageMapping("/chat.send")
    public void send(@Payload ChatRealtimeSendRequest request, Principal principal) {
        Long userId = WsPrincipal.userId(principal);
        if (userId == null) {
            log.warn("Nhận chat.send từ phiên STOMP không có principal hợp lệ — bỏ qua");
            return;
        }
        chatRealtimeService.send(userId, request);
    }
}

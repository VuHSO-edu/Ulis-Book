package com.ulis.business.service;

import com.ulis.business.dto.request.ChatRealtimeSendRequest;

/**
 * Nghiệp vụ chat realtime qua STOMP (ticket 09): lưu tin bằng {@link ChatService#send}
 * rồi đẩy tin nhắn + hội thoại (kèm unread) tới queue cá nhân của cả hai bên.
 * Lỗi nghiệp vụ được đẩy về <code>/user/queue/chat.errors</code> của người gửi.
 */
public interface ChatRealtimeService {

    /**
     * Gửi tin nhắn realtime.
     *
     * @param senderId userId của principal STOMP (đã xác thực ở handshake)
     * @param request  hội thoại + nội dung
     */
    void send(Long senderId, ChatRealtimeSendRequest request);
}

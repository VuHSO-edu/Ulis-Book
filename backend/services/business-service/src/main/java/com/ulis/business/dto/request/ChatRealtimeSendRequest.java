package com.ulis.business.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload gửi tin qua STOMP (ticket 09) tới <code>/app/chat.send</code>:
 * <code>{conversationId, content}</code>. Cùng nghiệp vụ với REST
 * <code>SendMessageRequest</code> nhưng kèm conversationId vì destination không
 * mang path variable. Validate thủ công ở service (lỗi được đẩy về
 * <code>/user/queue/chat.errors</code> thay vì HTTP 400).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRealtimeSendRequest {

    private Long conversationId;

    private String content;
}

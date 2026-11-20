package com.ulis.business.service.impl;

import com.ulis.business.dto.request.ChatRealtimeSendRequest;
import com.ulis.business.dto.request.SendMessageRequest;
import com.ulis.business.dto.response.ChatConversationResponse;
import com.ulis.business.dto.response.ChatErrorResponse;
import com.ulis.business.dto.response.ChatMessageResponse;
import com.ulis.business.service.ChatRealtimeService;
import com.ulis.business.service.ChatService;
import com.ulis.core.exception.BadRequestException;
import com.ulis.core.exception.ForbiddenException;
import com.ulis.core.exception.NotFoundException;
import com.ulis.core.helper.MessageHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * ChatRealtimeServiceImpl (ticket 09):
 * <ol>
 *   <li>validate payload (conversationId + content);</li>
 *   <li>lưu tin bằng {@link ChatService#send} — cùng transaction DB như REST nên
 *       không có chuyện "hiện realtime mà không lưu";</li>
 *   <li>lấy hội thoại theo góc nhìn từng người (unread/isLastFromMe riêng);</li>
 *   <li>đẩy tin nhắn tới queue của cả hai, đẩy hội thoại (kèm unreadCount) tới
 *       từng người để badge cập nhật ngay.</li>
 * </ol>
 * Lỗi nghiệp vụ (400/403/404) đẩy message gốc; lỗi bất ngờ đẩy message chung.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatRealtimeServiceImpl implements ChatRealtimeService {

    private static final String QUEUE_MESSAGES = "/queue/chat.messages";
    private static final String QUEUE_CONVERSATIONS = "/queue/chat.conversations";
    private static final String QUEUE_ERRORS = "/queue/chat.errors";

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final MessageHelper messageHelper;

    @Override
    public void send(Long senderId, ChatRealtimeSendRequest request) {
        if (senderId == null) {
            log.warn("Bỏ qua chat.send: không xác định được người gửi");
            return;
        }
        try {
            if (request == null || request.getConversationId() == null) {
                throw new BadRequestException(messageHelper.getMessage("conversation.notFound"));
            }
            String content = request.getContent() == null ? null : request.getContent().trim();
            if (content == null || content.isEmpty()) {
                throw new BadRequestException(messageHelper.getMessage("conversation.content.required"));
            }

            Long conversationId = request.getConversationId();
            ChatMessageResponse message = chatService.send(senderId, conversationId,
                    SendMessageRequest.builder().content(content).build());

            ChatConversationResponse senderView = chatService.getConversation(senderId, conversationId);
            Long receiverId = senderView.getPeerId();
            ChatConversationResponse receiverView = chatService.getConversation(receiverId, conversationId);

            // Tin nhắn tới cả hai (người gửi thấy tin của mình ngay, không cần reload).
            sendToUser(senderId, QUEUE_MESSAGES, message);
            sendToUser(receiverId, QUEUE_MESSAGES, message);

            // Hội thoại cập nhật: người nhận tăng unread, người gửi unread không đổi.
            sendToUser(senderId, QUEUE_CONVERSATIONS, senderView);
            sendToUser(receiverId, QUEUE_CONVERSATIONS, receiverView);

            log.debug("Pushed realtime message id={} to users {} and {}",
                    message.getId(), senderId, receiverId);
        } catch (BadRequestException | ForbiddenException | NotFoundException e) {
            log.debug("chat.send bị từ chối cho user {}: {}", senderId, e.getMessage());
            sendToUser(senderId, QUEUE_ERRORS, ChatErrorResponse.builder().message(e.getMessage()).build());
        } catch (RuntimeException e) {
            log.error("Lỗi không mong đợi khi chat.send cho user {}", senderId, e);
            sendToUser(senderId, QUEUE_ERRORS,
                    ChatErrorResponse.builder().message(messageHelper.getMessage("chat.ws.error")).build());
        }
    }

    private void sendToUser(Long userId, String destination, Object payload) {
        messagingTemplate.convertAndSendToUser(String.valueOf(userId), destination, payload);
    }
}

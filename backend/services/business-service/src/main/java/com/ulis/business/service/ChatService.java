package com.ulis.business.service;

import com.ulis.business.dto.request.ConversationListRequest;
import com.ulis.business.dto.request.ConversationMessageListRequest;
import com.ulis.business.dto.request.ConversationOpenRequest;
import com.ulis.business.dto.request.SendMessageRequest;
import com.ulis.business.dto.response.ChatConversationResponse;
import com.ulis.business.dto.response.ChatMessageResponse;
import com.ulis.core.model.response.PageableResponse;

/**
 * Chat 1-1 dạng REST (ticket 08):
 * - list hội thoại của tôi (unread per conv, mới hoạt động trước);
 * - open/get-or-create theo cặp (+ bài đăng tuỳ chọn) — reuse không duplicate;
 * - lịch sử tin nhắn phân trang (page 1 = block mới nhất, ascending để render);
 * - gửi tin + đánh dấu đã đọc; chỉ user trong hội thoại mới truy cập được.
 */
public interface ChatService {

    PageableResponse<ChatConversationResponse> listConversations(Long userId, ConversationListRequest request);

    ChatConversationResponse open(Long userId, ConversationOpenRequest request);

    PageableResponse<ChatMessageResponse> listMessages(Long userId, Long conversationId,
                                                       ConversationMessageListRequest request);

    ChatMessageResponse send(Long userId, Long conversationId, SendMessageRequest request);

    void markRead(Long userId, Long conversationId);
}

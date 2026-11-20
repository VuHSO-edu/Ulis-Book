package com.ulis.business.controller;

import com.ulis.business.dto.request.ConversationListRequest;
import com.ulis.business.dto.request.ConversationMessageListRequest;
import com.ulis.business.dto.request.ConversationOpenRequest;
import com.ulis.business.dto.request.SendMessageRequest;
import com.ulis.business.security.SecurityUtils;
import com.ulis.business.service.ChatService;
import com.ulis.core.helper.MessageHelper;
import com.ulis.core.http.ResponseBuilder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Chat hội thoại + lịch sử (ticket 08) — mọi endpoint yêu cầu JWT (user phải
 * thuộc hội thoại). Khớp contract FE chat.ts: /conversations/search,
 * /conversations/{id}/messages, /conversations/{id}/messages/send,
 * /conversations/{id}/read; /conversations/open là building block backend
 * (reuse cặp) dùng cho realtime (ticket 09).
 */
@RestController
@RequestMapping("/conversations")
@Tag(name = "ChatController", description = "Hội thoại + lịch sử chat 1-1")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final MessageHelper messageHelper;

    @PostMapping("/search")
    @Operation(summary = "Danh sách hội thoại của tôi")
    public ResponseEntity<Object> search(@Valid @RequestBody(required = false) ConversationListRequest request) {
        return ResponseBuilder.ok(chatService.listConversations(SecurityUtils.currentUser().getId(), request));
    }

    @PostMapping("/open")
    @Operation(summary = "Mở (hoặc tái sử dụng) hội thoại với một user, tuỳ chọn gắn bài đăng")
    public ResponseEntity<Object> open(@Valid @RequestBody ConversationOpenRequest request) {
        return ResponseBuilder.ok(
                chatService.open(SecurityUtils.currentUser().getId(), request),
                messageHelper.getMessage("conversation.opened"));
    }

    @PostMapping("/{id}/messages")
    @Operation(summary = "Lịch sử tin nhắn của hội thoại (phân trang, block mới nhất trước)")
    public ResponseEntity<Object> messages(@PathVariable Long id,
                                           @Valid @RequestBody(required = false) ConversationMessageListRequest request) {
        return ResponseBuilder.ok(
                chatService.listMessages(SecurityUtils.currentUser().getId(), id, request));
    }

    @PostMapping("/{id}/messages/send")
    @Operation(summary = "Gửi tin nhắn trong hội thoại")
    public ResponseEntity<Object> send(@PathVariable Long id,
                                       @Valid @RequestBody SendMessageRequest request) {
        return ResponseBuilder.ok(
                chatService.send(SecurityUtils.currentUser().getId(), id, request),
                messageHelper.getMessage("conversation.sent"));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Đánh dấu hội thoại đã đọc (tin của đối phương)")
    public ResponseEntity<Object> read(@PathVariable Long id) {
        chatService.markRead(SecurityUtils.currentUser().getId(), id);
        return ResponseBuilder.ok(null, messageHelper.getMessage("conversation.read"));
    }
}

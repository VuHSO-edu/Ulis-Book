package com.ulis.business.dto.response;

import com.ulis.business.entity.ChatMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Tin nhắn trả về — khớp ChatMessageItem bên FE (mock-data.ts):
 * id, conversationId, senderId, senderName, content, createdAt, isRead,
 * isAppointment. createdAt "dd/MM/yyyy HH:mm" (cùng kiểu INITIAL_MESSAGES FE);
 * isAppointment luôn false (ticket realtime sau).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {

    private static final DateTimeFormatter FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private Long id;

    private Long conversationId;

    private Long senderId;

    private String senderName;

    private String content;

    private String createdAt;

    private Boolean isRead;

    private Boolean isAppointment;

    public static ChatMessageResponse from(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .senderId(message.getSender().getId())
                .senderName(message.getSender().getFullName())
                .content(message.getContent())
                .createdAt(message.getCreatedAt() == null ? "" : message.getCreatedAt().format(FORMAT))
                .isRead(Boolean.TRUE.equals(message.getIsRead()))
                .isAppointment(false)
                .build();
    }
}

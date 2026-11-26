package com.ulis.business.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Tin nhắn trong hội thoại (ticket 08). isRead = đã bị người nhận (user còn
 * lại) đọc — tin mình gửi có isRead=false cho đến khi đối phương mở hội thoại
 * (PUT /conversations/{id}/read). Bất biến sau khi tạo.
 */
@Getter
@Setter
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "CHAT_MESSAGES")
public class ChatMessage implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "CHAT_MESSAGES_SEQ_GEN")
    @SequenceGenerator(name = "CHAT_MESSAGES_SEQ_GEN", sequenceName = "CHAT_MESSAGES_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "CONVERSATION_ID", nullable = false)
    private ChatConversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "SENDER_ID", nullable = false)
    private User sender;

    @Column(name = "CONTENT", nullable = false, length = 2000)
    private String content;

    @Column(name = "IS_READ", nullable = false)
    private Boolean isRead;

    @Column(name = "MESSAGE_TYPE", length = 30)
    private String messageType;

    @Column(name = "INVOICE_ID")
    private Long invoiceId;

    @Column(name = "INVOICE_PAYLOAD", length = 4000)
    private String invoicePayload;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @Column(name = "CREATED_BY", length = 50)
    private String createdBy;
}

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
 * Hội thoại 1-1 giữa hai user (ticket 08), tuỳ chọn gắn với một bài đăng
 * (contextBook). Cặp (userA, userB, post) là unique: userA = min(id), userB =
 * max(id) nên cùng cặp + cùng bài đăng sẽ reuse hội thoại cũ, không duplicate.
 * lastMessage/lastMessageAt/lastSenderId denormalize để render list không join
 * tin nhắn mới nhất.
 */
@Getter
@Setter
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "CHAT_CONVERSATIONS")
public class ChatConversation implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "CHAT_CONVERSATIONS_SEQ_GEN")
    @SequenceGenerator(name = "CHAT_CONVERSATIONS_SEQ_GEN", sequenceName = "CHAT_CONVERSATIONS_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    /** User nhỏ hơn của cặp (chuẩn hoá để unique theo cặp). */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "USER_A_ID", nullable = false)
    private User userA;

    /** User lớn hơn của cặp. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "USER_B_ID", nullable = false)
    private User userB;

    /** Bài đăng ngữ cảnh (nullable — hội thoại chung không gắn bài). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "POST_ID")
    private BookPost post;

    @Column(name = "LAST_MESSAGE", length = 2000)
    private String lastMessage;

    @Column(name = "LAST_MESSAGE_AT")
    private LocalDateTime lastMessageAt;

    @Column(name = "LAST_SENDER_ID")
    private Long lastSenderId;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    @Column(name = "CREATED_BY", length = 50)
    private String createdBy;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;
}

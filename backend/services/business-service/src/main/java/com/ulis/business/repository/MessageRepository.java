package com.ulis.business.repository;

import com.ulis.business.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository tin nhắn (ticket 08). unread = tin của người khác chưa đọc;
 * markAllRead lật hàng loạt khi một bên mở hội thoại.
 */
@Repository
public interface MessageRepository extends JpaRepository<ChatMessage, Long> {

    Page<ChatMessage> findByConversationId(Long conversationId, Pageable pageable);

    /** Số tin chưa đọc của userId trong hội thoại (tin do phía kia gửi). */
    long countByConversationIdAndSenderIdNotAndIsReadFalse(Long conversationId, Long senderId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update ChatMessage m
               set m.isRead = true
             where m.conversation.id = :conversationId
               and m.sender.id != :selfId
               and m.isRead = false
            """)
    int markAllRead(@Param("conversationId") Long conversationId, @Param("selfId") Long selfId);
}

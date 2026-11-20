package com.ulis.business.repository;

import com.ulis.business.entity.ChatConversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository hội thoại chat (ticket 08). Cặp (userA, userB, post) unique với
 * userA = min(id), userB = max(id) — tìm bằng câu truy vấn xử lý post nullable.
 */
@Repository
public interface ConversationRepository extends JpaRepository<ChatConversation, Long> {

    /**
     * Tìm hội thoại đúng cặp (đã chuẩn hoá userA < userB) và bài đăng —
     * postId null = hội thoại chung không gắn bài.
     */
    @Query("""
            select c from ChatConversation c
             where c.userA.id = :a and c.userB.id = :b
               and ((:postId is null and c.post is null) or (:postId is not null and c.post.id = :postId))
            """)
    Optional<ChatConversation> findPair(@Param("a") Long userAId,
                                        @Param("b") Long userBId,
                                        @Param("postId") Long postId);

    /** Danh sách hội thoại của một user (người tham gia). Mới hoạt động trước —
     * hội thoại chưa nhắn (lastMessageAt null) xếp theo thời gian tạo (COALESCE),
     * không nhảy lên đầu. Query kèm count. */
    @Query(value = """
            select c from ChatConversation c
             where c.userA.id = :uid or c.userB.id = :uid
             order by coalesce(c.lastMessageAt, c.createdAt) desc, c.id desc
            """,
            countQuery = "select count(c) from ChatConversation c where c.userA.id = :uid or c.userB.id = :uid")
    Page<ChatConversation> findByParticipant(@Param("uid") Long userId, Pageable pageable);
}

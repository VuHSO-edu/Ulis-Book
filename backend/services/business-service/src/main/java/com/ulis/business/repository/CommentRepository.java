package com.ulis.business.repository;

import com.ulis.business.entity.BookComment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository bình luận (ticket 07). Xoá bình luận = hard delete (khớp fallback
 * FE filter) — mỗi tin giữ ít comment nên không cần soft delete.
 */
@Repository
public interface CommentRepository extends JpaRepository<BookComment, Long> {

    Page<BookComment> findByPostId(Long postId, Pageable pageable);
}

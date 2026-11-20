package com.ulis.business.repository;

import com.ulis.business.entity.BookPost;
import com.ulis.business.enums.BookPostStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/**
 * Repository bài đăng sách — Specification cho search kết hợp bộ lọc + sắp xếp.
 */
@Repository
public interface BookPostRepository
        extends JpaRepository<BookPost, Long>, JpaSpecificationExecutor<BookPost> {

    boolean existsByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCaseAndIdNot(String code, Long id);

    List<BookPost> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    /** Số bài còn hiển thị của một danh mục (SELLING/SOLD) — cho category.bookCount. */
    long countByFacultyCodeAndStatusIn(String facultyCode, Collection<BookPostStatus> statuses);

    long countByBookTypeCodeAndStatusIn(String bookTypeCode, Collection<BookPostStatus> statuses);

    /**
     * Job hết hạn (ticket 05): lật mọi bài {@code from} có EXPIRED_AT quá hạn
     * sang {@code to} trong một câu UPDATE — không cần load từng entity.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update BookPost p
               set p.status = :to, p.updatedAt = :now, p.updatedBy = 'system'
             where p.status = :from and p.expiredAt < :now
            """)
    int expireByStatusAndExpiredAtBefore(@Param("from") BookPostStatus from,
                                         @Param("to") BookPostStatus to,
                                         @Param("now") LocalDateTime now);
}

package com.ulis.business.repository;

import com.ulis.business.entity.BookPost;
import com.ulis.business.enums.BookPostStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

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
}

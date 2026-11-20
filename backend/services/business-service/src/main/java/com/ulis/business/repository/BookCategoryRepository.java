package com.ulis.business.repository;

import com.ulis.business.entity.BookCategory;
import com.ulis.business.enums.BookCategoryAxis;
import com.ulis.business.enums.BookCategoryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository danh mục — theo vuhso-java-backend-rules §5.6 (derived methods).
 */
@Repository
public interface BookCategoryRepository extends JpaRepository<BookCategory, Long> {

    List<BookCategory> findByStatusOrderBySortOrderAsc(BookCategoryStatus status);

    Optional<BookCategory> findByCodeIgnoreCase(String code);

    Optional<BookCategory> findByCodeIgnoreCaseAndStatus(String code, BookCategoryStatus status);

    Optional<BookCategory> findByCodeIgnoreCaseAndParentAxis(
            String code, BookCategoryAxis parentAxis);
}

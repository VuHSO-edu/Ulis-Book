package com.ulis.business.entity;

import com.ulis.business.enums.BookCategoryAxis;
import com.ulis.business.enums.BookCategoryStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
 * Danh mục phân loại sách (ticket 04) — seed 10 danh mục khi khởi động nếu bảng
 * rỗng. Hai trục: FACULTY (khoa) và BOOK_TYPE (loại sách) — khớp mock-data FE.
 */
@Getter
@Setter
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "BOOK_CATEGORIES")
public class BookCategory implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "BOOK_CATEGORIES_SEQ_GEN")
    @SequenceGenerator(name = "BOOK_CATEGORIES_SEQ_GEN", sequenceName = "BOOK_CATEGORIES_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    /** Mã ổn định để FE tham chiếu (ENG_FACULTY, TYPE_GIAOTRINH, ...). */
    @Column(name = "CODE", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "NAME", nullable = false, length = 150)
    private String name;

    @Column(name = "SUBTITLE", length = 500)
    private String subtitle;

    @Enumerated(EnumType.STRING)
    @Column(name = "PARENT_AXIS", nullable = false, length = 20)
    private BookCategoryAxis parentAxis;

    @Column(name = "SORT_ORDER", nullable = false)
    private Integer sortOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false, length = 20)
    private BookCategoryStatus status;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;
}

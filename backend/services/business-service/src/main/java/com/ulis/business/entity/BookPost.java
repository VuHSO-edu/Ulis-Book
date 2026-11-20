package com.ulis.business.entity;

import com.ulis.business.enums.BookPostStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Bài đăng bán/tặng sách (ticket 04). Tên khoa/loại sách được denormalize từ
 * BOOK_CATEGORIES để tránh join khi lướt tin. owner → USERS; images cascase
 * toàn bộ (mỗi bài 1..3 ảnh).
 */
@Getter
@Setter
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "BOOK_POSTS")
public class BookPost implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "BOOK_POSTS_SEQ_GEN")
    @SequenceGenerator(name = "BOOK_POSTS_SEQ_GEN", sequenceName = "BOOK_POSTS_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    /** Mã bài đăng (FE tự sinh POST_XXXX); unique không phân biệt hoa thường. */
    @Column(name = "CODE", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "TITLE", nullable = false, length = 255)
    private String title;

    @Column(name = "COURSE_CODE", nullable = false, length = 50)
    private String courseCode;

    @Column(name = "BOOK_TYPE_CODE", nullable = false, length = 50)
    private String bookTypeCode;

    @Column(name = "BOOK_TYPE_NAME", length = 150)
    private String bookTypeName;

    @Column(name = "FACULTY_CODE", nullable = false, length = 50)
    private String facultyCode;

    @Column(name = "FACULTY_NAME", length = 150)
    private String facultyName;

    @Column(name = "IS_GIVEAWAY", nullable = false)
    private Boolean isGiveaway;

    @Column(name = "PRICE", nullable = false, precision = 12, scale = 0)
    private BigDecimal price;

    @Column(name = "ORIGINAL_PRICE", precision = 12, scale = 0)
    private BigDecimal originalPrice;

    @Column(name = "QUANTITY", nullable = false)
    private Integer quantity;

    /** Mô tả tình trạng sách (text tự do từ FE). */
    @Column(name = "BOOK_CONDITION", length = 500)
    private String condition;

    /** Badge ngắn hiển thị trên thẻ — FE render trực tiếp, backend sinh sẵn. */
    @Column(name = "CONDITION_BADGE", length = 100)
    private String conditionBadge;

    @Column(name = "CAMPUS_LOCATION", nullable = false, length = 100)
    private String campusLocation;

    @Column(name = "DESCRIPTION", nullable = false, length = 4000)
    private String description;

    @Column(name = "COVER_URL", length = 500)
    private String coverUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false, length = 20)
    private BookPostStatus status;

    @Column(name = "VIEW_COUNT", nullable = false)
    private Integer viewCount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "OWNER_ID", nullable = false)
    private User owner;

    @Builder.Default
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BookPostImage> images = new ArrayList<>();

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    @Column(name = "EXPIRED_AT")
    private LocalDateTime expiredAt;

    @Column(name = "CREATED_BY", length = 50)
    private String createdBy;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;
}

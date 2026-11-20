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
 * Bình luận 1 cấp trên bài đăng (ticket 07) — chỉ sửa/xoá bởi chính tác giả
 * hoặc admin (admin delete qua API, UI ở ticket admin). Các trường tác giả
 * authorName/authorEmail/authorCohort/authorInitials/isSeller được denormalize
 * lúc tạo (khớp BookCommentItem bên FE) để đọc danh sách không cần join.
 * Audit fields inline (createdAt/updatedAt/createdBy/updatedBy).
 */
@Getter
@Setter
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "BOOK_COMMENTS")
public class BookComment implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "BOOK_COMMENTS_SEQ_GEN")
    @SequenceGenerator(name = "BOOK_COMMENTS_SEQ_GEN", sequenceName = "BOOK_COMMENTS_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "POST_ID", nullable = false)
    private BookPost post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "AUTHOR_ID", nullable = false)
    private User author;

    @Column(name = "CONTENT", nullable = false, length = 1000)
    private String content;

    // --- Denormalized author fields (khớp BookCommentItem FE) ---
    @Column(name = "AUTHOR_NAME", nullable = false, length = 100)
    private String authorName;

    @Column(name = "AUTHOR_EMAIL", nullable = false, length = 255)
    private String authorEmail;

    @Column(name = "AUTHOR_COHORT", length = 150)
    private String authorCohort;

    @Column(name = "AUTHOR_INITIALS", length = 10)
    private String authorInitials;

    @Column(name = "IS_SELLER", nullable = false)
    private Boolean isSeller;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    @Column(name = "CREATED_BY", length = 50)
    private String createdBy;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;
}

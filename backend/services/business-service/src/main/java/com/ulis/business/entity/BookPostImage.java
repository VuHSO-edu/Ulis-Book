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

/**
 * Ảnh của bài đăng sách (ticket 04) — url là chuỗi (FE không dùng multipart
 * upload, gửi thẳng URL trong JSON). Mỗi bài 1..3 ảnh, sắp xếp theo sortOrder.
 */
@Getter
@Setter
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "BOOK_POST_IMAGES")
public class BookPostImage implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "BOOK_POST_IMAGES_SEQ_GEN")
    @SequenceGenerator(name = "BOOK_POST_IMAGES_SEQ_GEN", sequenceName = "BOOK_POST_IMAGES_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "URL", nullable = false, length = 500)
    private String url;

    @Column(name = "SORT_ORDER", nullable = false)
    private Integer sortOrder;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "POST_ID", nullable = false)
    private BookPost post;
}

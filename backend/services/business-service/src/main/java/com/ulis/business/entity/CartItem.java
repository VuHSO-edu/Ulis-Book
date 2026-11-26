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
 * Mục sách trong Giỏ hàng của người mua, gom nhóm theo Người bán (TASK-08).
 */
@Getter
@Setter
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "CART_ITEMS")
public class CartItem implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "CART_ITEMS_SEQ_GEN")
    @SequenceGenerator(name = "CART_ITEMS_SEQ_GEN", sequenceName = "CART_ITEMS_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "USER_ID", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "BOOK_POST_ID", nullable = false)
    private BookPost bookPost;

    @Column(name = "QUANTITY", nullable = false)
    private Integer quantity;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;
}

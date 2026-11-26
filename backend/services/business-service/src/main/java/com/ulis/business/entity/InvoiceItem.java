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
import java.math.BigDecimal;

/**
 * Chi tiết từng cuốn sách trong Hóa đơn (TASK-01).
 */
@Getter
@Setter
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "INVOICE_ITEMS")
public class InvoiceItem implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "INVOICE_ITEMS_SEQ_GEN")
    @SequenceGenerator(name = "INVOICE_ITEMS_SEQ_GEN", sequenceName = "INVOICE_ITEMS_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "INVOICE_ID", nullable = false)
    private Invoice invoice;

    @Column(name = "BOOK_POST_ID", nullable = false)
    private Long bookPostId;

    @Column(name = "BOOK_CODE", length = 50)
    private String bookCode;

    @Column(name = "BOOK_TITLE", nullable = false, length = 255)
    private String bookTitle;

    @Column(name = "COURSE_CODE", length = 50)
    private String courseCode;

    @Column(name = "COVER_URL", length = 500)
    private String coverUrl;

    @Column(name = "QUANTITY", nullable = false)
    private Integer quantity;

    @Column(name = "UNIT_PRICE", nullable = false, precision = 12, scale = 0)
    private BigDecimal unitPrice;
}

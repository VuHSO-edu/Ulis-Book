package com.ulis.business.entity;

import com.ulis.business.enums.InvoiceStatus;
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
 * Hóa đơn giao dịch sách trong Chat (TASK-01, TASK-02, TASK-03).
 */
@Getter
@Setter
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "INVOICES")
public class Invoice implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "INVOICES_SEQ_GEN")
    @SequenceGenerator(name = "INVOICES_SEQ_GEN", sequenceName = "INVOICES_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "INVOICE_CODE", nullable = false, unique = true, length = 50)
    private String invoiceCode;

    @Column(name = "CONVERSATION_ID", nullable = false)
    private Long conversationId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "SELLER_ID", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "BUYER_ID", nullable = false)
    private User buyer;

    @Column(name = "TOTAL_AMOUNT", nullable = false, precision = 12, scale = 0)
    private BigDecimal totalAmount;

    @Column(name = "MEET_LOCATION", length = 200)
    private String meetLocation;

    @Column(name = "MEET_TIME", length = 200)
    private String meetTime;

    @Column(name = "NOTE", length = 1000)
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false, length = 30)
    private InvoiceStatus status;

    @Builder.Default
    @Column(name = "REMINDER_COUNT", nullable = false)
    private Integer reminderCount = 0;

    @Column(name = "LAST_REMINDER_AT")
    private LocalDateTime lastReminderAt;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @Column(name = "COMPLETED_AT")
    private LocalDateTime completedAt;

    @Builder.Default
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InvoiceItem> items = new ArrayList<>();
}

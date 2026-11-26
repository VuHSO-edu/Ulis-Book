package com.ulis.business.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * Yêu cầu / Góp ý ở cuối trang (Footer) lưu DB và gửi về mail NextBook (TASK-09).
 */
@Getter
@Setter
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "FEEDBACKS")
public class Feedback implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "FEEDBACKS_SEQ_GEN")
    @SequenceGenerator(name = "FEEDBACKS_SEQ_GEN", sequenceName = "FEEDBACKS_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "SENDER_NAME", nullable = false, length = 100)
    private String senderName;

    @Column(name = "SENDER_EMAIL", nullable = false, length = 255)
    private String senderEmail;

    @Column(name = "CATEGORY", length = 50)
    private String category;

    @Column(name = "CONTENT", nullable = false, length = 2000)
    private String content;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;
}

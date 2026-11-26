package com.ulis.business.entity;

import com.ulis.business.enums.UserRole;
import com.ulis.business.enums.UserStatus;
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
 * Người dùng ULIS Books. Audit fields inline (createdBy/createdAt/updatedBy/updatedAt)
 * — theo vuhso-java-backend-rules §5.1 (không dùng @Data trên entity).
 */
@Getter
@Setter
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "USERS")
public class User implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "USERS_SEQ_GEN")
    @SequenceGenerator(name = "USERS_SEQ_GEN", sequenceName = "USERS_SEQ", allocationSize = 1)
    @Column(name = "ID")
    private Long id;

    @Column(name = "EMAIL", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "FULL_NAME", nullable = false, length = 100)
    private String fullName;

    @Column(name = "PASSWORD_HASH", nullable = false, length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "ROLE", nullable = false, length = 20)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(name = "STATUS", nullable = false, length = 20)
    private UserStatus status;

    // --- Hồ sơ (ticket 03) — toàn bộ nullable, cập nhật qua PUT /profile/me ---
    @Column(name = "MSV", length = 50)
    private String msv;

    @Column(name = "FACULTY", length = 100)
    private String faculty;

    @Column(name = "MAJOR", length = 100)
    private String major;

    @Column(name = "CLASS_NAME", length = 50)
    private String className;

    @Column(name = "PHONE", length = 20)
    private String phone;

    @Column(name = "AVATAR_URL", length = 500)
    private String avatarUrl;

    /** Điểm uy tín V2.0 (TASK-02): mặc định 3, tối thiểu 1, tối đa 5. */
    @Builder.Default
    @Column(name = "REPUTATION_SCORE")
    private Integer reputationScore = 3;

    /** Hash của OTP hiện tại (BCrypt) — không lưu mã thô. */
    @Column(name = "OTP_HASH", length = 100)
    private String otpHash;

    @Column(name = "OTP_EXPIRY_AT")
    private LocalDateTime otpExpiryAt;

    @Column(name = "OTP_LAST_SENT_AT")
    private LocalDateTime otpLastSentAt;

    @Column(name = "OTP_RESEND_COUNT")
    private Integer otpResendCount;

    @Column(name = "OTP_FAILED_ATTEMPTS")
    private Integer otpFailedAttempts;

    @Column(name = "CREATED_AT")
    private LocalDateTime createdAt;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;

    @Column(name = "CREATED_BY", length = 50)
    private String createdBy;

    @Column(name = "UPDATED_BY", length = 50)
    private String updatedBy;
}

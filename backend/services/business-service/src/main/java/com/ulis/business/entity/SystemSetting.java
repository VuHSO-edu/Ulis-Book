package com.ulis.business.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * Cấu hình giao diện toàn hệ thống: Màu nền (TASK-04) & Loop Ảnh Banner (TASK-05).
 */
@Getter
@Setter
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "SYSTEM_SETTINGS")
public class SystemSetting implements Serializable {

    @Id
    @Column(name = "SETTING_KEY", length = 100)
    private String settingKey;

    @Column(name = "SETTING_VALUE", length = 4000)
    private String settingValue;

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;
}

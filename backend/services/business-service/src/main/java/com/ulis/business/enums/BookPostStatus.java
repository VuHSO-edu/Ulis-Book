package com.ulis.business.enums;

/**
 * Trạng thái bài đăng — khớp BookPostStatus bên FE (mock-data.ts).
 * HIDDEN = xoá mềm; EXPIRED = hết hạn; BANNED = vi phạm (admin).
 */
public enum BookPostStatus {
    SELLING,
    SOLD,
    HIDDEN,
    EXPIRED,
    BANNED
}

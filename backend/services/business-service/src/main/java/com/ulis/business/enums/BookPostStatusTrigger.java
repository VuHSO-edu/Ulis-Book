package com.ulis.business.enums;

/**
 * Tác nhân gây chuyển trạng thái bài đăng (ticket 05) — dùng cho state machine.
 * CREATE = tạo mới; UPDATE = cập nhật (số lượng thay đổi); MARK_SOLD = chủ đánh
 * dấu đã bán; DELETE = xoá mềm; EXPIRE = job hết hạn định kỳ; BAN = khoá (admin).
 */
public enum BookPostStatusTrigger {
    CREATE,
    UPDATE,
    MARK_SOLD,
    DELETE,
    EXPIRE,
    BAN
}

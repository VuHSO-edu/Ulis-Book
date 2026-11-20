package com.ulis.core.exception;

/**
 * Lỗi 403 — người dùng có phiên đăng nhập nhưng không có quyền với tài nguyên
 * (vd: sửa/xoá bài đăng của người khác) — theo vuhso-java-backend-rules §7.
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}

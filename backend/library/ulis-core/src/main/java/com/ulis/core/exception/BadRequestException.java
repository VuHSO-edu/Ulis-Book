package com.ulis.core.exception;

/**
 * Lỗi nghiệp vụ 400 — theo vuhso-java-backend-rules §7.
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}

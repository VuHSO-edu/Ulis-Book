package com.ulis.core.exception;

/**
 * Lỗi 404 — theo vuhso-java-backend-rules §7.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}

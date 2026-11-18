package com.ulis.core.exception;

/**
 * Lỗi 401 — theo vuhso-java-backend-rules §7.
 */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}

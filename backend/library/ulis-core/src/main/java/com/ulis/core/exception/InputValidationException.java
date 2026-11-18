package com.ulis.core.exception;

import lombok.Getter;

/**
 * Lỗi validation 400 kèm fieldName + errorMessage — theo vuhso-java-backend-rules §7.
 */
@Getter
public class InputValidationException extends RuntimeException {

    private final String fieldName;

    public InputValidationException(String fieldName, String errorMessage) {
        super(errorMessage);
        this.fieldName = fieldName;
    }
}

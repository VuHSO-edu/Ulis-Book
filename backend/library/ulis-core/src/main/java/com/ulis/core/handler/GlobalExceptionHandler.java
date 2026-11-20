package com.ulis.core.handler;

import com.ulis.core.exception.BadRequestException;
import com.ulis.core.exception.ForbiddenException;
import com.ulis.core.exception.InputValidationException;
import com.ulis.core.exception.NotFoundException;
import com.ulis.core.exception.UnauthorizedException;
import com.ulis.core.http.ResponseBuilder;
import jakarta.validation.ValidationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Một handler global duy nhất chuyển exception thành ApiResponse envelope —
 * theo vuhso-java-backend-rules §7. Service nào cần xử lý riêng thì stack
 * thêm @RestControllerAdvice có @Order(0), không thay thế handler này.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({MethodArgumentNotValidException.class})
    public ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, WebRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(fe -> fieldErrors.put(fe.getField(), fe.getDefaultMessage()));
        log.error("Validation failed on {}: {}", request.getDescription(false), fieldErrors, ex);
        return ResponseBuilder.error(HttpStatus.BAD_REQUEST.value(), "VALIDATION_FAILED", fieldErrors);
    }

    @ExceptionHandler({ValidationException.class, InputValidationException.class,
            IllegalArgumentException.class, BadRequestException.class})
    public ResponseEntity<Object> handleBadRequest(RuntimeException ex, WebRequest request) {
        log.warn("Bad request on {}: {}", request.getDescription(false), ex.getMessage());
        return ResponseBuilder.error(HttpStatus.BAD_REQUEST.value(), ex.getMessage(), null);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Object> handleUnauthorized(UnauthorizedException ex, WebRequest request) {
        log.warn("Unauthorized on {}: {}", request.getDescription(false), ex.getMessage());
        String message = ex.getMessage() != null && !ex.getMessage().isBlank()
                ? ex.getMessage() : "UNAUTHORIZED";
        return ResponseBuilder.error(HttpStatus.UNAUTHORIZED.value(), message, null);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Object> handleForbidden(ForbiddenException ex, WebRequest request) {
        log.warn("Forbidden on {}: {}", request.getDescription(false), ex.getMessage());
        return ResponseBuilder.error(HttpStatus.FORBIDDEN.value(), ex.getMessage(), null);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Object> handleNotFound(NotFoundException ex, WebRequest request) {
        log.warn("Not found on {}: {}", request.getDescription(false), ex.getMessage());
        return ResponseBuilder.error(HttpStatus.NOT_FOUND.value(), ex.getMessage(), null);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Object> handleNoResource(NoResourceFoundException ex, WebRequest request) {
        log.warn("No resource found on {}: {}", request.getDescription(false), ex.getResourcePath());
        return ResponseBuilder.error(HttpStatus.NOT_FOUND.value(), "NOT_FOUND", null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleException(Exception ex, WebRequest request) {
        log.error("Unexpected error on {}", request.getDescription(false), ex);
        return ResponseBuilder.error(HttpStatus.INTERNAL_SERVER_ERROR.value(), "INTERNAL_SERVER_ERROR", null);
    }
}

package com.ulis.core.http;

import com.ulis.core.model.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Static factories cho ApiResponse — theo vuhso-java-backend-rules §6.
 * Controllers không bao giờ trả raw DTO, luôn qua ResponseBuilder.
 */
public final class ResponseBuilder {

    private ResponseBuilder() {
    }

    public static ResponseEntity<Object> ok() {
        return build(HttpStatus.OK, "OK", null, null);
    }

    public static <T> ResponseEntity<Object> ok(T data) {
        return build(HttpStatus.OK, "OK", data, null);
    }

    public static <T> ResponseEntity<Object> ok(T data, String message) {
        return build(HttpStatus.OK, message, data, null);
    }

    public static ResponseEntity<Object> badRequest(String message) {
        return build(HttpStatus.BAD_REQUEST, message, null, null);
    }

    public static ResponseEntity<Object> notFound(String message) {
        return build(HttpStatus.NOT_FOUND, message, null, null);
    }

    public static ResponseEntity<Object> unauthorized(String message) {
        return build(HttpStatus.UNAUTHORIZED, message, null, null);
    }

    public static ResponseEntity<Object> error(Throwable ex) {
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR", null, ex.getMessage());
    }

    public static ResponseEntity<Object> error(int status, String message, Object error) {
        HttpStatus httpStatus = HttpStatus.resolve(status) != null ? HttpStatus.resolve(status) : HttpStatus.INTERNAL_SERVER_ERROR;
        return build(httpStatus, message, null, error);
    }

    private static ResponseEntity<Object> build(HttpStatus status, String message, Object data, Object error) {
        ApiResponse<Object> body = ApiResponse.builder()
                .status(status.value())
                .message(message)
                .path(currentPath())
                .data(data)
                .error(error)
                .build();
        return ResponseEntity.status(status).body(body);
    }

    private static String currentPath() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            return attrs.getRequest().getRequestURI();
        }
        return null;
    }
}

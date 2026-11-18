package com.ulis.core.helper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Dịch message từ MessageSource (messages.properties) — theo vuhso-java-backend-rules §7.1.
 * App ULIS Books mặc định tiếng Việt; không để Hardcode chuỗi ở service/controller.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MessageHelper {

    private static final Locale DEFAULT_LOCALE = Locale.forLanguageTag("vi");

    private final MessageSource messageSource;

    public String getMessage(String code, Object... args) {
        try {
            return messageSource.getMessage(code, args, DEFAULT_LOCALE);
        } catch (NoSuchMessageException e) {
            log.warn("Missing message key: {}", code);
            return code;
        }
    }
}

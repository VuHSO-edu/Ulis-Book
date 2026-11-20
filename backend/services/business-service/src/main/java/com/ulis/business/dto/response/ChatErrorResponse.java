package com.ulis.business.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lỗi đẩy về <code>/user/queue/chat.errors</code> khi gửi realtime thất bại
 * (ticket 09) — message là thông điệp thân thiện đã i18n từ MessageHelper.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatErrorResponse {

    private String message;
}

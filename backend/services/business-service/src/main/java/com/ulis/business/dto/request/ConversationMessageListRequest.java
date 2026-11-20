package com.ulis.business.dto.request;

import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lịch sử tin nhắn của một hội thoại — khớp payload useConversationMessages FE:
 * {pageNumber, pageSize}; pageNumber 1-based (FE mặc định 1 = block mới nhất).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationMessageListRequest {

    /** 1-based như FE (default 1 = block tin mới nhất). */
    private Integer pageNumber;

    @Positive(message = "{conversation.pageSize.invalid}")
    private Integer pageSize;
}

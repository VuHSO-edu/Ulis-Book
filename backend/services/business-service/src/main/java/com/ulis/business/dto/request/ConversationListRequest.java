package com.ulis.business.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Danh sách hội thoại của tôi — khớp payload useConversations FE:
 * {pageNumber, pageSize} với pageNumber 1-based (FE mặc định 1).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationListRequest {

    /** 1-based như FE (default 1 = trang đầu). */
    private Integer pageNumber;

    private Integer pageSize;
}

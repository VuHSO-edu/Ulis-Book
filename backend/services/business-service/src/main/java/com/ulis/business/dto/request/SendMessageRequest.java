package com.ulis.business.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Gửi tin nhắn — khớp payload useSendMessage FE: chỉ body {content}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendMessageRequest {

    @NotBlank(message = "{conversation.content.required}")
    @Size(max = 2000, message = "{conversation.content.length}")
    private String content;
}

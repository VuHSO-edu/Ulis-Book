package com.ulis.business.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Mở (hoặc reuse) hội thoại với một user, tuỳ chọn gắn bài đăng — cặp
 * {min,max(userId), postId-nullable} là unique nên mở lại sẽ trả hội thoại cũ.
 * FE chưa gọi endpoint này (hiện chỉ navigate /chat); Backend triển khai làm
 * nền cho realtime (ticket 09).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationOpenRequest {

    @NotNull(message = "{conversation.peer.required}")
    @Positive(message = "{conversation.peer.required}")
    private Long peerId;

    private Long postId;
}

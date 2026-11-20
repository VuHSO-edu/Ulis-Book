package com.ulis.business.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Tạo bình luận — chỉ gửi postId + content (khớp useCreateComment FE); tác giả
 * lấy từ JWT, các trường hiển thị (authorName/cohort/initials/isSeller) do
 * backend denormalize lúc tạo.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentCreateRequest {

    @NotNull(message = "{comment.postId.required}")
    private Long postId;

    @NotBlank(message = "{comment.content.required}")
    @Size(max = 1000, message = "{comment.content.length}")
    private String content;
}

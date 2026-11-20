package com.ulis.business.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Cập nhật nội dung bình luận — chỉ chính tác giả (khớp useUpdateComment FE:
 * chỉ body {content}).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentUpdateRequest {

    @NotBlank(message = "{comment.content.required}")
    @Size(max = 1000, message = "{comment.content.length}")
    private String content;
}

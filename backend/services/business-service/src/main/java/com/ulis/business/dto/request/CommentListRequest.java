package com.ulis.business.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lấy danh sách bình luận của một bài đăng (công khai) — khớp payload
 * useCommentsByPost bên FE: {postId, pageNumber, pageSize} với pageNumber 1-based
 * (FE mặc định 1, chỉ đọc data.content).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentListRequest {

    @NotNull(message = "{comment.postId.required}")
    private Long postId;

    /** 1-based như FE (default 1 = trang đầu tiên). */
    private Integer pageNumber;

    @Positive(message = "{comment.pageSize.invalid}")
    private Integer pageSize;
}

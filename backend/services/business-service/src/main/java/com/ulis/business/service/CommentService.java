package com.ulis.business.service;

import com.ulis.business.dto.request.CommentCreateRequest;
import com.ulis.business.dto.request.CommentListRequest;
import com.ulis.business.dto.request.CommentUpdateRequest;
import com.ulis.business.dto.response.CommentResponse;
import com.ulis.core.model.response.PageableResponse;

/**
 * Bình luận 1 cấp (ticket 07):
 * - danh sách công khai, mới nhất trước (khớp FE: newest first, chỉ đọc content);
 * - create/edit/delete chỉ tác giả (403 cho người khác);
 * - create có rate limit giãn cách giữa 2 bình luận của cùng user;
 * - adminDelete riêng cho admin (role kiểm tra ở controller).
 */
public interface CommentService {

    PageableResponse<CommentResponse> list(CommentListRequest request);

    CommentResponse create(Long userId, CommentCreateRequest request);

    CommentResponse update(Long userId, Long commentId, CommentUpdateRequest request);

    void delete(Long userId, Long commentId);

    void adminDelete(Long commentId);
}

package com.ulis.business.controller;

import com.ulis.business.dto.request.CommentCreateRequest;
import com.ulis.business.dto.request.CommentListRequest;
import com.ulis.business.dto.request.CommentUpdateRequest;
import com.ulis.business.enums.UserRole;
import com.ulis.business.security.SecurityUtils;
import com.ulis.business.service.CommentService;
import com.ulis.core.exception.ForbiddenException;
import com.ulis.core.helper.MessageHelper;
import com.ulis.core.http.ResponseBuilder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Bình luận 1 cấp (ticket 07):
 * - by-post: công khai (permitAll), mới nhất trước;
 * - create/update/delete: JWT, chỉ tác giả (403 cho người khác, ở service);
 * - admin/delete/{id}: chỉ ADMIN (role kiểm tra ở controller, UI ở ticket admin).
 */
@RestController
@RequestMapping("/comments")
@Tag(name = "CommentController", description = "Bình luận 1 cấp trên bài đăng")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final MessageHelper messageHelper;

    @PostMapping("/by-post")
    @Operation(summary = "Danh sách bình luận của bài đăng (công khai)")
    public ResponseEntity<Object> byPost(@Valid @RequestBody CommentListRequest request) {
        return ResponseBuilder.ok(commentService.list(request));
    }

    @PostMapping("/create")
    @Operation(summary = "Đăng bình luận (có rate limit)")
    public ResponseEntity<Object> create(@Valid @RequestBody CommentCreateRequest request) {
        return ResponseBuilder.ok(
                commentService.create(SecurityUtils.currentUser().getId(), request),
                messageHelper.getMessage("comment.created"));
    }

    @PutMapping("/update/{id}")
    @Operation(summary = "Cập nhật bình luận của chính mình")
    public ResponseEntity<Object> update(@PathVariable Long id,
                                         @Valid @RequestBody CommentUpdateRequest request) {
        return ResponseBuilder.ok(
                commentService.update(SecurityUtils.currentUser().getId(), id, request),
                messageHelper.getMessage("comment.updated"));
    }

    @DeleteMapping("/delete/{id}")
    @Operation(summary = "Xoá bình luận của chính mình")
    public ResponseEntity<Object> delete(@PathVariable Long id) {
        commentService.delete(SecurityUtils.currentUser().getId(), id);
        return ResponseBuilder.ok(null, messageHelper.getMessage("comment.deleted"));
    }

    @DeleteMapping("/admin/delete/{id}")
    @Operation(summary = "Xoá bình luận bất kỳ (chỉ ADMIN)")
    public ResponseEntity<Object> adminDelete(@PathVariable Long id) {
        if (SecurityUtils.currentUser().getRole() != UserRole.ADMIN) {
            throw new ForbiddenException(messageHelper.getMessage("comment.adminOnly"));
        }
        commentService.adminDelete(id);
        return ResponseBuilder.ok(null, messageHelper.getMessage("comment.adminDeleted"));
    }
}

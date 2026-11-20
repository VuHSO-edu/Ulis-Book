package com.ulis.business.controller;

import com.ulis.business.dto.request.BookCreateRequest;
import com.ulis.business.dto.request.BookSearchRequest;
import com.ulis.business.dto.request.BookUpdateRequest;
import com.ulis.business.security.SecurityUtils;
import com.ulis.business.service.BookPostService;
import com.ulis.core.helper.MessageHelper;
import com.ulis.core.http.ResponseBuilder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Bài đăng sách (ticket 04) — create/update/sold/delete/my yêu cầu JWT (và chỉ
 * chủ bài mới update/sold/delete); detail/search/categories công khai.
 */
@RestController
@RequestMapping("/book-posts")
@Tag(name = "BookPostController", description = "Bài đăng bán/tặng sách")
@RequiredArgsConstructor
public class BookPostController {

    private final BookPostService bookPostService;
    private final MessageHelper messageHelper;

    @PostMapping("/create")
    @Operation(summary = "Tạo bài đăng")
    public ResponseEntity<Object> create(@Valid @RequestBody BookCreateRequest request) {
        return ResponseBuilder.ok(
                bookPostService.create(SecurityUtils.currentUser().getId(), request),
                messageHelper.getMessage("bookPost.created"));
    }

    @PutMapping("/update/{id}")
    @Operation(summary = "Cập nhật bài đăng của chính mình")
    public ResponseEntity<Object> update(@PathVariable Long id,
                                         @Valid @RequestBody BookUpdateRequest request) {
        return ResponseBuilder.ok(
                bookPostService.update(SecurityUtils.currentUser().getId(), id, request),
                messageHelper.getMessage("bookPost.updated"));
    }

    @PostMapping("/sold/{id}")
    @Operation(summary = "Đánh dấu đã bán (chủ bài)")
    public ResponseEntity<Object> markSold(@PathVariable Long id) {
        return ResponseBuilder.ok(
                bookPostService.markSold(SecurityUtils.currentUser().getId(), id),
                messageHelper.getMessage("bookPost.sold"));
    }

    @DeleteMapping("/delete/{id}")
    @Operation(summary = "Xoá mềm bài đăng (chủ bài)")
    public ResponseEntity<Object> delete(@PathVariable Long id) {
        bookPostService.delete(SecurityUtils.currentUser().getId(), id);
        return ResponseBuilder.ok(null, messageHelper.getMessage("bookPost.deleted"));
    }

    @GetMapping("/my")
    @Operation(summary = "Danh sách bài đăng của tôi")
    public ResponseEntity<Object> myPosts() {
        return ResponseBuilder.ok(bookPostService.myPosts(SecurityUtils.currentUser().getId()));
    }

    @GetMapping("/detail/{id}")
    @Operation(summary = "Chi tiết bài đăng (công khai; tăng viewCount)")
    public ResponseEntity<Object> detail(@PathVariable Long id) {
        return ResponseBuilder.ok(bookPostService.detail(id));
    }

    @PostMapping("/search")
    @Operation(summary = "Tìm kiếm + lọc bài đăng (công khai)")
    public ResponseEntity<Object> search(@RequestBody(required = false) BookSearchRequest request) {
        return ResponseBuilder.ok(bookPostService.search(request));
    }
}

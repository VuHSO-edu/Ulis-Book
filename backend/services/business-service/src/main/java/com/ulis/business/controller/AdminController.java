package com.ulis.business.controller;

import com.ulis.business.entity.BookCategory;
import com.ulis.business.entity.BookPost;
import com.ulis.business.entity.Report;
import com.ulis.business.entity.User;
import com.ulis.business.enums.BookCategoryAxis;
import com.ulis.business.enums.BookCategoryStatus;
import com.ulis.business.enums.BookPostStatus;
import com.ulis.business.enums.ReportSourceType;
import com.ulis.business.enums.ReportStatus;
import com.ulis.business.enums.UserRole;
import com.ulis.business.enums.UserStatus;
import com.ulis.business.repository.BookCategoryRepository;
import com.ulis.business.repository.BookPostRepository;
import com.ulis.business.repository.CommentRepository;
import com.ulis.business.repository.ReportRepository;
import com.ulis.business.repository.UserRepository;
import com.ulis.business.security.SecurityUtils;
import com.ulis.business.service.ReportService;
import com.ulis.core.exception.BadRequestException;
import com.ulis.core.exception.ForbiddenException;
import com.ulis.core.exception.NotFoundException;
import com.ulis.core.helper.MessageHelper;
import com.ulis.core.http.ResponseBuilder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Admin tối thiểu (ticket 12):
 * - Tất cả endpoint dưới /admin/* đều kiểm tra role ADMIN (403 nếu không phải ADMIN).
 */
@RestController
@RequestMapping("/admin")
@Tag(name = "AdminController", description = "Quản trị hệ thống (chỉ ADMIN)")
@RequiredArgsConstructor
public class AdminController {

    private final ReportService reportService;
    private final ReportRepository reportRepository;
    private final BookPostRepository bookPostRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final BookCategoryRepository bookCategoryRepository;
    private final MessageHelper messageHelper;

    private void requireAdmin() {
        if (SecurityUtils.currentUser().getRole() != UserRole.ADMIN) {
            throw new ForbiddenException(messageHelper.getMessage("auth.forbidden"));
        }
    }

    @Data
    public static class SearchPageRequest {
        private int pageNumber = 1;
        private int pageSize = 50;
    }

    @Data
    public static class ResolveReportRequest {
        private ReportStatus status;
    }

    @Data
    public static class UpsertCategoryRequest {
        @NotBlank(message = "{validation.required}")
        private String code;
        @NotBlank(message = "{validation.required}")
        private String name;
        private String subtitle;
        private String parentAxis;
        private Integer sortOrder;
        private String status;
    }

    // ---------------- Reports ----------------

    @PostMapping("/reports/search")
    @Operation(summary = "Danh sách báo cáo vi phạm")
    public ResponseEntity<Object> searchReports(@RequestBody(required = false) SearchPageRequest req) {
        requireAdmin();
        int page = req != null && req.getPageNumber() > 0 ? req.getPageNumber() - 1 : 0;
        int size = req != null && req.getPageSize() > 0 ? req.getPageSize() : 50;
        return ResponseBuilder.ok(reportService.listForAdmin(null, PageRequest.of(page, size)));
    }

    @PutMapping("/reports/{id}/resolve")
    @Transactional
    @Operation(summary = "Xử lý báo cáo vi phạm (RESOLVED sẽ khoá đối tượng)")
    public ResponseEntity<Object> resolveReport(
            @PathVariable Long id,
            @RequestBody ResolveReportRequest req) {
        requireAdmin();
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("report.target.not.found")));
        ReportStatus nextStatus = req != null && req.getStatus() != null ? req.getStatus() : ReportStatus.RESOLVED;
        report.setStatus(nextStatus);
        reportRepository.save(report);

        if (nextStatus == ReportStatus.RESOLVED) {
            if (report.getSourceType() == ReportSourceType.POST) {
                bookPostRepository.findById(report.getTargetId()).ifPresent(post -> {
                    post.setStatus(BookPostStatus.BANNED);
                    bookPostRepository.save(post);
                });
            } else if (report.getSourceType() == ReportSourceType.USER) {
                userRepository.findById(report.getTargetId()).ifPresent(user -> {
                    user.setStatus(UserStatus.BANNED);
                    userRepository.save(user);
                });
            } else if (report.getSourceType() == ReportSourceType.COMMENT) {
                commentRepository.deleteById(report.getTargetId());
            }
        }
        return ResponseBuilder.ok(Map.of("id", id, "status", nextStatus));
    }

    // ---------------- Book Posts ----------------

    @PostMapping("/book-posts/search")
    @Operation(summary = "Danh sách bài đăng cho admin")
    public ResponseEntity<Object> searchBookPosts(@RequestBody(required = false) SearchPageRequest req) {
        requireAdmin();
        int page = req != null && req.getPageNumber() > 0 ? req.getPageNumber() - 1 : 0;
        int size = req != null && req.getPageSize() > 0 ? req.getPageSize() : 50;
        return ResponseBuilder.ok(bookPostRepository.findAll(PageRequest.of(page, size)));
    }

    @PutMapping("/book-posts/{id}/ban")
    @Transactional
    @Operation(summary = "Khoá / mở khoá bài đăng")
    public ResponseEntity<Object> toggleBanPost(@PathVariable Long id) {
        requireAdmin();
        BookPost post = bookPostRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("book.post.not.found")));
        BookPostStatus next = post.getStatus() == BookPostStatus.BANNED
                ? BookPostStatus.SELLING
                : BookPostStatus.BANNED;
        post.setStatus(next);
        bookPostRepository.save(post);
        return ResponseBuilder.ok(Map.of("id", id, "status", next));
    }

    // ---------------- Users ----------------

    @PostMapping("/users/search")
    @Operation(summary = "Danh sách người dùng cho admin")
    public ResponseEntity<Object> searchUsers(@RequestBody(required = false) SearchPageRequest req) {
        requireAdmin();
        int page = req != null && req.getPageNumber() > 0 ? req.getPageNumber() - 1 : 0;
        int size = req != null && req.getPageSize() > 0 ? req.getPageSize() : 50;
        return ResponseBuilder.ok(userRepository.findAll(PageRequest.of(page, size)));
    }

    @PutMapping("/users/{id}/ban")
    @Transactional
    @Operation(summary = "Khoá / mở khoá tài khoản")
    public ResponseEntity<Object> toggleBanUser(@PathVariable Long id) {
        requireAdmin();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("user.not.found")));
        UserStatus next = user.getStatus() == UserStatus.BANNED
                ? UserStatus.ACTIVE
                : UserStatus.BANNED;
        user.setStatus(next);
        userRepository.save(user);
        return ResponseBuilder.ok(Map.of("id", id, "status", next));
    }

    // ---------------- Book Categories ----------------

    @GetMapping("/book-categories")
    @Operation(summary = "Danh sách danh mục sách")
    public ResponseEntity<Object> listCategories() {
        requireAdmin();
        return ResponseBuilder.ok(bookCategoryRepository.findAll());
    }

    @PostMapping("/book-categories/create")
    @Transactional
    @Operation(summary = "Tạo danh mục sách")
    public ResponseEntity<Object> createCategory(@Valid @RequestBody UpsertCategoryRequest req) {
        requireAdmin();
        String cleanCode = req.getCode().trim().toUpperCase();
        if (bookCategoryRepository.findByCodeIgnoreCase(cleanCode).isPresent()) {
            throw new BadRequestException(messageHelper.getMessage("book.category.duplicate"));
        }
        BookCategory category = new BookCategory();
        category.setCode(cleanCode);
        category.setName(req.getName().trim());
        category.setSubtitle(req.getSubtitle() != null ? req.getSubtitle().trim() : "");
        category.setParentAxis(
                "BOOK_TYPE".equalsIgnoreCase(req.getParentAxis())
                        ? BookCategoryAxis.BOOK_TYPE
                        : BookCategoryAxis.FACULTY);
        category.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 1);
        category.setStatus(
                "INACTIVE".equalsIgnoreCase(req.getStatus())
                        ? BookCategoryStatus.INACTIVE
                        : BookCategoryStatus.ACTIVE);
        category.setUpdatedAt(java.time.LocalDateTime.now());
        return ResponseBuilder.ok(bookCategoryRepository.save(category));
    }

    @PutMapping("/book-categories/update/{id}")
    @Transactional
    @Operation(summary = "Cập nhật danh mục sách")
    public ResponseEntity<Object> updateCategory(
            @PathVariable Long id,
            @RequestBody UpsertCategoryRequest req) {
        requireAdmin();
        BookCategory category = bookCategoryRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("book.category.not.found")));
        if (req.getName() != null) {
            category.setName(req.getName().trim());
        }
        if (req.getSubtitle() != null) {
            category.setSubtitle(req.getSubtitle().trim());
        }
        if (req.getParentAxis() != null) {
            category.setParentAxis(
                    "BOOK_TYPE".equalsIgnoreCase(req.getParentAxis())
                            ? BookCategoryAxis.BOOK_TYPE
                            : BookCategoryAxis.FACULTY);
        }
        if (req.getSortOrder() != null) {
            category.setSortOrder(req.getSortOrder());
        }
        if (req.getStatus() != null) {
            category.setStatus(
                    "INACTIVE".equalsIgnoreCase(req.getStatus())
                            ? BookCategoryStatus.INACTIVE
                            : BookCategoryStatus.ACTIVE);
        }
        category.setUpdatedAt(java.time.LocalDateTime.now());
        return ResponseBuilder.ok(bookCategoryRepository.save(category));
    }

    @DeleteMapping("/book-categories/delete/{id}")
    @Transactional
    @Operation(summary = "Xoá danh mục sách")
    public ResponseEntity<Object> deleteCategory(@PathVariable Long id) {
        requireAdmin();
        bookCategoryRepository.deleteById(id);
        return ResponseBuilder.ok(Map.of("id", id));
    }
}

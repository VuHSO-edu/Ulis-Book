package com.ulis.business.controller;

import com.ulis.business.dto.request.ReportCreateRequest;
import com.ulis.business.enums.ReportStatus;
import com.ulis.business.enums.UserRole;
import com.ulis.business.security.SecurityUtils;
import com.ulis.business.service.ReportService;
import com.ulis.core.exception.ForbiddenException;
import com.ulis.core.helper.MessageHelper;
import com.ulis.core.http.ResponseBuilder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Báo cáo vi phạm từ người dùng (ticket 11):
 * - create: người dùng đã đăng nhập báo cáo bài đăng / người dùng / bình luận;
 * - admin/list: danh sách báo cáo cho quản trị viên.
 */
@RestController
@RequestMapping("/reports")
@Tag(name = "ReportController", description = "Báo cáo vi phạm")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final MessageHelper messageHelper;

    @PostMapping("/create")
    @Operation(summary = "Gửi báo cáo vi phạm")
    public ResponseEntity<Object> create(@Valid @RequestBody ReportCreateRequest request) {
        return ResponseBuilder.ok(
                reportService.create(SecurityUtils.currentUser().getId(), request),
                messageHelper.getMessage("report.created"));
    }

    @GetMapping("/admin/list")
    @Operation(summary = "Danh sách báo cáo vi phạm (chỉ ADMIN)")
    public ResponseEntity<Object> listForAdmin(
            @RequestParam(required = false) ReportStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (SecurityUtils.currentUser().getRole() != UserRole.ADMIN) {
            throw new ForbiddenException(messageHelper.getMessage("auth.forbidden"));
        }
        return ResponseBuilder.ok(reportService.listForAdmin(status, PageRequest.of(page, size)));
    }
}

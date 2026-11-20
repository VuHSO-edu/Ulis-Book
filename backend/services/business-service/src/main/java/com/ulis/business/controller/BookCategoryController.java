package com.ulis.business.controller;

import com.ulis.business.service.BookCategoryService;
import com.ulis.core.http.ResponseBuilder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Danh mục sách (ticket 04) — công khai, FE đọc khi lọc/đăng tin.
 */
@RestController
@RequestMapping("/book-categories")
@Tag(name = "BookCategoryController", description = "Danh mục phân loại sách (công khai)")
@RequiredArgsConstructor
public class BookCategoryController {

    private final BookCategoryService categoryService;

    @GetMapping
    @Operation(summary = "Danh sách danh mục đang hoạt động")
    public ResponseEntity<Object> list() {
        return ResponseBuilder.ok(categoryService.listActive());
    }
}

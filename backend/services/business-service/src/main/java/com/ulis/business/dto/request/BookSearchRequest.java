package com.ulis.business.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Bộ lọc tìm kiếm bài đăng — khớp BookSearchFilter bên FE (books.ts).
 * Số trang mặc định 0-based, 20 tin/trang; FE đọc data.content + data.totalElements.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookSearchRequest {

    private String keyword;

    private String facultyCode;

    private String bookTypeCode;

    private Boolean onlyGiveaway;

    private BigDecimal minPrice;

    private BigDecimal maxPrice;

    private String campusLocation;

    /** newest | cheapest | mostViewed — mặc định newest. */
    private String sortBy;

    private Integer pageNumber;

    private Integer pageSize;
}

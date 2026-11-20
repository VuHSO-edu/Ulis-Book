package com.ulis.business.dto.response;

import com.ulis.business.constants.BookPostConstants;
import com.ulis.business.entity.BookCategory;
import com.ulis.business.enums.BookCategoryAxis;
import com.ulis.business.enums.BookCategoryStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Danh mục — khớp BookCategoryItem bên FE (mock-data.ts). bookCount là số bài
 * còn hiển thị (SELLING/SOLD) gắn với danh mục, tính tại thời điểm đọc.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryItem {

    private Long id;

    private String code;

    private String name;

    private String subtitle;

    private BookCategoryAxis parentAxis;

    private long bookCount;

    private Integer sortOrder;

    private BookCategoryStatus status;

    private String updatedAt;

    public static CategoryItem from(BookCategory category, long bookCount) {
        return CategoryItem.builder()
                .id(category.getId())
                .code(category.getCode())
                .name(category.getName())
                .subtitle(category.getSubtitle())
                .parentAxis(category.getParentAxis())
                .bookCount(bookCount)
                .sortOrder(category.getSortOrder())
                .status(category.getStatus())
                .updatedAt(category.getUpdatedAt() == null ? null
                        : category.getUpdatedAt().format(BookPostConstants.DATE_FORMATTER))
                .build();
    }
}

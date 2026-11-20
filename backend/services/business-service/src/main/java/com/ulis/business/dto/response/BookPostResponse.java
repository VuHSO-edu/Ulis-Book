package com.ulis.business.dto.response;

import com.ulis.business.constants.BookPostConstants;
import com.ulis.business.entity.BookPost;
import com.ulis.business.entity.BookPostImage;
import com.ulis.business.enums.BookPostStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

/**
 * Bài đăng trả về — khớp BookPostItem bên FE (mock-data.ts). createdAt/expiredAt
 * là chuỗi DD/MM/YYYY (FE render thô); seller nhúng theo SellerInfo.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookPostResponse {

    private Long id;

    private String code;

    private String title;

    private String courseCode;

    private String bookTypeCode;

    private String bookTypeName;

    private String facultyCode;

    private String facultyName;

    private Boolean isGiveaway;

    private BigDecimal price;

    private BigDecimal originalPrice;

    private Integer quantity;

    private String condition;

    private String conditionBadge;

    private String campusLocation;

    private String description;

    private String coverUrl;

    private List<String> images;

    private BookPostStatus status;

    private Integer viewCount;

    private String createdAt;

    private String expiredAt;

    private SellerInfo seller;

    public static BookPostResponse from(BookPost post) {
        List<String> imageUrls = post.getImages().stream()
                .sorted(Comparator.comparing(BookPostImage::getSortOrder))
                .map(BookPostImage::getUrl)
                .toList();

        String cover = post.getCoverUrl();
        if ((cover == null || cover.isBlank()) && !imageUrls.isEmpty()) {
            cover = imageUrls.get(0);
        }

        return BookPostResponse.builder()
                .id(post.getId())
                .code(post.getCode())
                .title(post.getTitle())
                .courseCode(post.getCourseCode())
                .bookTypeCode(post.getBookTypeCode())
                .bookTypeName(post.getBookTypeName())
                .facultyCode(post.getFacultyCode())
                .facultyName(post.getFacultyName())
                .isGiveaway(post.getIsGiveaway())
                .price(post.getPrice())
                .originalPrice(post.getOriginalPrice())
                .quantity(post.getQuantity())
                .condition(post.getCondition())
                .conditionBadge(post.getConditionBadge())
                .campusLocation(post.getCampusLocation())
                .description(post.getDescription())
                .coverUrl(cover)
                .images(imageUrls)
                .status(post.getStatus())
                .viewCount(post.getViewCount())
                .createdAt(post.getCreatedAt() == null ? null
                        : post.getCreatedAt().format(BookPostConstants.DATE_FORMATTER))
                .expiredAt(post.getExpiredAt() == null ? null
                        : post.getExpiredAt().format(BookPostConstants.DATE_FORMATTER))
                .seller(SellerInfo.from(post.getOwner(), post.getCreatedAt()))
                .build();
    }
}

package com.ulis.business.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Request cập nhật bài đăng — cùng field với create; id lấy từ path.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookUpdateRequest implements BookPostUpsertFields {

    @Size(max = 50, message = "{bookPost.code.length}")
    private String code;

    @NotBlank(message = "{bookPost.title.required}")
    @Size(max = 255, message = "{bookPost.title.length}")
    private String title;

    @NotBlank(message = "{bookPost.courseCode.required}")
    @Size(max = 50, message = "{bookPost.courseCode.length}")
    private String courseCode;

    @NotBlank(message = "{bookPost.bookTypeCode.required}")
    private String bookTypeCode;

    @NotBlank(message = "{bookPost.facultyCode.required}")
    private String facultyCode;

    private Boolean isGiveaway;

    @DecimalMin(value = "0", message = "{bookPost.price.negative}")
    private BigDecimal price;

    @DecimalMin(value = "0", message = "{bookPost.price.negative}")
    private BigDecimal originalPrice;

    @NotNull(message = "{bookPost.quantity.required}")
    private Integer quantity;

    @NotBlank(message = "{bookPost.condition.required}")
    @Size(max = 500, message = "{bookPost.condition.length}")
    private String condition;

    @NotBlank(message = "{bookPost.campusLocation.required}")
    @Size(max = 100, message = "{bookPost.campusLocation.length}")
    private String campusLocation;

    @NotBlank(message = "{bookPost.description.required}")
    @Size(max = 4000, message = "{bookPost.description.length}")
    private String description;

    @Size(max = 500, message = "{bookPost.coverUrl.length}")
    private String coverUrl;

    private List<@Size(max = 500, message = "{bookPost.imageUrl.length}") String> images;
}

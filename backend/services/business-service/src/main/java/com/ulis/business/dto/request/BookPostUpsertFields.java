package com.ulis.business.dto.request;

import java.math.BigDecimal;
import java.util.List;

/**
 * Các field chung của request create/update bài đăng — cho phép service dùng
 * chung một luồng xử lý, theo vuhso-java-backend-rules (tránh trùng lặp).
 */
public interface BookPostUpsertFields {

    String getCode();

    String getTitle();

    String getCourseCode();

    String getBookTypeCode();

    String getFacultyCode();

    Boolean getIsGiveaway();

    BigDecimal getPrice();

    BigDecimal getOriginalPrice();

    Integer getQuantity();

    String getCondition();

    String getCampusLocation();

    String getDescription();

    String getCoverUrl();

    List<String> getImages();
}

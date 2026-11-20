package com.ulis.business.service;

import com.ulis.business.dto.response.CategoryItem;
import com.ulis.business.entity.BookCategory;

import java.util.List;

/**
 * Danh mục sách (ticket 04) — FE đọc qua GET /book-categories; service cũng
 * xác thực mã danh mục khi tạo/cập nhật bài đăng.
 */
public interface BookCategoryService {

    List<CategoryItem> listActive();

    /**
     * Lấy danh mục theo mã đang ACTIVE; ném BadRequest nếu mã không tồn tại
     * hoặc không hoạt động (FE chọn từ dropdown có sẵn nên chỉ xảy ra khi sai data).
     */
    BookCategory requireActiveCategory(String code);
}

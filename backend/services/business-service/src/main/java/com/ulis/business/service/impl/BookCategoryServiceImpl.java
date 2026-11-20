package com.ulis.business.service.impl;

import com.ulis.business.constants.BookPostConstants;
import com.ulis.business.dto.response.CategoryItem;
import com.ulis.business.entity.BookCategory;
import com.ulis.business.enums.BookCategoryAxis;
import com.ulis.business.enums.BookCategoryStatus;
import com.ulis.business.enums.BookPostStatus;
import com.ulis.business.repository.BookCategoryRepository;
import com.ulis.business.repository.BookPostRepository;
import com.ulis.business.service.BookCategoryService;
import com.ulis.core.exception.BadRequestException;
import com.ulis.core.helper.MessageHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

/**
 * BookCategoryServiceImpl — danh sách danh mục active cho FE; bookCount được
 * tính động từ số bài đăng còn hiển thị ở chợ (chỉ SELLING — ticket 06).
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class BookCategoryServiceImpl implements BookCategoryService {

    private final BookCategoryRepository categoryRepository;
    private final BookPostRepository postRepository;
    private final MessageHelper messageHelper;

    @Override
    @Transactional(readOnly = true)
    public List<CategoryItem> listActive() {
        List<BookCategory> active = categoryRepository.findByStatusOrderBySortOrderAsc(BookCategoryStatus.ACTIVE);
        // Nhóm ổn định: FACULTY trước BOOK_TYPE (khớp thứ tự seed FE), trong trục theo sortOrder.
        active.sort(Comparator
                .comparingInt((BookCategory c) -> c.getParentAxis() == BookCategoryAxis.FACULTY ? 0 : 1)
                .thenComparing(BookCategory::getSortOrder));
        return active.stream()
                .map(c -> CategoryItem.from(c, countVisibleFor(c)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BookCategory requireActiveCategory(String code) {
        return categoryRepository.findByCodeIgnoreCaseAndStatus(code, BookCategoryStatus.ACTIVE)
                .orElseThrow(() -> new BadRequestException(
                        messageHelper.getMessage("bookPost.category.invalid", code)));
    }

    private long countVisibleFor(BookCategory category) {
        List<BookPostStatus> statuses = Arrays.asList(BookPostConstants.PUBLIC_STATUSES);
        return category.getParentAxis() == BookCategoryAxis.FACULTY
                ? postRepository.countByFacultyCodeAndStatusIn(category.getCode(), statuses)
                : postRepository.countByBookTypeCodeAndStatusIn(category.getCode(), statuses);
    }
}

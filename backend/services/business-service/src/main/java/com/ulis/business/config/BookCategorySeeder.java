package com.ulis.business.config;

import com.ulis.business.entity.BookCategory;
import com.ulis.business.enums.BookCategoryAxis;
import com.ulis.business.enums.BookCategoryStatus;
import com.ulis.business.repository.BookCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Seed 10 danh mục mặc định khi bảng BOOK_CATEGORIES rỗng (dev/test/prod đều
 * dùng chung). Danh sách khớp INITIAL_CATEGORIES bên FE (mock-data.ts).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BookCategorySeeder implements ApplicationRunner {

    private final BookCategoryRepository categoryRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<BookCategory> defaults = List.of(
                bookCategory("ENG_FACULTY", "Khoa Sư phạm Tiếng Anh",
                        "Faculty of English Language Teacher Education (FELTE)", BookCategoryAxis.FACULTY, 1),
                bookCategory("CHN_FACULTY", "Khoa NN & VH Trung Quốc",
                        "Faculty of Chinese Language and Culture", BookCategoryAxis.FACULTY, 2),
                bookCategory("JPN_FACULTY", "Khoa NN & VH Nhật Bản",
                        "Faculty of Japanese Language and Culture", BookCategoryAxis.FACULTY, 3),
                bookCategory("KOR_FACULTY", "Khoa NN & VH Hàn Quốc",
                        "Faculty of Korean Language and Culture", BookCategoryAxis.FACULTY, 4),
                bookCategory("FRA_FACULTY", "Khoa NN & VH Pháp",
                        "Faculty of French Language and Culture", BookCategoryAxis.FACULTY, 5),
                bookCategory("GER_FACULTY", "Khoa NN & VH Đức",
                        "Faculty of German Language and Culture", BookCategoryAxis.FACULTY, 6),
                bookCategory("TYPE_GIAOTRINH", "Giáo trình bắt buộc",
                        "Core Mandatory University Textbooks", BookCategoryAxis.BOOK_TYPE, 1),
                bookCategory("TYPE_BAITAP", "Sách bài tập & Ngữ pháp",
                        "Workbooks & Grammar Practice", BookCategoryAxis.BOOK_TYPE, 2),
                bookCategory("TYPE_LUYENTHI", "Tài liệu ôn thi chứng chỉ",
                        "IELTS, HSK, JLPT, TOPIK, DELF Exam Prep", BookCategoryAxis.BOOK_TYPE, 3),
                bookCategory("TYPE_TUDIEN", "Từ điển & Sách tham khảo",
                        "Dictionaries & Reference Materials", BookCategoryAxis.BOOK_TYPE, 4),
                bookCategory("LOC_A1", "Sảnh A1 ULIS",
                        "Ghế đá trước sảnh nhà điều hành A1", BookCategoryAxis.CAMPUS_LOCATION, 1),
                bookCategory("LOC_C1", "Sân C1",
                        "Khu vực sân giữa nhà C1", BookCategoryAxis.CAMPUS_LOCATION, 2),
                bookCategory("LOC_THUVIEN", "Thư viện ULIS",
                        "Sảnh tầng 1 Thư viện ĐHNN", BookCategoryAxis.CAMPUS_LOCATION, 3),
                bookCategory("LOC_B2", "Toà B2",
                        "Ghế đá hành lang khu giảng đường B2", BookCategoryAxis.CAMPUS_LOCATION, 4),
                bookCategory("LOC_SUNWAH", "Toà Sunwah",
                        "Sảnh tầng 1 Toà nhà Sunwah", BookCategoryAxis.CAMPUS_LOCATION, 5),
                bookCategory("LOC_PHAP_A3", "Toà Pháp A3",
                        "Khuôn viên Khoa Pháp A3", BookCategoryAxis.CAMPUS_LOCATION, 6),
                bookCategory("LOC_CONGCHINH", "Cổng chính Phạm Văn Đồng",
                        "Khu vực cổng chính đường Phạm Văn Đồng", BookCategoryAxis.CAMPUS_LOCATION, 7));

        List<BookCategory> missing = defaults.stream()
                .filter(c -> categoryRepository.findByCodeIgnoreCase(c.getCode()).isEmpty())
                .toList();
        if (!missing.isEmpty()) {
            categoryRepository.saveAll(missing);
            log.info("Seeded {} missing book categories", missing.size());
        }
    }

    private BookCategory bookCategory(String code, String name, String subtitle,
                                      BookCategoryAxis axis, int sortOrder) {
        return BookCategory.builder()
                .code(code)
                .name(name)
                .subtitle(subtitle)
                .parentAxis(axis)
                .sortOrder(sortOrder)
                .status(BookCategoryStatus.ACTIVE)
                .updatedAt(LocalDateTime.now())
                .build();
    }
}

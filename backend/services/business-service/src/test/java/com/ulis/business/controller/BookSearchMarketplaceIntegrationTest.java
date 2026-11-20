package com.ulis.business.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ulis.business.entity.BookPost;
import com.ulis.business.job.BookPostExpiryJob;
import com.ulis.business.repository.BookPostRepository;
import com.ulis.business.repository.UserRepository;
import com.ulis.business.service.impl.DevOtpSender;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test chợ sách (ticket 06) tại seam API:
 * - Search chỉ trả SELLING (SOLD/HIDDEN/EXPIRED bị loại); khách xem công khai
 *   không cần đăng nhập; filter giá/tặng/địa điểm/loại; sort newest/cheapest/
 *   mostViewed; phân trang.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class BookSearchMarketplaceIntegrationTest {

    private static final String PASSWORD = "Matkhau@123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookPostRepository bookPostRepository;

    @Autowired
    private DevOtpSender devOtpSender;

    @Autowired
    private BookPostExpiryJob expiryJob;

    @BeforeEach
    void setUp() {
        devOtpSender.reset();
        bookPostRepository.deleteAll(); // xoá trước (images cascade; không đứt FK user)
        userRepository.deleteAll();
    }

    @AfterAll
    void tearDown() {
        bookPostRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ------------------------------------------------------------------ helpers

    private ResultActions postJson(String url, Object body) throws Exception {
        return mockMvc.perform(post(url)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body == null ? "" : objectMapper.writeValueAsString(body)));
    }

    private ResultActions authed(String httpMethod, String url, String token, Object body) throws Exception {
        var builder = switch (httpMethod) {
            case "POST" -> post(url);
            case "DELETE" -> org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete(url);
            default -> get(url);
        };
        var request = builder.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        if (body != null) {
            request = request.contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(body));
        }
        return mockMvc.perform(request);
    }

    private String registerAndLogin(String email) throws Exception {
        String name = titleCase(email.split("@")[0].replace(".", " ").trim());
        postJson("/auth/register", Map.of("email", email, "password", PASSWORD, "fullName", name))
                .andExpect(status().isOk());
        String otp = devOtpSender.lastSent(email);
        postJson("/auth/otp/verify", Map.of("email", email, "otpCode", otp))
                .andExpect(status().isOk());
        MvcResult login = postJson("/auth/login", Map.of("email", email, "password", PASSWORD))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(login.getResponse().getContentAsString())
                .path("data").path("accessToken").asText();
    }

    private String titleCase(String raw) {
        String[] words = raw.split(" ");
        StringBuilder sb = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                sb.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1)).append(' ');
            }
        }
        return sb.toString().trim();
    }

    /** Body linh hoạt: code/title/price/giveaway/campus/bookType/faculty/qty. */
    private Map<String, Object> bookBody(BookSpec spec) {
        String image = "https://img.ulis.local/" + spec.code().toLowerCase() + "-1.jpg";
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", spec.code());
        body.put("title", spec.title());
        body.put("courseCode", "ENG" + spec.courseSeq());
        body.put("bookTypeCode", spec.bookTypeCode());
        body.put("facultyCode", spec.facultyCode());
        body.put("isGiveaway", spec.giveaway());
        body.put("price", spec.price());
        body.put("originalPrice", BigDecimal.valueOf(120000));
        body.put("quantity", 1);
        body.put("condition", "Mới 90% - Bìa tốt");
        body.put("campusLocation", spec.campusLocation());
        body.put("description", "Mô tả bài " + spec.code());
        body.put("images", List.of(image));
        body.put("coverUrl", image);
        return body;
    }

    private long createPost(String token, BookSpec spec) throws Exception {
        MvcResult result = authed("POST", "/book-posts/create", token, bookBody(spec))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asLong();
    }

    private void setExpiredAtPast(long id) {
        BookPost post = bookPostRepository.findById(id).orElseThrow();
        post.setExpiredAt(LocalDateTime.now().minusDays(1));
        bookPostRepository.saveAndFlush(post);
    }

    /** Cấu trúc input tạo bài đăng trong test này. */
    private record BookSpec(String code, String title, String facultyCode, String bookTypeCode,
                            boolean giveaway, BigDecimal price, String campusLocation, String courseSeq) {
    }

    private static BookSpec spec(String code, String title, String faculty, String type,
                                 boolean giveaway, String price, String campus, String courseSeq) {
        return new BookSpec(code, title, faculty, type, giveaway, new BigDecimal(price), campus, courseSeq);
    }

    // ------------------------------------------------------------------ tests

    @Test
    @DisplayName("Search chỉ trả SELLING: SOLD/HIDDEN/EXPIRED đều bị loại khỏi chợ")
    void searchReturnsOnlySellingPosts() throws Exception {
        String token = registerAndLogin("market.only@ulis.edu.vn");

        long sellA = createPost(token, spec("POST_SLA", "Bài đang bán A", "ENG_FACULTY", "TYPE_GIAOTRINH",
                false, "45000", "Toà A1 ULIS", "01"));
        createPost(token, spec("POST_SLB", "Bài đang bán B", "ENG_FACULTY", "TYPE_GIAOTRINH",
                false, "40000", "Toà A1 ULIS", "02"));
        long sold = createPost(token, spec("POST_SOD", "Bài đã bán", "ENG_FACULTY", "TYPE_GIAOTRINH",
                false, "30000", "Toà A1 ULIS", "03"));
        long hide = createPost(token, spec("POST_HID", "Bài đã ẩn", "ENG_FACULTY", "TYPE_GIAOTRINH",
                false, "35000", "Toà A1 ULIS", "04"));
        long exp = createPost(token, spec("POST_EXP", "Bài hết hạn", "ENG_FACULTY", "TYPE_GIAOTRINH",
                false, "38000", "Toà A1 ULIS", "05"));

        authed("POST", "/book-posts/sold/" + sold, token, null).andExpect(status().isOk());
        authed("DELETE", "/book-posts/delete/" + hide, token, null).andExpect(status().isOk());
        setExpiredAtPast(exp);
        expiryJob.expire();

        // Không bộ lọc -> chỉ 2 bài SELLING còn ở chợ
        postJson("/book-posts/search", Map.of())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.content[*].status", everyItem(is("SELLING"))))
                .andExpect(jsonPath("$.data.content[?(@.code == 'POST_SOD')]").isEmpty())
                .andExpect(jsonPath("$.data.content[?(@.code == 'POST_HID')]").isEmpty())
                .andExpect(jsonPath("$.data.content[?(@.code == 'POST_EXP')]").isEmpty());
    }

    @Test
    @DisplayName("Khách không cần đăng nhập: search + detail + categories đều 200")
    void guestsCanBrowseWithoutLogin() throws Exception {
        String token = registerAndLogin("guest.owner@ulis.edu.vn");
        long id = createPost(token, spec("POST_GST", "Bài công khai", "ENG_FACULTY", "TYPE_GIAOTRINH",
                false, "45000", "Toà A1 ULIS", "01"));

        mockMvc.perform(get("/book-posts/detail/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SELLING"));

        postJson("/book-posts/search", Map.of("keyword", "Bài công khai"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1));

        mockMvc.perform(get("/book-categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(10));
    }

    @Test
    @DisplayName("Lọc theo giá / tặng 0đ / địa điểm / loại sách")
    void priceGiveawayCampusAndTypeFilters() throws Exception {
        String token = registerAndLogin("filter.user@ulis.edu.vn");

        createPost(token, spec("POST_F_P1", "Sách giá 50k", "ENG_FACULTY", "TYPE_GIAOTRINH",
                false, "50000", "Toà A1 ULIS", "01"));
        createPost(token, spec("POST_F_P2", "Sách giá 20k", "ENG_FACULTY", "TYPE_BAITAP",
                false, "20000", "Thư viện ULIS", "02"));
        createPost(token, spec("POST_F_P3", "Sách tặng 0đ", "ENG_FACULTY", "TYPE_BAITAP",
                true, "0", "Toà A1 ULIS", "03"));

        // minPrice = 30000 -> P1 duy nhất
        postJson("/book-posts/search", Map.of("minPrice", 30000))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].code").value("POST_F_P1"));

        // maxPrice = 30000 -> P2 (20k) + P3 (0đ) = 2
        postJson("/book-posts/search", Map.of("maxPrice", 30000))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2));

        // onlyGiveaway -> P3
        postJson("/book-posts/search", Map.of("onlyGiveaway", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].code").value("POST_F_P3"));

        // campusLocation "Toà A1 ULIS" -> P1 + P3 = 2
        postJson("/book-posts/search", Map.of("campusLocation", "Toà A1 ULIS"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2));

        // bookTypeCode TYPE_BAITAP -> P2 + P3 = 2
        postJson("/book-posts/search", Map.of("bookTypeCode", "TYPE_BAITAP"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2));
    }

    @Test
    @DisplayName("Sort: newest (mặc định, id mới nhất trước) / cheapest / mostViewed")
    void sortModesApply() throws Exception {
        String token = registerAndLogin("sort.user@ulis.edu.vn");

        long cheap = createPost(token, spec("POST_ST_30", "Sách 30k", "ENG_FACULTY", "TYPE_GIAOTRINH",
                false, "30000", "Toà A1 ULIS", "01"));
        long mid = createPost(token, spec("POST_ST_50", "Sách 50k", "ENG_FACULTY", "TYPE_GIAOTRINH",
                false, "50000", "Toà A1 ULIS", "02"));
        long expen = createPost(token, spec("POST_ST_90", "Sách 90k", "ENG_FACULTY", "TYPE_GIAOTRINH",
                false, "90000", "Toà A1 ULIS", "03"));

        // Tăng view của bài 50k (2 lượt xem) để test mostViewed
        mockMvc.perform(get("/book-posts/detail/" + mid)).andExpect(status().isOk());
        mockMvc.perform(get("/book-posts/detail/" + mid)).andExpect(status().isOk());

        // newest (mặc định): bài tạo sau cùng (id cao nhất) lên đầu
        postJson("/book-posts/search", Map.of())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].code").value("POST_ST_90"));

        // cheapest: 30k -> 50k -> 90k
        postJson("/book-posts/search", Map.of("sortBy", "cheapest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].code").value("POST_ST_30"))
                .andExpect(jsonPath("$.data.content[1].code").value("POST_ST_50"))
                .andExpect(jsonPath("$.data.content[2].code").value("POST_ST_90"));

        // mostViewed: bài 50k (2 view) lên đầu
        postJson("/book-posts/search", Map.of("sortBy", "mostViewed"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].code").value("POST_ST_50"));
    }

    @Test
    @DisplayName("Phân trang: totalElements đủ, mỗi trang đúng kích thước")
    void paginationSlicesCorrectly() throws Exception {
        String token = registerAndLogin("page.user@ulis.edu.vn");

        for (int i = 1; i <= 5; i++) {
            createPost(token, spec("POST_PG_" + i, "Bai trang " + i, "ENG_FACULTY", "TYPE_GIAOTRINH",
                    false, String.valueOf(30000 + i * 1000), "Toà A1 ULIS", "0" + i));
        }

        // Trang 1 (FE 1-based) -> 2 tin đầu; response.pageNumber là index 0-based nội bộ
        postJson("/book-posts/search", Map.of("pageSize", 2, "pageNumber", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(5))
                .andExpect(jsonPath("$.data.totalPages").value(3))
                .andExpect(jsonPath("$.data.content.length()").value(2));

        // Trang 3 (FE 1-based) -> còn 1 tin cuối
        postJson("/book-posts/search", Map.of("pageSize", 2, "pageNumber", 3))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(5))
                .andExpect(jsonPath("$.data.content.length()").value(1));
    }
}

package com.ulis.business.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.emptyOrNullString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test bài đăng sách tại seam API (ticket 04):
 * CRUD + ảnh (1..3) + quyền chủ bài + my posts + search/detail.
 * Test tạo dữ liệu bài đăng nên đóng khung context riêng (@DirtiesContext)
 * để không làm hỏng context dùng chung của các test class auth khác.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class BookPostIntegrationTest {

    private static final String PASSWORD = "Matkhau@123";

    private static final String DATE_PATTERN = "\\d{2}/\\d{2}/\\d{4}";

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

    @BeforeEach
    void setUp() {
        devOtpSender.reset();
        bookPostRepository.deleteAll(); // xoá trước (images cascade; không đứt FK user)
        userRepository.deleteAll();
    }

    /**
     * H2 mem có DB_CLOSE_DELAY=-1 nên DB "ulis" tồn tại xuyên suốt JVM, kể cả khi
     * Spring làm mới context. Phải dọn bài đăng/user sau class để không làm hỏng
     * test class auth khác dùng chung DB (chạy trước/sau đều an toàn).
     */
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
            case "PUT" -> put(url);
            case "DELETE" -> delete(url);
            default -> get(url);
        };
        var request = builder.header(HttpHeaders.AUTHORIZATION, "Bearer " + token);
        if (body != null && !httpMethod.equals("DELETE")) {
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

    private Map<String, Object> bookBody(String code, String facultyCode, String bookTypeCode,
                                         boolean giveaway, BigDecimal price, int quantity, int imageCount) {
        List<String> images = new ArrayList<>();
        String imgBase = code == null ? "post" : code.toLowerCase();
        for (int i = 1; i <= imageCount; i++) {
            images.add("https://img.ulis.local/" + imgBase + "-" + i + ".jpg");
        }
        Map<String, Object> body = new LinkedHashMap<>();
        if (code != null) {
            body.put("code", code);
        }
        body.put("title", "Giáo trình Tiếng Anh B2");
        body.put("courseCode", "ENG2014");
        body.put("bookTypeCode", bookTypeCode);
        body.put("facultyCode", facultyCode);
        body.put("isGiveaway", giveaway);
        body.put("price", price);
        body.put("originalPrice", BigDecimal.valueOf(120000));
        body.put("quantity", quantity);
        body.put("condition", "Mới 95% - Bìa bọc cẩn thận");
        body.put("campusLocation", "Toà A1 ULIS");
        body.put("description", "Giáo trình còn mới, đã bọc bìa cẩn thận, giao tại trường");
        if (!images.isEmpty()) {
            body.put("images", images);
            body.put("coverUrl", images.get(0));
        }
        return body;
    }

    private long createPostId(String token, String code) throws Exception {
        MvcResult result = authed("POST", "/book-posts/create", token,
                        bookBody(code, "ENG_FACULTY", "TYPE_GIAOTRINH", false, BigDecimal.valueOf(45000), 1, 1))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asLong();
    }

    // ------------------------------------------------------------------ tests

    @Test
    @DisplayName("GET /book-categories công khai trả 10 danh mục đã seed (khoa trước, loại sách sau)")
    void categoriesAreSeededPublicly() throws Exception {
        mockMvc.perform(get("/book-categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(10))
                .andExpect(jsonPath("$.data[0].code").value("ENG_FACULTY"))
                .andExpect(jsonPath("$.data[0].parentAxis").value("FACULTY"))
                .andExpect(jsonPath("$.data[5].code").value("GER_FACULTY"))
                .andExpect(jsonPath("$.data[6].code").value("TYPE_GIAOTRINH"))
                .andExpect(jsonPath("$.data[6].parentAxis").value("BOOK_TYPE"))
                .andExpect(jsonPath("$.data[0].bookCount").value(0));
    }

    @Test
    @DisplayName("Tạo bài đăng: trả DTO đầy đủ (code, ảnh 1..3, ngày DD/MM/YYYY, seller)")
    void createPostReturnsFullDto() throws Exception {
        String token = registerAndLogin("nguyen.van.a@ulis.edu.vn");

        authed("POST", "/book-posts/create", token,
                bookBody("POST_CRE1", "ENG_FACULTY", "TYPE_GIAOTRINH", false, BigDecimal.valueOf(45000), 1, 2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đăng tin bán sách thành công"))
                .andExpect(jsonPath("$.data.code").value("POST_CRE1"))
                .andExpect(jsonPath("$.data.status").value("SELLING"))
                .andExpect(jsonPath("$.data.quantity").value(1))
                .andExpect(jsonPath("$.data.viewCount").value(0))
                .andExpect(jsonPath("$.data.isGiveaway").value(false))
                .andExpect(jsonPath("$.data.price").value(45000))
                .andExpect(jsonPath("$.data.originalPrice").value(120000))
                .andExpect(jsonPath("$.data.images.length()").value(2))
                .andExpect(jsonPath("$.data.bookTypeName").value("Giáo trình bắt buộc"))
                .andExpect(jsonPath("$.data.facultyName").value("Khoa Sư phạm Tiếng Anh"))
                .andExpect(jsonPath("$.data.createdAt", matchesPattern(DATE_PATTERN)))
                .andExpect(jsonPath("$.data.expiredAt", matchesPattern(DATE_PATTERN)))
                .andExpect(jsonPath("$.data.seller.fullName").value("Nguyen Van A"))
                .andExpect(jsonPath("$.data.seller.msv").value(""))
                .andExpect(jsonPath("$.data.seller.avatarInitials", not(emptyOrNullString())))
                .andExpect(jsonPath("$.data.seller.cohort", matchesPattern("QH-\\d{4} · ULIS")));
    }

    @Test
    @DisplayName("Giveaway -> giá bằng 0 bất kể giá nhập vào")
    void giveawayForcesZeroPrice() throws Exception {
        String token = registerAndLogin("giveaway.user@ulis.edu.vn");

        authed("POST", "/book-posts/create", token,
                bookBody("POST_FREE", "JPN_FACULTY", "TYPE_BAITAP", true, BigDecimal.valueOf(150000), 2, 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isGiveaway").value(true))
                .andExpect(jsonPath("$.data.price").value(0));
    }

    @Test
    @DisplayName("Mã bài trùng (không phân biệt hoa thường) -> 400")
    void duplicateCodeRejected() throws Exception {
        String token = registerAndLogin("dup.code@ulis.edu.vn");

        authed("POST", "/book-posts/create", token,
                bookBody("POST_DUP1", "ENG_FACULTY", "TYPE_GIAOTRINH", false, BigDecimal.valueOf(45000), 1, 1))
                .andExpect(status().isOk());

        authed("POST", "/book-posts/create", token,
                bookBody("post_dup1", "ENG_FACULTY", "TYPE_GIAOTRINH", false, BigDecimal.valueOf(30000), 1, 1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Mã tin đã tồn tại, vui lòng thử lại"));
    }

    @Test
    @DisplayName("Trên 3 ảnh -> 400")
    void moreThanThreeImagesRejected() throws Exception {
        String token = registerAndLogin("limit.photo@ulis.edu.vn");

        authed("POST", "/book-posts/create", token,
                bookBody("POST_IMG", "FRA_FACULTY", "TYPE_TUDIEN", false, BigDecimal.valueOf(10000), 1, 4))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Mỗi bài đăng chỉ được tối đa 3 ảnh"));
    }

    @Test
    @DisplayName("Người khác không update/sold/delete bài của mình -> 403")
    void ownerPermissionEnforced() throws Exception {
        String tokenA = registerAndLogin("owner.one@ulis.edu.vn");
        String tokenB = registerAndLogin("owner.two@ulis.edu.vn");
        long id = createPostId(tokenA, "POST_OWN");

        authed("PUT", "/book-posts/update/" + id, tokenB,
                bookBody(null, "ENG_FACULTY", "TYPE_GIAOTRINH", false, BigDecimal.valueOf(50000), 1, 1))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Bạn không có quyền thao tác tin đăng của người khác"));

        authed("POST", "/book-posts/sold/" + id, tokenB, null)
                .andExpect(status().isForbidden());

        authed("DELETE", "/book-posts/delete/" + id, tokenB, null)
                .andExpect(status().isForbidden());

        // Chủ bài vẫn update được bình thường
        authed("PUT", "/book-posts/update/" + id, tokenA,
                bookBody(null, "ENG_FACULTY", "TYPE_GIAOTRINH", false, BigDecimal.valueOf(50000), 1, 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã cập nhật tin bán sách"))
                .andExpect(jsonPath("$.data.price").value(50000));
    }

    @Test
    @DisplayName("GET /book-posts/my chỉ gồm bài của người dùng đang đăng nhập")
    void myPostsReturnsOnlyOwnPosts() throws Exception {
        String tokenA = registerAndLogin("my.a@ulis.edu.vn");
        String tokenB = registerAndLogin("my.b@ulis.edu.vn");

        createPostId(tokenA, "POST_MY1");
        createPostId(tokenA, "POST_MY2");
        createPostId(tokenB, "POST_MY3");

        authed("GET", "/book-posts/my", tokenA, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].seller.email").value("my.a@ulis.edu.vn"))
                .andExpect(jsonPath("$.data[?(@.code == 'POST_MY3')]").isEmpty());

        authed("GET", "/book-posts/my", tokenB, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].code").value("POST_MY3"));
    }

    @Test
    @DisplayName("POST /book-posts/search trả Page (content + totalElements), lọc khoa/từ khoá")
    void searchReturnsPageAndFilters() throws Exception {
        String token = registerAndLogin("search.user@ulis.edu.vn");
        Map<String, Object> engBody = bookBody("POST_SR1", "ENG_FACULTY", "TYPE_GIAOTRINH", false,
                BigDecimal.valueOf(45000), 1, 1);
        authed("POST", "/book-posts/create", token, engBody).andExpect(status().isOk());
        authed("POST", "/book-posts/create", token,
                bookBody("POST_SR2", "ENG_FACULTY", "TYPE_BAITAP", false, BigDecimal.valueOf(30000), 1, 1))
                .andExpect(status().isOk());
        authed("POST", "/book-posts/create", token,
                bookBody("POST_SR3", "JPN_FACULTY", "TYPE_LUYENTHI", false, BigDecimal.valueOf(60000), 1, 1))
                .andExpect(status().isOk());

        // Không bộ lọc -> có ít nhất 3 bài
        postJson("/book-posts/search", Map.of())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements", greaterThan(2)))
                .andExpect(jsonPath("$.data.content.length()", greaterThan(2)));

        // Lọc theo khoa
        postJson("/book-posts/search", Map.of("facultyCode", "ENG_FACULTY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2));

        // Phân trang: 2 tin/trang
        postJson("/book-posts/search", Map.of("pageSize", 2, "pageNumber", 0))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pageSize").value(2))
                .andExpect(jsonPath("$.data.content.length()").value(2));

        // Từ khoá khớp mã học phần
        postJson("/book-posts/search", Map.of("keyword", "eng2014"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(3));
    }

    @Test
    @DisplayName("Detail tăng viewCount mỗi lần xem và kèm thông tin seller")
    void detailIncrementsViewCountAndShowsSeller() throws Exception {
        String token = registerAndLogin("detail.one@ulis.edu.vn");
        long id = createPostId(token, "POST_DET");

        mockMvc.perform(get("/book-posts/detail/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.viewCount").value(1))
                .andExpect(jsonPath("$.data.seller.id").isNumber())
                .andExpect(jsonPath("$.data.seller.msv").value(""));

        mockMvc.perform(get("/book-posts/detail/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.viewCount").value(2));
    }

    @Test
    @DisplayName("Sold -> SOLD & quantity 0; delete -> HIDDEN, biến mất khỏi search")
    void soldThenDeleteFlow() throws Exception {
        String token = registerAndLogin("flow.user@ulis.edu.vn");
        long id = createPostId(token, "POST_FLOW");

        authed("POST", "/book-posts/sold/" + id, token, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SOLD"))
                .andExpect(jsonPath("$.data.quantity").value(0));

        authed("DELETE", "/book-posts/delete/" + id, token, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã xoá tin bán sách"));

        mockMvc.perform(get("/book-posts/detail/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("HIDDEN"));

        postJson("/book-posts/search", Map.of("keyword", "POST_FLOW"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }
}

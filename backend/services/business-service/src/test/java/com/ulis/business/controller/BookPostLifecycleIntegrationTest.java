package com.ulis.business.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ulis.business.entity.BookPost;
import com.ulis.business.enums.BookPostStatus;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test vòng đời bài đăng (ticket 05) tại seam API:
 * auto-SOLD khi quantity = 0, đăng lại sau SOLD/hết hạn, job hết hạn → EXPIRED,
 * state machine chặn transition trái phép (markSol lặp, BANNED khoá).
 * Giống BookPostIntegrationTest: tự dọn dữ liệu sau class do H2 mem chia sẻ.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class BookPostLifecycleIntegrationTest {

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

    private Map<String, Object> bookBody(String code, int quantity, BigDecimal price) {
        List<String> images = new ArrayList<>();
        images.add("https://img.ulis.local/" + (code == null ? "life" : code.toLowerCase()) + "-1.jpg");
        Map<String, Object> body = new LinkedHashMap<>();
        if (code != null) {
            body.put("code", code);
        }
        body.put("title", "Giáo trình Vòng đời B1");
        body.put("courseCode", "ENG3000");
        body.put("bookTypeCode", "TYPE_GIAOTRINH");
        body.put("facultyCode", "ENG_FACULTY");
        body.put("isGiveaway", false);
        body.put("price", price);
        body.put("originalPrice", BigDecimal.valueOf(120000));
        body.put("quantity", quantity);
        body.put("condition", "Mới 90%");
        body.put("campusLocation", "Toà A1 ULIS");
        body.put("description", "Sách luyện tập cho test vòng đời bài đăng");
        body.put("images", images);
        body.put("coverUrl", images.get(0));
        return body;
    }

    private long createPostId(String token, String code, int quantity) throws Exception {
        MvcResult result = authed("POST", "/book-posts/create", token,
                        bookBody(code, quantity, BigDecimal.valueOf(45000)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asLong();
    }

    /** Viết đè trạng thái trực tiếp qua DB (mô phỏng tác nhân ngoài: admin, job). */
    private void setStatus(long id, BookPostStatus status) {
        BookPost post = bookPostRepository.findById(id).orElseThrow();
        post.setStatus(status);
        bookPostRepository.saveAndFlush(post);
    }

    private void setExpiredAtPast(long id) {
        BookPost post = bookPostRepository.findById(id).orElseThrow();
        post.setExpiredAt(LocalDateTime.now().minusDays(1));
        bookPostRepository.saveAndFlush(post);
    }

    // ------------------------------------------------------------------ tests

    @Test
    @DisplayName("Quantity = 0 khi tạo -> tự SOLD (không SELLING)")
    void createWithZeroQuantityIsSoldAutomatically() throws Exception {
        String token = registerAndLogin("zero.create@ulis.edu.vn");

        authed("POST", "/book-posts/create", token, bookBody("POST_ZERO1", 0, BigDecimal.valueOf(45000)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SOLD"))
                .andExpect(jsonPath("$.data.quantity").value(0));
    }

    @Test
    @DisplayName("Số lượng về 0 khi update -> SOLD; cập nhật lại với số lượng > 0 -> SELLING (đăng lại)")
    void updateToZeroMarksSoldAndRelistAllowed() throws Exception {
        String token = registerAndLogin("zero.update@ulis.edu.vn");
        long id = createPostId(token, "POST_UPD1", 2);

        // Hết hàng: quantity 0 -> SOLD
        authed("PUT", "/book-posts/update/" + id, token, bookBody(null, 0, BigDecimal.valueOf(45000)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SOLD"))
                .andExpect(jsonPath("$.data.quantity").value(0));

        // Chủ bài đăng lại: quantity 1 -> SELLING (state machine cho phép UPDATE từ SOLD)
        authed("PUT", "/book-posts/update/" + id, token, bookBody(null, 1, BigDecimal.valueOf(50000)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SELLING"))
                .andExpect(jsonPath("$.data.quantity").value(1));
    }

    @Test
    @DisplayName("Mark sold 2 lần -> 400 (state machine: chỉ SELLING -> SOLD)")
    void markSoldTwiceIsRejected() throws Exception {
        String token = registerAndLogin("double.sold@ulis.edu.vn");
        long id = createPostId(token, "POST_DS1", 1);

        authed("POST", "/book-posts/sold/" + id, token, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SOLD"));

        authed("POST", "/book-posts/sold/" + id, token, null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Không thể chuyển trạng thái bài đăng từ SOLD sang SOLD"));
    }

    @Test
    @DisplayName("Mark sold trên bài đã hết hạn (EXPIRED) -> 400")
    void markSoldOnExpiredPostIsRejected() throws Exception {
        String token = registerAndLogin("sold.expired@ulis.edu.vn");
        long id = createPostId(token, "POST_EX1", 1);

        setStatus(id, BookPostStatus.EXPIRED);
        authed("POST", "/book-posts/sold/" + id, token, null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Không thể chuyển trạng thái bài đăng từ EXPIRED sang SOLD"));
    }

    @Test
    @DisplayName("Job hết hạn: SELLING quá hạn -> EXPIRED; bài EXPIRED biến mất khỏi search")
    void expiryJobFlipsExpiredPostsAndExcludesFromSearch() throws Exception {
        String token = registerAndLogin("expire.job@ulis.edu.vn");
        long id = createPostId(token, "POST_JOB1", 1);

        // chưa hết hạn: vẫn SELLING
        mockMvc.perform(get("/book-posts/detail/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SELLING"));

        // ép hết hạn rồi chạy job
        setExpiredAtPast(id);
        expiryJob.expire();

        mockMvc.perform(get("/book-posts/detail/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("EXPIRED"));

        // EXPIRED bị loại khỏi kết quả active (search chỉ trả SELLING/SOLD)
        postJson("/book-posts/search", Map.of("keyword", "POST_JOB1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    @DisplayName("Bài bị BANNED khoá chủ: update/sold/delete đều -> 400")
    void bannedPostIsLockedForOwnerActions() throws Exception {
        String token = registerAndLogin("banned.owner@ulis.edu.vn");
        long id = createPostId(token, "POST_BAN1", 1);

        setStatus(id, BookPostStatus.BANNED);

        authed("PUT", "/book-posts/update/" + id, token, bookBody(null, 1, BigDecimal.valueOf(10000)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Không thể chuyển trạng thái bài đăng từ BANNED sang SELLING"));

        authed("POST", "/book-posts/sold/" + id, token, null)
                .andExpect(status().isBadRequest());

        authed("DELETE", "/book-posts/delete/" + id, token, null)
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Danh mục không hợp lệ (cả 2 trục) -> 400; 2 trục taxonomy có thể chọn khi đăng")
    void invalidCategoryRejectedAndBothAxesSelectable() throws Exception {
        String token = registerAndLogin("cat.invalid@ulis.edu.vn");

        // Khoa không tồn tại -> 400
        Map<String, Object> badFaculty = bookBody("POST_BFC", 1, BigDecimal.valueOf(10000));
        badFaculty.put("facultyCode", "XXX_UNKNOWN");
        authed("POST", "/book-posts/create", token, badFaculty)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Danh mục không hợp lệ hoặc không hoạt động: XXX_UNKNOWN"));

        // Loại sách không tồn tại -> 400
        Map<String, Object> badType = bookBody("POST_BTC", 1, BigDecimal.valueOf(10000));
        badType.put("bookTypeCode", "TYPE_UNKNOWN");
        authed("POST", "/book-posts/create", token, badType)
                .andExpect(status().isBadRequest());

        // Cả 2 trục hợp lệ (faculty + bookType) -> tạo được bình thường
        mockMvc.perform(get("/book-categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.parentAxis == 'FACULTY')]").isNotEmpty())
                .andExpect(jsonPath("$.data[?(@.parentAxis == 'BOOK_TYPE')]").isNotEmpty());

        long id = createPostId(token, "POST_VAL1", 1);
        mockMvc.perform(get("/book-posts/detail/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.bookTypeName").value("Giáo trình bắt buộc"))
                .andExpect(jsonPath("$.data.facultyName").value("Khoa Sư phạm Tiếng Anh"));
    }
}

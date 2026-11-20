package com.ulis.business.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ulis.business.entity.BookComment;
import com.ulis.business.entity.BookPost;
import com.ulis.business.entity.User;
import com.ulis.business.enums.UserRole;
import com.ulis.business.repository.BookPostRepository;
import com.ulis.business.repository.CommentRepository;
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

import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test bình luận 1 cấp (ticket 07) tại seam API:
 * mới nhất trước + denormalized author fields, chỉ tác giả sửa/xoá (403),
 * rate limit giãn cách, admin delete (ADMIN được / không được học viên),
 * khách xem công khai không token, bình luận trên bài không tồn tại (404),
 * phân trang pageNumber 1-based như FE.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class CommentIntegrationTest {

    private static final String PASSWORD = "Matkhau@123";
    private static final String DATE_TIME_PATTERN = "\\d{2}/\\d{2}/\\d{4} \\d{2}:\\d{2}";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookPostRepository bookPostRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private DevOtpSender devOtpSender;

    @BeforeEach
    void setUp() {
        devOtpSender.reset();
        commentRepository.deleteAll(); // xoá trước do FK tới post/user
        bookPostRepository.deleteAll();
        userRepository.deleteAll();
    }

    @AfterAll
    void tearDown() {
        commentRepository.deleteAll();
        bookPostRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ------------------------------------------------------------------ helpers

    private ResultActions postJson(String url, Object body) throws Exception {
        return mockMvc.perform(post(url)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
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

    /** Nâng quyền ADMIN trực tiếp qua DB rồi đăng nhập để lấy token ADMIN. */
    private String registerAdminAndLogin(String email) throws Exception {
        String token = registerAndLogin(email);
        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        user.setRole(UserRole.ADMIN);
        userRepository.saveAndFlush(user);
        // Filter đọc role mới từ DB — dùng luôn token đã có (không cần login lại).
        return token;
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

    private Map<String, Object> bookBody(String code) {
        List<String> images = new ArrayList<>();
        images.add("https://img.ulis.local/" + (code == null ? "cmt" : code.toLowerCase()) + "-1.jpg");
        Map<String, Object> body = new LinkedHashMap<>();
        if (code != null) {
            body.put("code", code);
        }
        body.put("title", "Giáo trình bình luận A1");
        body.put("courseCode", "ENG2000");
        body.put("bookTypeCode", "TYPE_GIAOTRINH");
        body.put("facultyCode", "ENG_FACULTY");
        body.put("isGiveaway", false);
        body.put("price", BigDecimal.valueOf(45000));
        body.put("originalPrice", BigDecimal.valueOf(120000));
        body.put("quantity", 1);
        body.put("condition", "Mới 90%");
        body.put("campusLocation", "Toà A1 ULIS");
        body.put("description", "Sách luyện tập cho test bình luận");
        body.put("images", images);
        body.put("coverUrl", images.get(0));
        return body;
    }

    private long createPostId(String token, String code) throws Exception {
        MvcResult result = authed("POST", "/book-posts/create", token, bookBody(code))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asLong();
    }

    private long createComment(String token, long postId, String content) throws Exception {
        MvcResult result = authed("POST", "/comments/create", token,
                        Map.of("postId", postId, "content", content))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asLong();
    }

    /** Seed trực tiếp qua DB (tránh rate limit) để test phân trang thuần tuý. */
    private void seedComments(long postId, long authorId, int count) {
        BookPost post = bookPostRepository.findById(postId).orElseThrow();
        User author = userRepository.findById(authorId).orElseThrow();
        for (int i = 0; i < count; i++) {
            LocalDateTime now = LocalDateTime.now();
            commentRepository.saveAndFlush(BookComment.builder()
                    .post(post)
                    .author(author)
                    .content("Bình luận seed " + i)
                    .authorName(author.getFullName())
                    .authorEmail(author.getEmail())
                    .authorCohort("QH-2026 · ULIS")
                    .authorInitials("SA")
                    .isSeller(false)
                    .createdAt(now)
                    .updatedAt(now)
                    .createdBy(author.getEmail())
                    .updatedBy(author.getEmail())
                    .build());
        }
    }

    // ------------------------------------------------------------------ tests

    @Test
    @DisplayName("Danh sách bình luận: mới nhất trước + đủ author fields; khách xem không token")
    void listNewestFirstWithAuthorFieldsAndGuestRead() throws Exception {
        String sellerToken = registerAndLogin("seller.cmt@ulis.edu.vn");
        long postId = createPostId(sellerToken, "POST_CM1");

        // 3 người khác nhau, mỗi người 1 bình luận (tránh rate limit)
        String first = registerAndLogin("buyer.one@ulis.edu.vn");    // "Buyer One" -> BO, isSeller=false
        String second = registerAndLogin("buyer.two@ulis.edu.vn");   // "Buyer Two" -> BT
        String third = registerAndLogin("buyer.three@ulis.edu.vn");  // "Buyer Three" -> BT (trùng initials chấp nhận)
        createComment(first, postId, "Sách còn không bạn?");
        createComment(second, postId, "Mình lấy nha!");
        createComment(third, postId, "Bạn ơi còn kèm đáp án không?");

        // Chủ bài bình luận trả lời -> isSeller = true
        createComment(sellerToken, postId, "Sách vẫn còn nhé!");

        // mới nhất trước: bình luận chủ bài (tạo cuối) đứng đầu
        postJson("/comments/by-post", Map.of("postId", postId, "pageNumber", 1, "pageSize", 20))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(4))
                .andExpect(jsonPath("$.data.content[0].authorEmail").value("seller.cmt@ulis.edu.vn"))
                .andExpect(jsonPath("$.data.content[0].isSeller").value(true))
                .andExpect(jsonPath("$.data.content[0].authorCohort").value("QH-2026 · ULIS"))
                .andExpect(jsonPath("$.data.content[0].authorInitials").value("SC"))
                .andExpect(jsonPath("$.data.content[0].createdAt", matchesPattern(DATE_TIME_PATTERN)))
                .andExpect(jsonPath("$.data.content[1].authorEmail").value("buyer.three@ulis.edu.vn"))
                .andExpect(jsonPath("$.data.content[3].authorEmail").value("buyer.one@ulis.edu.vn"))
                .andExpect(jsonPath("$.data.content[3].isSeller").value(false));
    }

    @Test
    @DisplayName("Chỉ tác giả được sửa/xoá bình luận; người khác -> 403; xoá xong biến mất")
    void onlyAuthorCanUpdateOrDelete() throws Exception {
        String author = registerAndLogin("cmt.author@ulis.edu.vn");
        String stranger = registerAndLogin("cmt.stranger@ulis.edu.vn");
        long postId = createPostId(author, "POST_CM2");
        long commentId = createComment(author, postId, "Nội dung gốc");

        // người khác sửa -> 403
        authed("PUT", "/comments/update/" + commentId, stranger, Map.of("content", "Sửa trộm"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(
                        "Bạn chỉ có thể chỉnh sửa/xoá bình luận của chính mình"));

        // người khác xoá -> 403
        authed("DELETE", "/comments/delete/" + commentId, stranger, null)
                .andExpect(status().isForbidden());

        // tác giả sửa -> 200
        authed("PUT", "/comments/update/" + commentId, author, Map.of("content", "Nội dung mới"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").value("Nội dung mới"));

        // tác giả xoá -> 200, danh sách rỗng
        authed("DELETE", "/comments/delete/" + commentId, author, null)
                .andExpect(status().isOk());
        postJson("/comments/by-post", Map.of("postId", postId, "pageSize", 20))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    @DisplayName("Rate limit: bình luận 2 lần quá nhanh -> 400 kèm thông báo rõ ràng")
    void rateLimitsRapidComments() throws Exception {
        String token = registerAndLogin("cmt.rapid@ulis.edu.vn");
        long postId = createPostId(token, "POST_CM3");

        createComment(token, postId, "Bình luận thứ nhất");

        authed("POST", "/comments/create", token,
                        Map.of("postId", postId, "content", "Bình luận ngay lập tức"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "Bạn đang bình luận quá nhanh, vui lòng chờ một chút rồi thử lại"));
    }

    @Test
    @DisplayName("Admin delete: học viên gọi /admin/delete -> 403; ADMIN -> 200 và comment biến mất")
    void adminDeleteRestrictedToAdmin() throws Exception {
        String author = registerAndLogin("cmt.author.adm@ulis.edu.vn");
        String student = registerAndLogin("cmt.student.adm@ulis.edu.vn");
        String admin = registerAdminAndLogin("cmt.admin@ulis.edu.vn");
        long postId = createPostId(author, "POST_CM4");
        long commentId = createComment(author, postId, "Bình luận nhạy cảm");

        // học viên (không phải tác giả) -> 403
        authed("DELETE", "/comments/admin/delete/" + commentId, student, null)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(
                        "Chỉ quản trị viên mới có quyền thực hiện thao tác này"));

        // admin -> 200 và không còn trong danh sách
        authed("DELETE", "/comments/admin/delete/" + commentId, admin, null)
                .andExpect(status().isOk());
        postJson("/comments/by-post", Map.of("postId", postId, "pageSize", 20))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    @DisplayName("Bình luận trên bài không tồn tại -> 404; nội dung trống -> 400")
    void missingPostAndBlankContentAreRejected() throws Exception {
        String token = registerAndLogin("cmt.invalid@ulis.edu.vn");

        authed("POST", "/comments/create", token,
                        Map.of("postId", 999999L, "content", "Bài này không tồn tại"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Không tìm thấy tin bán sách"));

        postJson("/comments/by-post", Map.of("postId", 999999L))
                .andExpect(status().isNotFound());

        long postId = createPostId(token, "POST_CM5");
        authed("POST", "/comments/create", token, Map.of("postId", postId, "content", "   "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.content").value("Vui lòng nhập nội dung bình luận"));
    }

    @Test
    @DisplayName("Phân trang 1-based: trang 1 (20 tin) rồi trang 2 (5 tin còn lại)")
    void paginationIsOneBasedLikeFrontend() throws Exception {
        String token = registerAndLogin("cmt.page@ulis.edu.vn");
        long postId = createPostId(token, "POST_CM6");
        User author = userRepository.findByEmailIgnoreCase("cmt.page@ulis.edu.vn").orElseThrow();
        seedComments(postId, author.getId(), 25);

        postJson("/comments/by-post", Map.of("postId", postId, "pageNumber", 1, "pageSize", 20))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(25))
                .andExpect(jsonPath("$.data.totalPages").value(2))
                .andExpect(jsonPath("$.data.content.length()").value(20));

        postJson("/comments/by-post", Map.of("postId", postId, "pageNumber", 2, "pageSize", 20))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(25))
                .andExpect(jsonPath("$.data.content.length()").value(5));
    }
}

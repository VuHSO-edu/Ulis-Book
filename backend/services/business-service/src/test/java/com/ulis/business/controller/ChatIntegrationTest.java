package com.ulis.business.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ulis.business.entity.BookPost;
import com.ulis.business.entity.ChatConversation;
import com.ulis.business.entity.ChatMessage;
import com.ulis.business.entity.User;
import com.ulis.business.repository.BookPostRepository;
import com.ulis.business.repository.ConversationRepository;
import com.ulis.business.repository.MessageRepository;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test chat hội thoại + lịch sử (ticket 08) tại seam API:
 * - open/get-or-create: cùng cặp + cùng bài đăng reuse hội thoại cũ (không
 *   duplicate), contextBook có/không gắn bài đăng;
 * - gửi / list tin nhắn ascending (page 1 = block mới nhất), isRead flip sau
 *   mark-read, unread count theo từng người xem;
 * - access control: chỉ user A/B truy cập được (outsider 403), khách 401,
 *   hội thoại không tồn tại 404;
 * - phân trang 1-based như FE; danh sách hội thoại chỉ của tôi, mới hoạt động
 *   trước.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ChatIntegrationTest {

    private static final String PASSWORD = "Matkhau@123";
    private static final String TIME_PATTERN = "\\d{2}:\\d{2}";
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
    private ConversationRepository conversationRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private DevOtpSender devOtpSender;

    @BeforeEach
    void setUp() {
        devOtpSender.reset();
        // chat trước (FK tới conversation/post/user), rồi post -> user
        messageRepository.deleteAll();
        conversationRepository.deleteAll();
        bookPostRepository.deleteAll();
        userRepository.deleteAll();
    }

    @AfterAll
    void tearDown() {
        messageRepository.deleteAll();
        conversationRepository.deleteAll();
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

    private User user(String email) {
        return userRepository.findByEmailIgnoreCase(email).orElseThrow();
    }

    private Map<String, Object> bookBody(String code) {
        List<String> images = new ArrayList<>();
        images.add("https://img.ulis.local/" + (code == null ? "chat" : code.toLowerCase()) + "-1.jpg");
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
        body.put("description", "Sách luyện tập cho test chat");
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

    private long openConversation(String token, Long peerId, Long postId) throws Exception {
        MvcResult result = authed("POST", "/conversations/open", token,
                        postId == null ? Map.of("peerId", peerId) : Map.of("peerId", peerId, "postId", postId))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asLong();
    }

    private long sendMessage(String token, long conversationId, String content) throws Exception {
        MvcResult result = authed("POST", "/conversations/" + conversationId + "/messages/send", token,
                        Map.of("content", content))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asLong();
    }

    /** Seed hội thoại trực tiếp qua DB (tránh phụ thuộc thời gian realtime). */
    private ChatConversation seedConversation(User a, User b, LocalDateTime lastMessageAt, String lastMessage,
                                              Long lastSenderId) {
        User userA = a.getId() < b.getId() ? a : b;
        User userB = a.getId() < b.getId() ? b : a;
        return conversationRepository.saveAndFlush(ChatConversation.builder()
                .userA(userA)
                .userB(userB)
                .lastMessage(lastMessage)
                .lastMessageAt(lastMessageAt)
                .lastSenderId(lastSenderId)
                .createdAt(lastMessageAt)
                .updatedAt(lastMessageAt)
                .createdBy(userA.getEmail())
                .updatedBy(userA.getEmail())
                .build());
    }

    private void seedMessage(ChatConversation conversation, User sender, String content,
                             LocalDateTime createdAt, boolean read) {
        messageRepository.saveAndFlush(ChatMessage.builder()
                .conversation(conversation)
                .sender(sender)
                .content(content)
                .isRead(read)
                .createdAt(createdAt)
                .createdBy(sender.getEmail())
                .build());
    }

    // ------------------------------------------------------------------ tests

    @Test
    @DisplayName("open: cùng cặp + cùng bài đăng reuse hội thoại; contextBook đủ thông tin vs trống khi không gắn bài")
    void openReusesConversationPerPairAndPost() throws Exception {
        String aToken = registerAndLogin("chat.a1@ulis.edu.vn");
        String bToken = registerAndLogin("chat.b1@ulis.edu.vn");
        long aId = user("chat.a1@ulis.edu.vn").getId();
        long bId = user("chat.b1@ulis.edu.vn").getId();
        long postId = createPostId(aToken, "POST_CH1");

        // Mở từ phía A gắn bài đăng
        authed("POST", "/conversations/open", aToken, Map.of("peerId", bId, "postId", postId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.peerId").value(bId))
                .andExpect(jsonPath("$.data.peerName").value("Chat B1"))
                .andExpect(jsonPath("$.data.peerEmail").value("chat.b1@ulis.edu.vn"))
                .andExpect(jsonPath("$.data.peerMsv").value(""))
                .andExpect(jsonPath("$.data.peerInitials").value("CB"))
                .andExpect(jsonPath("$.data.isOnline").value(false))
                .andExpect(jsonPath("$.data.contextBook.postId").value(postId))
                .andExpect(jsonPath("$.data.contextBook.courseCode").value("ENG2000"))
                .andExpect(jsonPath("$.data.contextBook.title").value("Giáo trình bình luận A1"))
                .andExpect(jsonPath("$.data.contextBook.price").value(45000))
                .andExpect(jsonPath("$.data.contextBook.isGiveaway").value(false))
                .andExpect(jsonPath("$.data.contextBook.condition").value("Mới 90%"))
                .andExpect(jsonPath("$.data.contextBook.campusLocation").value("Toà A1 ULIS"));
        long withPost = openConversation(aToken, bId, postId);

        // Mở lại từ phía B với cùng bài -> cùng id, không duplicate
        long withPostAgain = openConversation(bToken, aId, postId);
        org.junit.jupiter.api.Assertions.assertEquals(withPost, withPostAgain);

        // Hội thoại chung (không gắn bài) -> id khác, contextBook trống (FE đọc courseCode/title)
        authed("POST", "/conversations/open", aToken, Map.of("peerId", bId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.contextBook.postId").value(0))
                .andExpect(jsonPath("$.data.contextBook.courseCode").value(""))
                .andExpect(jsonPath("$.data.contextBook.title").value(""))
                .andExpect(jsonPath("$.data.id").value(org.hamcrest.Matchers.not(withPost)));
        long withoutPost = openConversation(aToken, bId, null);
        long withoutPostAgain = openConversation(bToken, aId, null);
        org.junit.jupiter.api.Assertions.assertEquals(withoutPost, withoutPostAgain);
        org.junit.jupiter.api.Assertions.assertNotEquals(withPost, withoutPost);
    }

    @Test
    @DisplayName("Gửi/list tin ascending + unread theo từng người + mark-read lật isRead")
    void sendAndUnreadAndMarkRead() throws Exception {
        String aToken = registerAndLogin("chat.a2@ulis.edu.vn");
        String bToken = registerAndLogin("chat.b2@ulis.edu.vn");
        long aId = user("chat.a2@ulis.edu.vn").getId();
        long bId = user("chat.b2@ulis.edu.vn").getId();
        long convId = openConversation(aToken, bId, null);

        // A gửi, B gửi, A gửi
        authed("POST", "/conversations/" + convId + "/messages/send", aToken, Map.of("content", "Chào bạn"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.conversationId").value(convId))
                .andExpect(jsonPath("$.data.senderId").value(aId))
                .andExpect(jsonPath("$.data.senderName").value("Chat A2"))
                .andExpect(jsonPath("$.data.content").value("Chào bạn"))
                .andExpect(jsonPath("$.data.isRead").value(false))
                .andExpect(jsonPath("$.data.isAppointment").value(false))
                .andExpect(jsonPath("$.data.createdAt", matchesPattern(DATE_TIME_PATTERN)));
        sendMessage(bToken, convId, "Chào bạn, sách còn không?");
        sendMessage(aToken, convId, "Còn nhé!");

        // List page 1: ascending (tin cũ trước), page 1 = block mới nhất
        authed("POST", "/conversations/" + convId + "/messages", aToken,
                        Map.of("pageNumber", 1, "pageSize", 10))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.content[0].content").value("Chào bạn"))
                .andExpect(jsonPath("$.data.content[1].content").value("Chào bạn, sách còn không?"))
                .andExpect(jsonPath("$.data.content[2].content").value("Còn nhé!"));

        // Unread theo từng viewer: A chưa đọc 1 tin của B; B chưa đọc 2 tin của A
        authed("POST", "/conversations/search", aToken, Map.of("pageNumber", 1, "pageSize", 20))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].id").value(convId))
                .andExpect(jsonPath("$.data.content[0].unreadCount").value(1))
                .andExpect(jsonPath("$.data.content[0].isLastFromMe").value(true))
                .andExpect(jsonPath("$.data.content[0].lastMessage").value("Còn nhé!"))
                .andExpect(jsonPath("$.data.content[0].lastMessageTime", matchesPattern(TIME_PATTERN)));
        authed("POST", "/conversations/search", bToken, Map.of("pageNumber", 1, "pageSize", 20))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].unreadCount").value(2))
                .andExpect(jsonPath("$.data.content[0].isLastFromMe").value(false));

        // A mở (mark read) -> unread A = 0; tin của B chuyển isRead=true, tin A gửi vẫn false
        authed("PUT", "/conversations/" + convId + "/read", aToken, null)
                .andExpect(status().isOk());
        authed("POST", "/conversations/search", aToken, Map.of("pageNumber", 1, "pageSize", 20))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].unreadCount").value(0));
        authed("POST", "/conversations/" + convId + "/messages", aToken,
                        Map.of("pageNumber", 1, "pageSize", 10))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].isRead").value(false)) // A gửi
                .andExpect(jsonPath("$.data.content[1].isRead").value(true))  // B gửi
                .andExpect(jsonPath("$.data.content[2].isRead").value(false)); // A gửi

        // B mở (mark read) -> unread B = 0; mọi tin đã đọc
        authed("PUT", "/conversations/" + convId + "/read", bToken, null)
                .andExpect(status().isOk());
        authed("POST", "/conversations/search", bToken, Map.of("pageNumber", 1, "pageSize", 20))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].unreadCount").value(0));
        authed("POST", "/conversations/" + convId + "/messages", bToken,
                        Map.of("pageNumber", 1, "pageSize", 10))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].isRead").value(true))
                .andExpect(jsonPath("$.data.content[1].isRead").value(true))
                .andExpect(jsonPath("$.data.content[2].isRead").value(true));
    }

    @Test
    @DisplayName("Outsider bị 403 khi xem/gửi/đánh dấu; hội thoại không tồn tại -> 404; khách -> 401")
    void outsiderAndMissingAndGuest() throws Exception {
        String aToken = registerAndLogin("chat.a3@ulis.edu.vn");
        String bToken = registerAndLogin("chat.b3@ulis.edu.vn");
        String cToken = registerAndLogin("chat.c3@ulis.edu.vn");
        long bId = user("chat.b3@ulis.edu.vn").getId();
        long convId = openConversation(aToken, bId, null);

        // Người ngoài cuộc (C) gửi / xem / đánh dấu -> 403
        authed("POST", "/conversations/" + convId + "/messages/send", cToken, Map.of("content", "C thử"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Bạn không có quyền truy cập hội thoại này"));
        authed("POST", "/conversations/" + convId + "/messages", cToken,
                        Map.of("pageNumber", 1, "pageSize", 10))
                .andExpect(status().isForbidden());
        authed("PUT", "/conversations/" + convId + "/read", cToken, null)
                .andExpect(status().isForbidden());

        // C không thấy hội thoại của người khác trong danh sách của mình
        authed("POST", "/conversations/search", cToken, Map.of("pageNumber", 1, "pageSize", 20))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(0));

        // Hội thoại không tồn tại -> 404
        authed("POST", "/conversations/999999/messages", aToken, Map.of("pageNumber", 1, "pageSize", 10))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Không tìm thấy hội thoại"));
        authed("POST", "/conversations/999999/messages/send", aToken, Map.of("content", "hi"))
                .andExpect(status().isNotFound());

        // Khách không token -> 401
        postJson("/conversations/search", Map.of("pageNumber", 1, "pageSize", 20))
                .andExpect(status().isUnauthorized());
        postJson("/conversations/open", Map.of("peerId", bId))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/conversations/1/messages/send")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("content", "x"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("open sai: tự nhắn chính mình 400; peer không tồn tại 404; bài không tồn tại 404; validate 400")
    void invalidOpenAndValidation() throws Exception {
        String aToken = registerAndLogin("chat.a4@ulis.edu.vn");
        String bToken = registerAndLogin("chat.b4@ulis.edu.vn");
        long aId = user("chat.a4@ulis.edu.vn").getId();
        long bId = user("chat.b4@ulis.edu.vn").getId();
        createPostId(bToken, "POST_CH4");

        // Tự mở với chính mình -> 400
        authed("POST", "/conversations/open", aToken, Map.of("peerId", aId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Bạn không thể nhắn tin với chính mình"));

        // Peer không tồn tại -> 404
        authed("POST", "/conversations/open", aToken, Map.of("peerId", 999999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Không tìm thấy người dùng để nhắn tin"));

        // Bài đăng không tồn tại -> 404
        authed("POST", "/conversations/open", aToken, Map.of("peerId", bId, "postId", 999999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Không tìm thấy tin bán sách"));

        // Thiếu peerId -> 400 VALIDATION_FAILED
        authed("POST", "/conversations/open", aToken, Map.of("postId", 1L))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.peerId").value("Vui lòng chọn người để nhắn tin"));

        // Nội dung trống -> 400 VALIDATION_FAILED
        long convId = openConversation(aToken, bId, null);
        authed("POST", "/conversations/" + convId + "/messages/send", aToken, Map.of("content", "   "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.content").value("Vui lòng nhập nội dung tin nhắn"));
    }

    @Test
    @DisplayName("Phân trang tin nhắn 1-based: page 1 = 20 tin mới nhất ascending, page 2 = 5 tin cũ hơn")
    void messagePaginationIsOneBased() throws Exception {
        String aToken = registerAndLogin("chat.a5@ulis.edu.vn");
        String bToken = registerAndLogin("chat.b5@ulis.edu.vn");
        long bId = user("chat.b5@ulis.edu.vn").getId();
        long convId = openConversation(aToken, bId, null);
        User a = user("chat.a5@ulis.edu.vn");
        User b = user("chat.b5@ulis.edu.vn");
        ChatConversation conversation = conversationRepository.findById(convId).orElseThrow();

        // Seed 25 tin với createdAt tăng dần (0..24) -> thứ tự ổn định
        LocalDateTime base = LocalDateTime.now().minusMinutes(5);
        for (int i = 0; i < 25; i++) {
            seedMessage(conversation, i % 2 == 0 ? a : b, "msg-" + i, base.plusSeconds(i), false);
        }

        // Page 1 (1-based): 20 tin mới nhất (msg-5..msg-24) ascending, tổng 25
        authed("POST", "/conversations/" + convId + "/messages", aToken,
                        Map.of("pageNumber", 1, "pageSize", 20))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(25))
                .andExpect(jsonPath("$.data.totalPages").value(2))
                .andExpect(jsonPath("$.data.content.length()").value(20))
                .andExpect(jsonPath("$.data.content[0].content").value("msg-5"))
                .andExpect(jsonPath("$.data.content[19].content").value("msg-24"))
                .andExpect(jsonPath("$.data.content[3].senderId").value(a.getId()));

        // Page 2: 5 tin cũ nhất (msg-0..msg-4)
        authed("POST", "/conversations/" + convId + "/messages", aToken,
                        Map.of("pageNumber", 2, "pageSize", 20))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(25))
                .andExpect(jsonPath("$.data.content.length()").value(5))
                .andExpect(jsonPath("$.data.content[0].content").value("msg-0"))
                .andExpect(jsonPath("$.data.content[4].content").value("msg-4"));
    }

    @Test
    @DisplayName("Hội thoại chưa nhắn (lastMessageAt null) xếp sau hội thoại có tin mới nhất")
    void inactiveConversationSortsAfterActiveOne() throws Exception {
        String aToken = registerAndLogin("chat.a7@ulis.edu.vn");
        registerAndLogin("chat.b7@ulis.edu.vn");
        User a = user("chat.a7@ulis.edu.vn");
        User b = user("chat.b7@ulis.edu.vn");

        // Hội thoại trống: createdAt quá khứ, lastMessageAt = null
        LocalDateTime created = LocalDateTime.now().minusMinutes(2);
        ChatConversation emptyConv = conversationRepository.saveAndFlush(ChatConversation.builder()
                .userA(a)
                .userB(b)
                .createdAt(created)
                .updatedAt(created)
                .createdBy(a.getEmail())
                .updatedBy(a.getEmail())
                .build());
        // Hội thoại hoạt động: có lastMessageAt gần hơn
        ChatConversation activeConv = seedConversation(a, b, LocalDateTime.now().minusMinutes(1),
                "Tin đầu tiên", a.getId());

        authed("POST", "/conversations/search", aToken, Map.of("pageNumber", 1, "pageSize", 20))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.content[0].id").value(activeConv.getId()))
                .andExpect(jsonPath("$.data.content[0].lastMessage").value("Tin đầu tiên"))
                .andExpect(jsonPath("$.data.content[1].id").value(emptyConv.getId()))
                .andExpect(jsonPath("$.data.content[1].lastMessage").value(""));
    }

    @Test
    @DisplayName("Danh sách hội thoại: chỉ của tôi, mới hoạt động trước; unread theo từng viewer")
    void conversationSearchIsOnlyMineAndOrderedByActivity() throws Exception {
        String aToken = registerAndLogin("chat.a6@ulis.edu.vn");
        String bToken = registerAndLogin("chat.b6@ulis.edu.vn");
        String cToken = registerAndLogin("chat.c6@ulis.edu.vn");
        User a = user("chat.a6@ulis.edu.vn");
        User b = user("chat.b6@ulis.edu.vn");
        User c = user("chat.c6@ulis.edu.vn");

        LocalDateTime t1 = LocalDateTime.now().minusMinutes(10);
        LocalDateTime t2 = LocalDateTime.now().minusMinutes(5);
        ChatConversation convAB = seedConversation(a, b, t1, "A: mình gửi trước nhé", a.getId());
        ChatConversation convAC = seedConversation(a, c, t2, "C: bài này còn không?", c.getId());
        // C gửi 1 tin chưa đọc trong convAC; A gửi 1 tin chưa đọc trong convAB
        seedMessage(convAC, c, "C: bài này còn không?", t2, false);
        seedMessage(convAB, a, "A: mình gửi trước nhé", t1, false);

        // A: 2 hội thoại, convAC hoạt động sau cùng -> đứng đầu; unread tương ứng 1
        authed("POST", "/conversations/search", aToken, Map.of("pageNumber", 1, "pageSize", 20))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.content[0].id").value(convAC.getId()))
                .andExpect(jsonPath("$.data.content[0].peerId").value(c.getId()))
                .andExpect(jsonPath("$.data.content[0].unreadCount").value(1))
                .andExpect(jsonPath("$.data.content[1].id").value(convAB.getId()))
                .andExpect(jsonPath("$.data.content[1].peerId").value(b.getId()));

        // B: chỉ thấy hội thoại của mình (A-B), không thấy A-C
        authed("POST", "/conversations/search", bToken, Map.of("pageNumber", 1, "pageSize", 20))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].id").value(convAB.getId()))
                .andExpect(jsonPath("$.data.content[0].peerId").value(a.getId()))
                .andExpect(jsonPath("$.data.content[0].unreadCount").value(1))
                .andExpect(jsonPath("$.data.content[0].isLastFromMe").value(false));

        // C: chỉ thấy A-C, tin C gửi chưa bị A đọc -> unread 0 cho C (tin A gửi nằm ở convAB, không phải convAC)
        authed("POST", "/conversations/search", cToken, Map.of("pageNumber", 1, "pageSize", 20))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.content[0].id").value(convAC.getId()))
                .andExpect(jsonPath("$.data.content[0].unreadCount").value(0));
    }
}

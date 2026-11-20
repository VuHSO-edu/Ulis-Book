package com.ulis.business.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ulis.business.dto.request.ChatRealtimeSendRequest;
import com.ulis.business.dto.response.ChatConversationResponse;
import com.ulis.business.dto.response.ChatErrorResponse;
import com.ulis.business.dto.response.ChatMessageResponse;
import com.ulis.business.repository.BookPostRepository;
import com.ulis.business.repository.ConversationRepository;
import com.ulis.business.repository.MessageRepository;
import com.ulis.business.repository.UserRepository;
import com.ulis.business.service.impl.DevOtpSender;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

import java.lang.reflect.Type;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

/**
 * Integration test chat realtime WS/STOMP (ticket 09) tại seam thực:
 * server HTTP + handshake WebSocket thật (RANDOM_PORT).
 * <p>Phủ 5 tiêu chí ticket:
 * <ol>
 *   <li>hai user cùng hội thoại thấy tin của nhau ngay (không reload);</li>
 *   <li>handshake thiếu/sai JWT bị từ chối, token hợp lệ kết nối được;</li>
 *   <li>tin vẫn được lưu DB (REST list thấy đúng) dù đã đẩy realtime;</li>
 *   <li>unread badge cập nhật live qua queue chat.conversations
 *       (người nhận +1, người gửi giữ nguyên) và khớp REST;</li>
 *   <li>người ngoài hội thoại nhận lỗi ở chat.errors, không lưu tin.</li>
 * </ol>
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class ChatRealtimeIntegrationTest {

    private static final String PASSWORD = "Matkhau@123";
    private static final String DEST_MESSAGES = "/user/queue/chat.messages";
    private static final String DEST_CONVERSATIONS = "/user/queue/chat.conversations";
    private static final String DEST_ERRORS = "/user/queue/chat.errors";
    private static final String SEND_DEST = "/app/chat.send";

    @LocalServerPort
    private int port;

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

    private final HttpClient http = HttpClient.newHttpClient();

    private WebSocketStompClient stompClient;

    @BeforeEach
    void setUp() {
        devOtpSender.reset();
        messageRepository.deleteAll();
        conversationRepository.deleteAll();
        bookPostRepository.deleteAll();
        userRepository.deleteAll();

        stompClient = new WebSocketStompClient(new StandardWebSocketClient());
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        converter.setObjectMapper(objectMapper);
        stompClient.setMessageConverter(converter);
        stompClient.setDefaultHeartbeat(new long[]{0, 0});
    }

    @AfterEach
    void stopClient() {
        if (stompClient != null) {
            stompClient.stop();
        }
    }

    @AfterAll
    void tearDown() {
        messageRepository.deleteAll();
        conversationRepository.deleteAll();
        bookPostRepository.deleteAll();
        userRepository.deleteAll();
    }

    // ------------------------------------------------------------------ tests

    @Test
    @DisplayName("B gửi -> A/B nhận tin ngay, unread live đúng, tin vẫn được lưu DB")
    void realtimeDeliveryPersistenceAndLiveUnread() throws Exception {
        String aEmail = "rt.a1@ulis.edu.vn";
        String bEmail = "rt.b1@ulis.edu.vn";
        String aToken = registerAndLogin(aEmail);
        String bToken = registerAndLogin(bEmail);
        long aId = userId(aEmail);
        long bId = userId(bEmail);
        long convId = openConversation(aToken, bId);

        StompSession a = connect(aToken);
        StompSession b = connect(bToken);

        FrameCollector<ChatMessageResponse> aMessages = subscribe(a, DEST_MESSAGES, ChatMessageResponse.class);
        FrameCollector<ChatConversationResponse> aConversations =
                subscribe(a, DEST_CONVERSATIONS, ChatConversationResponse.class);
        FrameCollector<ChatMessageResponse> bMessages = subscribe(b, DEST_MESSAGES, ChatMessageResponse.class);
        FrameCollector<ChatConversationResponse> bConversations =
                subscribe(b, DEST_CONVERSATIONS, ChatConversationResponse.class);
        waitSubscriptions();

        String content = "Realtime xin chào";
        b.send(SEND_DEST, new ChatRealtimeSendRequest(convId, content));

        // 1) Người nhận (A) thấy tin ngay.
        ChatMessageResponse aMsg = aMessages.poll();
        assertNotNull(aMsg, "A phải nhận tin realtime");
        assertEquals(convId, aMsg.getConversationId());
        assertEquals(bId, aMsg.getSenderId());
        assertEquals(content, aMsg.getContent());
        assertFalse(aMsg.getIsRead());

        // Người gửi (B) cũng nhận bản tin của chính mình (đồng bộ đa thiết bị).
        ChatMessageResponse bMsg = bMessages.poll();
        assertNotNull(bMsg, "B phải nhận bản tin của mình");
        assertEquals(aMsg.getId(), bMsg.getId());

        // 4) Unread badge live: A +1 (tin của B), B giữ 0.
        ChatConversationResponse aConv = aConversations.poll();
        assertNotNull(aConv, "A phải nhận cập nhật hội thoại");
        assertEquals(convId, aConv.getId());
        assertEquals(1L, aConv.getUnreadCount());
        assertEquals(content, aConv.getLastMessage());
        assertFalse(aConv.getIsLastFromMe());

        ChatConversationResponse bConv = bConversations.poll();
        assertNotNull(bConv, "B phải nhận cập nhật hội thoại");
        assertEquals(convId, bConv.getId());
        assertEquals(0L, bConv.getUnreadCount());
        assertEquals(content, bConv.getLastMessage());
        assertTrue(bConv.getIsLastFromMe());

        // 3) Không lệch DB: REST list thấy đúng 1 tin với nội dung vừa gửi.
        ApiResponse list = postJson("/conversations/" + convId + "/messages",
                Map.of("pageNumber", 1, "pageSize", 10), aToken);
        assertEquals(200, list.status);
        assertEquals(1, list.body.path("data").path("totalElements").asInt());
        assertEquals(content, list.body.path("data").path("content").get(0).path("content").asText());
        assertEquals(bId, list.body.path("data").path("content").get(0).path("senderId").asLong());

        // Unread REST khớp giá trị realtime đã đẩy.
        ApiResponse search = postJson("/conversations/search",
                Map.of("pageNumber", 1, "pageSize", 20), aToken);
        assertEquals(1, search.body.path("data").path("content").get(0).path("unreadCount").asInt());

        a.disconnect();
        b.disconnect();
    }

    @Test
    @DisplayName("Người ngoài hội thoại gửi realtime -> nhận chat.errors, không lưu tin")
    void outsiderGetsErrorAndNothingPersisted() throws Exception {
        String aToken = registerAndLogin("rt.a2@ulis.edu.vn");
        String bToken = registerAndLogin("rt.b2@ulis.edu.vn");
        String cToken = registerAndLogin("rt.c2@ulis.edu.vn");
        long bId = userId("rt.b2@ulis.edu.vn");
        long convId = openConversation(aToken, bId);

        StompSession a = connect(aToken);
        StompSession c = connect(cToken);
        FrameCollector<ChatMessageResponse> aMessages = subscribe(a, DEST_MESSAGES, ChatMessageResponse.class);
        FrameCollector<ChatErrorResponse> cErrors = subscribe(c, DEST_ERRORS, ChatErrorResponse.class);
        waitSubscriptions();

        c.send(SEND_DEST, new ChatRealtimeSendRequest(convId, "C xâm nhập"));

        ChatErrorResponse error = cErrors.poll();
        assertNotNull(error, "C phải nhận lỗi realtime");
        assertEquals("Bạn không có quyền truy cập hội thoại này", error.getMessage());

        assertNull(aMessages.poll(1), "A không được nhận tin từ người ngoài");
        ApiResponse list = postJson("/conversations/" + convId + "/messages",
                Map.of("pageNumber", 1, "pageSize", 10), aToken);
        assertEquals(0, list.body.path("data").path("totalElements").asInt());

        a.disconnect();
        c.disconnect();
    }

    @Test
    @DisplayName("Handshake: thiếu token hoặc token sai bị từ chối; token hợp lệ kết nối được")
    void handshakeRequiresValidJwt() throws Exception {
        assertTrue(handshakeFails(null), "Thiếu token phải bị từ chối");
        assertTrue(handshakeFails("khong-phai-jwt"), "Token rác phải bị từ chối");

        String token = registerAndLogin("rt.auth@ulis.edu.vn");
        StompSession session = connect(token);
        assertTrue(session.isConnected(), "Token hợp lệ phải kết nối được");
        session.disconnect();
    }

    // ------------------------------------------------------------------ helpers

    private boolean handshakeFails(String token) {
        try {
            StompSession session = stompClient
                    .connectAsync(wsUrl(token), new NoopSessionHandler())
                    .get(5, TimeUnit.SECONDS);
            session.disconnect();
            return false;
        } catch (Exception e) {
            return true;
        }
    }

    private StompSession connect(String token) throws Exception {
        StompSession session = stompClient
                .connectAsync(wsUrl(token), new NoopSessionHandler())
                .get(10, TimeUnit.SECONDS);
        assertTrue(session.isConnected());
        return session;
    }

    private String wsUrl(String token) {
        String base = "ws://localhost:" + port + "/ws";
        return token == null ? base
                : base + "?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
    }

    private <T> FrameCollector<T> subscribe(StompSession session, String destination, Class<T> payloadType) {
        FrameCollector<T> collector = new FrameCollector<>(payloadType);
        session.subscribe(destination, collector);
        return collector;
    }

    /** Cho broker kịp đăng ký SUBSCRIBE trước khi bên kia gửi (khác connection). */
    private void waitSubscriptions() throws InterruptedException {
        Thread.sleep(400);
    }

    private String registerAndLogin(String email) throws Exception {
        String name = titleCase(email.split("@")[0].replace(".", " ").trim());
        ApiResponse register = postJson("/auth/register",
                Map.of("email", email, "password", PASSWORD, "fullName", name), null);
        assertEquals(200, register.status, "register failed: " + register.body);

        String otp = devOtpSender.lastSent(email);
        assertNotNull(otp, "OTP dev phải có sau register");
        ApiResponse verify = postJson("/auth/otp/verify", Map.of("email", email, "otpCode", otp), null);
        assertEquals(200, verify.status, "otp verify failed: " + verify.body);

        ApiResponse login = postJson("/auth/login", Map.of("email", email, "password", PASSWORD), null);
        assertEquals(200, login.status, "login failed: " + login.body);
        return login.body.path("data").path("accessToken").asText();
    }

    private long userId(String email) {
        return userRepository.findByEmailIgnoreCase(email).orElseThrow().getId();
    }

    private long openConversation(String token, long peerId) throws Exception {
        ApiResponse response = postJson("/conversations/open", Map.of("peerId", peerId), token);
        assertEquals(200, response.status, "open conversation failed: " + response.body);
        return response.body.path("data").path("id").asLong();
    }

    private ApiResponse postJson(String path, Object body, String token) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(
                        objectMapper.writeValueAsString(body), StandardCharsets.UTF_8));
        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }
        HttpResponse<String> response = http.send(builder.build(),
                HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        JsonNode parsed = response.body() == null || response.body().isBlank()
                ? objectMapper.createObjectNode() : objectMapper.readTree(response.body());
        return new ApiResponse(response.statusCode(), parsed);
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

    private record ApiResponse(int status, JsonNode body) {
    }

    /** Thu frame đã convert thành payload kiểu mong muốn vào hàng đợi chặn. */
    private static final class FrameCollector<T> implements StompFrameHandler {

        private final Class<T> payloadType;
        private final BlockingQueue<T> frames = new LinkedBlockingQueue<>();

        private FrameCollector(Class<T> payloadType) {
            this.payloadType = payloadType;
        }

        @Override
        public Type getPayloadType(StompHeaders headers) {
            return payloadType;
        }

        @Override
        @SuppressWarnings("unchecked")
        public void handleFrame(StompHeaders headers, Object payload) {
            frames.add((T) payload);
        }

        T poll() throws InterruptedException {
            return frames.poll(5, TimeUnit.SECONDS);
        }

        T poll(long seconds) throws InterruptedException {
            return frames.poll(seconds, TimeUnit.SECONDS);
        }
    }

    /** Session handler tối giản: không cần xử lý frame ngoài các subscription. */
    private static final class NoopSessionHandler extends StompSessionHandlerAdapter {

        @Override
        public Type getPayloadType(StompHeaders headers) {
            return byte[].class;
        }

        @Override
        public void handleFrame(StompHeaders headers, Object payload) {
            // không dùng frame mặc định
        }

        @Override
        public void handleTransportError(StompSession session, Throwable exception) {
            // bỏ qua — test chủ động kiểm tra thất bại ở future/disconnect
        }

        @Override
        public void handleException(StompSession session, StompCommand command, StompHeaders headers,
                                    byte[] payload, Throwable exception) {
            // bỏ qua — lỗi ứng dụng được đẩy qua /user/queue/chat.errors
        }
    }
}

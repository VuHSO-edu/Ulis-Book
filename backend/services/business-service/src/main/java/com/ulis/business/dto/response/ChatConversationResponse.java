package com.ulis.business.dto.response;

import com.ulis.business.entity.BookPost;
import com.ulis.business.entity.ChatConversation;
import com.ulis.business.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Hội thoại trả về — khớp ChatConversationItem bên FE (mock-data.ts):
 * peer{Id,Name,Email,Msv,Faculty,Initials,AvatarBg,Online} + unreadCount +
 * lastMessage/lastMessageTime/isLastFromMe + contextBook (luôn có, trống nếu
 * hội thoại không gắn bài — FE đọc contextBook.courseCode/title).
 * Domain chưa có MSV/presence nên msv="", isOnline=false (realtime ở ticket 09).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatConversationResponse {

    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /** Bảng màu nền avatar pastel — cùng tông mock-data FE (giống SellerInfo). */
    private static final List<String> AVATAR_BG = List.of(
            "#dbe1ff", "#ffddb8", "#d3f3d3", "#ffe0ec", "#d9f0ff", "#f5e6ff", "#fff3cc", "#cfe8ff");

    private Long id;

    private Long peerId;

    private String peerName;

    private String peerEmail;

    private String peerMsv;

    private String peerFaculty;

    private String peerInitials;

    private String peerAvatarBg;

    private Integer peerReputationScore;

    private Boolean isOnline;

    private Long unreadCount;

    private String lastMessage;

    private String lastMessageTime;

    private Boolean isLastFromMe;

    private ContextBook contextBook;

    /** Nhúng context sách — khớp ChatConversationItem.contextBook. */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContextBook {
        private Long postId;
        private String courseCode;
        private String title;
        private Long price;
        private Boolean isGiveaway;
        private String condition;
        private String campusLocation;
        private String coverUrl;
    }

    public static ChatConversationResponse from(ChatConversation conversation, User viewer,
                                                long unreadCount) {
        User peer = conversation.getUserA().getId().equals(viewer.getId())
                ? conversation.getUserB() : conversation.getUserA();
        return ChatConversationResponse.builder()
                .id(conversation.getId())
                .peerId(peer.getId())
                .peerName(peer.getFullName())
                .peerEmail(peer.getEmail())
                .peerMsv("")
                .peerFaculty(peer.getFaculty() == null ? "" : peer.getFaculty())
                .peerInitials(initials(peer.getFullName()))
                .peerAvatarBg(AVATAR_BG.get(Math.floorMod(safeHash(peer.getFullName()), AVATAR_BG.size())))
                .peerReputationScore(peer.getReputationScore() == null ? 3 : peer.getReputationScore())
                .isOnline(false)
                .unreadCount(unreadCount)
                .lastMessage(conversation.getLastMessage() == null ? "" : conversation.getLastMessage())
                .lastMessageTime(formatActivity(conversation.getLastMessageAt()))
                .isLastFromMe(viewer.getId().equals(conversation.getLastSenderId()))
                .contextBook(contextOf(conversation.getPost()))
                .build();
    }

    private static ContextBook contextOf(BookPost post) {
        if (post == null) {
            return ContextBook.builder()
                    .postId(0L)
                    .courseCode("")
                    .title("")
                    .price(0L)
                    .isGiveaway(false)
                    .condition("")
                    .campusLocation("")
                    .coverUrl("")
                    .build();
        }
        return ContextBook.builder()
                .postId(post.getId())
                .courseCode(post.getCourseCode())
                .title(post.getTitle())
                .price(post.getPrice() == null ? 0L : post.getPrice().longValue())
                .isGiveaway(Boolean.TRUE.equals(post.getIsGiveaway()))
                .condition(post.getCondition() == null ? "" : post.getCondition())
                .campusLocation(post.getCampusLocation())
                .coverUrl(post.getCoverUrl() == null ? "" : post.getCoverUrl())
                .build();
    }

    /** Cùng ngày → "HH:mm"; khác ngày → "dd/MM/yyyy" (mock FE hiển thị kiểu này). */
    private static String formatActivity(LocalDateTime time) {
        if (time == null) {
            return "";
        }
        return time.toLocalDate().equals(LocalDateTime.now().toLocalDate())
                ? time.format(TIME) : time.format(DATE);
    }

    /** "Nguyễn Văn An" -> "NA"; 1 từ -> 2 ký tự đầu (giống SellerInfo). */
    private static String initials(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "?";
        }
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) {
            String p = parts[0];
            return p.length() >= 2 ? p.substring(0, 2).toUpperCase() : p.toUpperCase();
        }
        return String.valueOf(Character.toUpperCase(parts[0].charAt(0)))
                + Character.toUpperCase(parts[parts.length - 1].charAt(0));
    }

    private static int safeHash(String value) {
        return value == null ? 0 : value.hashCode();
    }
}

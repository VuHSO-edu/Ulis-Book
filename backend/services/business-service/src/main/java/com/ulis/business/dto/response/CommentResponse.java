package com.ulis.business.dto.response;

import com.ulis.business.entity.BookComment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Bình luận trả về — khớp BookCommentItem bên FE (mock-data.ts):
 * id, postId, userId, authorName, authorEmail, authorCohort, authorInitials,
 * isSeller, content, createdAt. createdAt định dạng "dd/MM/yyyy HH:mm" — cùng
 * kiểu INITIAL_COMMENTS trong mock-data FE.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {

    private static final DateTimeFormatter FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private Long id;

    private Long postId;

    private Long userId;

    private String authorName;

    private String authorEmail;

    private String authorCohort;

    private String authorInitials;

    private Boolean isSeller;

    private String content;

    private String createdAt;

    public static CommentResponse from(BookComment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPost().getId())
                .userId(comment.getAuthor().getId())
                .authorName(comment.getAuthorName())
                .authorEmail(comment.getAuthorEmail())
                .authorCohort(comment.getAuthorCohort())
                .authorInitials(comment.getAuthorInitials())
                .isSeller(comment.getIsSeller())
                .content(comment.getContent())
                .createdAt(format(comment.getCreatedAt()))
                .build();
    }

    private static String format(LocalDateTime time) {
        return time == null ? "" : time.format(FORMAT);
    }
}

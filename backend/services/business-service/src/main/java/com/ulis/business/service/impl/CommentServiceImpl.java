package com.ulis.business.service.impl;

import com.ulis.business.dto.request.CommentCreateRequest;
import com.ulis.business.dto.request.CommentListRequest;
import com.ulis.business.dto.request.CommentUpdateRequest;
import com.ulis.business.dto.response.CommentResponse;
import com.ulis.business.entity.BookComment;
import com.ulis.business.entity.BookPost;
import com.ulis.business.entity.User;
import com.ulis.business.repository.BookPostRepository;
import com.ulis.business.repository.CommentRepository;
import com.ulis.business.repository.UserRepository;
import com.ulis.business.service.CommentService;
import com.ulis.core.exception.BadRequestException;
import com.ulis.core.exception.ForbiddenException;
import com.ulis.core.exception.NotFoundException;
import com.ulis.core.helper.MessageHelper;
import com.ulis.core.model.response.PageableResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * CommentServiceImpl (ticket 07):
 * - list: công khai, mới nhất trước (createdAt DESC, id DESC), pageNumber 1-based
 *   (FE gửi 1 cho trang đầu — đừng nhầm với 0-based của Spring Pageable).
 * - create: rate limit in-memory (ConcurrentHashMap, app.comment.cooldown-seconds,
 *   mặc định 3s khớp guard 3s bên FE); denormalize author fields lúc tạo.
 * - update/delete: chỉ tác giả (403); delete = hard delete.
 * - adminDelete: xoá bất kỳ (role ADMIN được kiểm tra ở controller).
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {

    private static final int MAX_CONTENT_LENGTH = 1000;
    private static final int MAX_PAGE_SIZE = 50;

    /** Lần bình luận gần nhất của từng user (rate limit) — in-memory, đủ cho dev. */
    private final ConcurrentHashMap<Long, Instant> lastCommentAt = new ConcurrentHashMap<>();

    private final CommentRepository commentRepository;
    private final BookPostRepository postRepository;
    private final UserRepository userRepository;
    private final MessageHelper messageHelper;

    @Value("${app.comment.cooldown-seconds:3}")
    private long cooldownSeconds;

    @Override
    @Transactional(readOnly = true)
    public PageableResponse<CommentResponse> list(CommentListRequest request) {
        CommentListRequest q = request == null ? new CommentListRequest() : request;
        requirePost(q.getPostId());

        // FE gửi 1-based → Spring Pageable cần 0-based.
        int page = q.getPageNumber() == null || q.getPageNumber() <= 0 ? 0 : q.getPageNumber() - 1;
        int size = q.getPageSize() == null ? 20 : Math.min(MAX_PAGE_SIZE, Math.max(1, q.getPageSize()));

        Page<BookComment> result = commentRepository.findByPostId(q.getPostId(),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id")));

        List<CommentResponse> content = result.getContent().stream()
                .map(CommentResponse::from)
                .toList();

        return PageableResponse.<CommentResponse>builder()
                .content(content)
                .pageNumber(result.getNumber())
                .pageSize(result.getSize())
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .numberOfElements(result.getNumberOfElements())
                .build();
    }

    @Override
    public CommentResponse create(Long userId, CommentCreateRequest request) {
        // Xác thực bài đăng trước (404) — sau đó mới áp rate limit; như vậy bình
        // luận lên bài không tồn tại không bị chặn nhầm bởi cooldown.
        BookPost post = requirePost(request.getPostId());
        checkRateLimit(userId);
        User author = findAuthor(userId);

        String content = request.getContent().trim();
        if (content.length() > MAX_CONTENT_LENGTH) {
            throw new BadRequestException(messageHelper.getMessage("comment.content.length"));
        }

        LocalDateTime now = LocalDateTime.now();
        BookComment comment = BookComment.builder()
                .post(post)
                .author(author)
                .content(content)
                .authorName(author.getFullName())
                .authorEmail(author.getEmail())
                .authorCohort(buildCohort(author))
                .authorInitials(initials(author.getFullName()))
                .isSeller(isSeller(author, post))
                .createdAt(now)
                .updatedAt(now)
                .createdBy(author.getEmail())
                .updatedBy(author.getEmail())
                .build();

        commentRepository.save(comment);
        log.info("Created comment id={} on post id={} by user id={}", comment.getId(), post.getId(), userId);
        return CommentResponse.from(comment);
    }

    @Override
    public CommentResponse update(Long userId, Long commentId, CommentUpdateRequest request) {
        BookComment comment = requireComment(commentId);
        requireAuthor(comment, userId);

        String content = request.getContent().trim();
        if (content.length() > MAX_CONTENT_LENGTH) {
            throw new BadRequestException(messageHelper.getMessage("comment.content.length"));
        }
        comment.setContent(content);
        comment.setUpdatedAt(LocalDateTime.now());
        comment.setUpdatedBy(comment.getAuthor().getEmail());
        commentRepository.save(comment);
        log.info("Updated comment id={} by user id={}", commentId, userId);
        return CommentResponse.from(comment);
    }

    @Override
    public void delete(Long userId, Long commentId) {
        BookComment comment = requireComment(commentId);
        requireAuthor(comment, userId);
        commentRepository.delete(comment);
        log.info("Deleted comment id={} by user id={}", commentId, userId);
    }

    @Override
    public void adminDelete(Long commentId) {
        BookComment comment = requireComment(commentId);
        commentRepository.delete(comment);
        log.info("Admin deleted comment id={}", commentId);
    }

    // ------------------------------------------------------------------ helpers

    private void checkRateLimit(Long userId) {
        Instant now = Instant.now();
        Instant previous = lastCommentAt.get(userId);
        if (previous != null && Duration.between(previous, now).toMillis()
                < Math.max(0, cooldownSeconds) * 1000L) {
            throw new BadRequestException(messageHelper.getMessage("comment.rateLimit"));
        }
        lastCommentAt.put(userId, now);
    }

    private BookComment requireComment(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("comment.notFound")));
    }

    private void requireAuthor(BookComment comment, Long userId) {
        if (!comment.getAuthor().getId().equals(userId)) {
            throw new ForbiddenException(messageHelper.getMessage("comment.ownerMismatch"));
        }
    }

    private BookPost requirePost(Long postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("bookPost.notFound")));
    }

    private User findAuthor(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("auth.user.notFound")));
    }

    /** Tác giả chính là người bán bài đăng? (isSeller bên FE). */
    private boolean isSeller(User author, BookPost post) {
        return author.getId().equals(post.getOwner().getId());
    }

    /** Cohort: "QH-{year} · {faculty hoặc ULIS}" — năm theo thời điểm tạo tài khoản. */
    private String buildCohort(User author) {
        int year = author.getCreatedAt() == null ? LocalDateTime.now().getYear() : author.getCreatedAt().getYear();
        String faculty = author.getFaculty() == null || author.getFaculty().isBlank()
                ? "ULIS" : author.getFaculty().trim();
        return "QH-" + year + " · " + faculty;
    }

    /** "Nguyễn Văn An" -> "NA"; 1 từ -> 2 ký tự đầu (giống SellerInfo.initials). */
    private String initials(String fullName) {
        if (fullName == null || fullName.isBlank()) {
            return "SV";
        }
        String[] parts = fullName.trim().split("\\s+");
        if (parts.length == 1) {
            String p = parts[0];
            return p.length() >= 2 ? p.substring(0, 2).toUpperCase() : p.toUpperCase();
        }
        return String.valueOf(Character.toUpperCase(parts[0].charAt(0)))
                + Character.toUpperCase(parts[parts.length - 1].charAt(0));
    }
}

package com.ulis.business.service.impl;

import com.ulis.business.constants.BookPostConstants;
import com.ulis.business.dto.request.BookCreateRequest;
import com.ulis.business.dto.request.BookPostUpsertFields;
import com.ulis.business.dto.request.BookSearchRequest;
import com.ulis.business.dto.request.BookUpdateRequest;
import com.ulis.business.dto.response.BookPostResponse;
import com.ulis.business.domain.BookPostStatusMachine;
import com.ulis.business.entity.BookCategory;
import com.ulis.business.entity.BookPost;
import com.ulis.business.entity.BookPostImage;
import com.ulis.business.entity.User;
import com.ulis.business.enums.BookPostStatus;
import com.ulis.business.enums.BookPostStatusTrigger;
import com.ulis.business.repository.BookPostRepository;
import com.ulis.business.repository.UserRepository;
import com.ulis.business.service.BookCategoryService;
import com.ulis.business.service.BookPostService;
import com.ulis.core.exception.BadRequestException;
import com.ulis.core.exception.ForbiddenException;
import com.ulis.core.exception.NotFoundException;
import com.ulis.core.helper.MessageHelper;
import com.ulis.core.model.response.PageableResponse;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * BookPostServiceImpl (ticket 04 + 05):
 * - status tự suy: quantity > 0 → SELLING, else SOLD (khớp fallback FE).
 * - state machine (BookPostStatusMachine): mọi chuyển trạng thái đều được xác
 *   minh — BANNED bị khoá (không update/sold/delete), markSold chỉ từ SELLING.
 * - tặng (giveaway) → price = 0.
 * - code unique (không phân biệt hoa thường); rỗng → sinh POST_XXXX.
 * - update/sold/delete chỉ chủ bài; vi phạm → ForbiddenException (403).
 * - delete = xoá mềm → HIDDEN (khớp FE). Bài hết hạn do job xử lý (EXPIRE).
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class BookPostServiceImpl implements BookPostService {

    private static final int MAX_IMAGES = 3;

    private final BookPostRepository postRepository;
    private final UserRepository userRepository;
    private final BookCategoryService categoryService;
    private final MessageHelper messageHelper;

    @Override
    public BookPostResponse create(Long userId, BookCreateRequest request) {
        User owner = findOwner(userId);
        BookPost post = new BookPost();
        post.setOwner(owner);
        applyRequest(post, request, null);

        BookPostStatus targetStatus = statusForQuantity(post.getQuantity());
        requireTransition(post, targetStatus, BookPostStatusTrigger.CREATE);

        LocalDateTime now = LocalDateTime.now();
        post.setStatus(targetStatus);
        post.setViewCount(0);
        post.setCreatedAt(now);
        post.setUpdatedAt(now);
        post.setExpiredAt(now.plusDays(BookPostConstants.EXPIRE_AFTER_DAYS));
        post.setCreatedBy(owner.getEmail());
        post.setUpdatedBy(owner.getEmail());

        postRepository.save(post);
        log.info("Created book post id={} code={} by user id={}", post.getId(), post.getCode(), userId);
        return BookPostResponse.from(post);
    }

    @Override
    public BookPostResponse update(Long userId, Long postId, BookUpdateRequest request) {
        BookPost post = requireOwner(postId, userId);
        applyRequest(post, request, postId);

        String coverUrl = request.getCoverUrl();
        List<String> urls = resolveImages(request.getImages(), coverUrl);
        post.setCoverUrl(resolveCover(coverUrl, urls));
        post.getImages().clear();
        post.getImages().addAll(toImageEntities(post, urls));

        BookPostStatus targetStatus = statusForQuantity(post.getQuantity());
        requireTransition(post, targetStatus, BookPostStatusTrigger.UPDATE);
        post.setStatus(targetStatus);
        post.setUpdatedAt(LocalDateTime.now());
        post.setUpdatedBy(post.getOwner().getEmail());

        postRepository.save(post);
        log.info("Updated book post id={} by user id={}", postId, userId);
        return BookPostResponse.from(post);
    }

    @Override
    public BookPostResponse markSold(Long userId, Long postId) {
        BookPost post = requireOwner(postId, userId);
        requireTransition(post, BookPostStatus.SOLD, BookPostStatusTrigger.MARK_SOLD);
        post.setStatus(BookPostStatus.SOLD);
        post.setQuantity(0);
        post.setUpdatedAt(LocalDateTime.now());
        post.setUpdatedBy(post.getOwner().getEmail());
        postRepository.save(post);
        log.info("Marked sold book post id={} by user id={}", postId, userId);
        return BookPostResponse.from(post);
    }

    @Override
    public void delete(Long userId, Long postId) {
        BookPost post = requireOwner(postId, userId);
        requireTransition(post, BookPostStatus.HIDDEN, BookPostStatusTrigger.DELETE);
        post.setStatus(BookPostStatus.HIDDEN);
        post.setUpdatedAt(LocalDateTime.now());
        post.setUpdatedBy(post.getOwner().getEmail());
        postRepository.save(post);
        log.info("Soft-deleted (HIDDEN) book post id={} by user id={}", postId, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookPostResponse> myPosts(Long userId) {
        return postRepository.findByOwnerIdOrderByCreatedAtDesc(userId).stream()
                .map(BookPostResponse::from)
                .toList();
    }

    @Override
    public BookPostResponse detail(Long postId) {
        BookPost post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("bookPost.notFound")));
        post.setViewCount((post.getViewCount() == null ? 0 : post.getViewCount()) + 1);
        postRepository.save(post);
        return BookPostResponse.from(post);
    }

    @Override
    @Transactional(readOnly = true)
    public PageableResponse<BookPostResponse> search(BookSearchRequest request) {
        BookSearchRequest q = request == null ? new BookSearchRequest() : request;
        // FE gửi pageNumber 1-based (mặc định 1) — quy về 0-based cho Spring Pageable.
        int page = q.getPageNumber() == null || q.getPageNumber() <= 0 ? 0 : q.getPageNumber() - 1;
        int size = q.getPageSize() == null ? 20 : Math.min(50, Math.max(1, q.getPageSize()));

        Page<BookPost> result = postRepository.findAll(
                buildSpec(q), PageRequest.of(page, size, buildSort(q.getSortBy())));

        List<BookPostResponse> content = result.getContent().stream()
                .map(BookPostResponse::from)
                .toList();

        return PageableResponse.<BookPostResponse>builder()
                .content(content)
                .pageNumber(result.getNumber())
                .pageSize(result.getSize())
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .numberOfElements(result.getNumberOfElements())
                .build();
    }

    // ------------------------------------------------------------------ helpers

    private void applyRequest(BookPost post, BookPostUpsertFields req, Long selfId) {
        post.setCode(resolveCode(req.getCode(), selfId));
        post.setTitle(req.getTitle().trim());
        post.setCourseCode(req.getCourseCode().trim().toUpperCase());

        BookCategory type = categoryService.requireActiveCategory(req.getBookTypeCode().trim());
        BookCategory faculty = categoryService.requireActiveCategory(req.getFacultyCode().trim());
        post.setBookTypeCode(type.getCode());
        post.setBookTypeName(type.getName());
        post.setFacultyCode(faculty.getCode());
        post.setFacultyName(faculty.getName());

        boolean giveaway = Boolean.TRUE.equals(req.getIsGiveaway());
        BigDecimal price = giveaway ? BigDecimal.ZERO : nz(req.getPrice());
        BigDecimal originalPrice = nz(req.getOriginalPrice());
        if (originalPrice.signum() == 0) {
            originalPrice = price;
        }
        post.setIsGiveaway(giveaway || price.signum() == 0);
        post.setPrice(price);
        post.setOriginalPrice(originalPrice);

        int quantity = req.getQuantity() == null ? 1 : Math.max(0, req.getQuantity());
        post.setQuantity(quantity);

        String condition = req.getCondition().trim();
        post.setCondition(condition);
        post.setConditionBadge(toBadge(condition));

        post.setCampusLocation(req.getCampusLocation().trim());
        post.setDescription(req.getDescription().trim());

        String coverUrl = req.getCoverUrl();
        List<String> urls = resolveImages(req.getImages(), coverUrl);
        post.setCoverUrl(resolveCover(coverUrl, urls));
        if (post.getId() == null) {
            post.setImages(toImageEntities(post, urls));
        }
    }

    /** Trả về code hợp lệ (uppercase); 400 nếu trùng (create/update của bài khác). */
    private String resolveCode(String requested, Long selfId) {
        String code = requested == null ? "" : requested.trim().toUpperCase();
        if (!code.isEmpty()) {
            boolean taken = selfId == null
                    ? postRepository.existsByCodeIgnoreCase(code)
                    : postRepository.existsByCodeIgnoreCaseAndIdNot(code, selfId);
            if (taken) {
                throw new BadRequestException(messageHelper.getMessage("bookPost.code.taken"));
            }
            return code;
        }
        return generateUniqueCode();
    }

    private String generateUniqueCode() {
        Random random = new Random();
        for (int i = 0; i < 20; i++) {
            String candidate = String.format("POST_%04d", random.nextInt(9000) + 1000);
            if (!postRepository.existsByCodeIgnoreCase(candidate)) {
                return candidate;
            }
        }
        return String.format("POST_%04d", System.currentTimeMillis() % 10000);
    }

    private List<String> resolveImages(List<String> images, String coverUrl) {
        List<String> urls = images == null ? List.of()
                : images.stream().map(s -> s == null ? "" : s.trim())
                        .filter(s -> !s.isBlank())
                        .distinct()
                        .toList();
        if (urls.size() > MAX_IMAGES) {
            throw new BadRequestException(messageHelper.getMessage("bookPost.images.limit", MAX_IMAGES));
        }
        if (urls.isEmpty()) {
            if (hasText(coverUrl)) {
                urls = List.of(coverUrl.trim());
            } else {
                urls = List.of(BookPostConstants.DEFAULT_COVER_URL);
            }
        }
        return urls;
    }

    private String resolveCover(String coverUrl, List<String> urls) {
        if (hasText(coverUrl)) {
            return coverUrl.trim();
        }
        return urls.isEmpty() ? BookPostConstants.DEFAULT_COVER_URL : urls.get(0);
    }

    private List<BookPostImage> toImageEntities(BookPost post, List<String> urls) {
        List<BookPostImage> images = new ArrayList<>();
        for (int i = 0; i < urls.size(); i++) {
            images.add(BookPostImage.builder()
                    .url(urls.get(i))
                    .sortOrder(i)
                    .post(post)
                    .build());
        }
        return images;
    }

    /** FE hiển thị badge = condition.slice(0, 28). */
    private String toBadge(String condition) {
        String t = condition == null ? "" : condition.trim();
        return t.length() <= 28 ? t : t.substring(0, 28);
    }

    private BookPost requireOwner(Long postId, Long userId) {
        BookPost post = postRepository.findById(postId)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("bookPost.notFound")));
        if (!post.getOwner().getId().equals(userId)) {
            throw new ForbiddenException(messageHelper.getMessage("bookPost.ownerMismatch"));
        }
        return post;
    }

    private User findOwner(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("auth.user.notFound")));
    }

    /** Đích trạng thái theo số lượng còn lại — quantity = 0 → SOLD (auto). */
    private BookPostStatus statusForQuantity(int quantity) {
        return quantity > 0 ? BookPostStatus.SELLING : BookPostStatus.SOLD;
    }

    /** Chặn chuyển trạng thái trái phép (state machine) → 400. */
    private void requireTransition(BookPost post, BookPostStatus target,
                                   BookPostStatusTrigger trigger) {
        if (!BookPostStatusMachine.isAllowed(post.getStatus(), target, trigger)) {
            throw new BadRequestException(messageHelper.getMessage(
                    "bookPost.status.invalid", post.getStatus(), target));
        }
    }

    private BigDecimal nz(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    // ------------------------------------------------------------------ search spec

    private Specification<BookPost> buildSpec(BookSearchRequest q) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(root.get("status").in((Object[]) BookPostConstants.PUBLIC_STATUSES));

            if (hasText(q.getKeyword())) {
                String kw = "%" + q.getKeyword().trim().toLowerCase() + "%";
                Join<BookPost, User> owner = root.join("owner");
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), kw),
                        cb.like(cb.lower(root.get("courseCode")), kw),
                        cb.like(cb.lower(root.get("facultyName")), kw),
                        cb.like(cb.lower(root.get("bookTypeName")), kw),
                        cb.like(cb.lower(root.get("description")), kw),
                        cb.like(cb.lower(owner.get("fullName")), kw)));
            }
            if (hasText(q.getFacultyCode())) {
                predicates.add(cb.equal(root.get("facultyCode"), q.getFacultyCode()));
            }
            if (hasText(q.getBookTypeCode())) {
                predicates.add(cb.equal(root.get("bookTypeCode"), q.getBookTypeCode()));
            }
            if (hasText(q.getCampusLocation())) {
                predicates.add(cb.equal(root.get("campusLocation"), q.getCampusLocation()));
            }
            if (Boolean.TRUE.equals(q.getOnlyGiveaway())) {
                predicates.add(cb.isTrue(root.get("isGiveaway")));
            }
            if (q.getMinPrice() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), q.getMinPrice()));
            }
            if (q.getMaxPrice() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), q.getMaxPrice()));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private Sort buildSort(String sortBy) {
        String s = sortBy == null ? "" : sortBy.trim();
        return switch (s) {
            case "cheapest" -> Sort.by(Sort.Direction.ASC, "price")
                    .and(Sort.by(Sort.Direction.ASC, "id"));
            case "mostViewed" -> Sort.by(Sort.Direction.DESC, "viewCount")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
            default -> Sort.by(Sort.Direction.DESC, "createdAt")
                    .and(Sort.by(Sort.Direction.DESC, "id"));
        };
    }
}

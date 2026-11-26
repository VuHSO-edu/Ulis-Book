package com.ulis.business.controller;

import com.ulis.business.dto.response.BookPostResponse;
import com.ulis.business.entity.BookPost;
import com.ulis.business.entity.CartItem;
import com.ulis.business.repository.BookPostRepository;
import com.ulis.business.repository.CartItemRepository;
import com.ulis.business.security.SecurityUtils;
import com.ulis.core.exception.NotFoundException;
import com.ulis.core.helper.MessageHelper;
import com.ulis.core.http.ResponseBuilder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Chức năng Giỏ hàng gom nhóm theo Người bán (TASK-08).
 */
@RestController
@RequestMapping("/cart")
@Tag(name = "CartController", description = "Giỏ hàng gom nhóm theo người bán")
@RequiredArgsConstructor
@Transactional
public class CartController {

    private final CartItemRepository cartItemRepository;
    private final BookPostRepository bookPostRepository;
    private final MessageHelper messageHelper;

    @Data
    public static class AddToCartRequest {
        @NotNull
        private Long bookPostId;
        private Integer quantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CartItemDto {
        private Long id;
        private Integer quantity;
        private BookPostResponse book;
    }

    @GetMapping
    @Transactional(readOnly = true)
    @Operation(summary = "Danh sách sách trong giỏ hàng của người dùng hiện tại")
    public ResponseEntity<Object> listCart() {
        Long userId = SecurityUtils.currentUser().getId();
        List<CartItemDto> list = cartItemRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(c -> CartItemDto.builder()
                        .id(c.getId())
                        .quantity(c.getQuantity())
                        .book(BookPostResponse.from(c.getBookPost()))
                        .build())
                .toList();
        return ResponseBuilder.ok(list);
    }

    @PostMapping("/add")
    @Operation(summary = "Thêm sách vào giỏ hàng")
    public ResponseEntity<Object> addToCart(@Valid @RequestBody AddToCartRequest req) {
        Long userId = SecurityUtils.currentUser().getId();
        BookPost post = bookPostRepository.findById(req.getBookPostId())
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("bookPost.notFound")));

        int addQty = req.getQuantity() == null || req.getQuantity() <= 0 ? 1 : req.getQuantity();
        CartItem item = cartItemRepository.findByUserIdAndBookPostId(userId, post.getId())
                .orElse(null);

        if (item == null) {
            item = CartItem.builder()
                    .userId(userId)
                    .bookPost(post)
                    .quantity(Math.min(addQty, Math.max(1, post.getQuantity())))
                    .createdAt(LocalDateTime.now())
                    .build();
        } else {
            int maxAvail = post.getQuantity() == null || post.getQuantity() <= 0 ? 1 : post.getQuantity();
            item.setQuantity(Math.min(maxAvail, item.getQuantity() + addQty));
        }
        cartItemRepository.save(item);

        CartItemDto dto = CartItemDto.builder()
                .id(item.getId())
                .quantity(item.getQuantity())
                .book(BookPostResponse.from(post))
                .build();
        return ResponseBuilder.ok(dto, messageHelper.getMessage("cart.added"));
    }

    @DeleteMapping("/{bookPostId}")
    @Operation(summary = "Xóa một cuốn sách khỏi giỏ hàng")
    public ResponseEntity<Object> removeFromCart(@PathVariable Long bookPostId) {
        Long userId = SecurityUtils.currentUser().getId();
        cartItemRepository.findByUserIdAndBookPostId(userId, bookPostId)
                .ifPresent(cartItemRepository::delete);
        return ResponseBuilder.ok(Map.of("bookPostId", bookPostId), messageHelper.getMessage("cart.removed"));
    }
}

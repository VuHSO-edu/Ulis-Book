package com.ulis.business.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ulis.business.entity.BookPost;
import com.ulis.business.entity.ChatConversation;
import com.ulis.business.entity.ChatMessage;
import com.ulis.business.entity.Invoice;
import com.ulis.business.entity.InvoiceItem;
import com.ulis.business.entity.User;
import com.ulis.business.enums.BookPostStatus;
import com.ulis.business.enums.InvoiceStatus;
import com.ulis.business.repository.BookPostRepository;
import com.ulis.business.repository.CartItemRepository;
import com.ulis.business.repository.ConversationRepository;
import com.ulis.business.repository.InvoiceRepository;
import com.ulis.business.repository.MessageRepository;
import com.ulis.business.repository.UserRepository;
import com.ulis.business.security.SecurityUtils;
import com.ulis.business.service.impl.NextBookMailHelper;
import com.ulis.core.exception.BadRequestException;
import com.ulis.core.exception.ForbiddenException;
import com.ulis.core.exception.NotFoundException;
import com.ulis.core.helper.MessageHelper;
import com.ulis.core.http.ResponseBuilder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Luồng Tạo Hóa Đơn 4 Bước trong Chat, Gửi Mail & Nhắc nhở tối đa 3 lần (TASK-01)
 * + Hệ thống Đánh giá Độ Uy Tín (1-5) & Cảnh báo dưới 3 (TASK-02).
 */
@RestController
@RequestMapping("/invoices")
@Tag(name = "InvoiceController", description = "Hóa đơn 4 bước trong Chat & Uy tín giao dịch")
@RequiredArgsConstructor
@Transactional
public class InvoiceController {

    private static final int MAX_REMINDERS = 3;
    private static final AtomicLong INV_SEQ = new AtomicLong(1000L);
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final InvoiceRepository invoiceRepository;
    private final BookPostRepository bookPostRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final NextBookMailHelper mailHelper;
    private final MessageHelper messageHelper;
    private final ObjectMapper objectMapper;

    @Data
    public static class CreateInvoiceItemReq {
        @NotNull
        private Long bookPostId;
        private Integer quantity;
        private BigDecimal agreedPrice;
    }

    @Data
    public static class CreateInvoiceRequest {
        @NotNull
        private Long conversationId;
        @NotNull
        private Long buyerId;
        @NotEmpty
        private List<CreateInvoiceItemReq> items;
        private String meetLocation;
        private String meetTime;
        private String note;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvoiceItemDto {
        private Long bookPostId;
        private String bookCode;
        private String bookTitle;
        private String courseCode;
        private String coverUrl;
        private Integer quantity;
        private Long unitPrice;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvoiceDto {
        private Long id;
        private String invoiceCode;
        private Long conversationId;
        private Long sellerId;
        private String sellerName;
        private String sellerEmail;
        private Integer sellerReputation;
        private Long buyerId;
        private String buyerName;
        private String buyerEmail;
        private Integer buyerReputation;
        private Long totalAmount;
        private String meetLocation;
        private String meetTime;
        private String note;
        private String status;
        private Integer reminderCount;
        private Integer maxReminders;
        private String lastReminderAt;
        private String createdAt;
        private String completedAt;
        private List<InvoiceItemDto> items;
    }

    @GetMapping("/conversation/{conversationId}")
    @Transactional(readOnly = true)
    @Operation(summary = "Danh sách hóa đơn trong một cuộc hội thoại")
    public ResponseEntity<Object> byConversation(@PathVariable Long conversationId) {
        List<InvoiceDto> list = invoiceRepository
                .findByConversationIdOrderByCreatedAtDesc(conversationId)
                .stream()
                .map(this::toDto)
                .toList();
        return ResponseBuilder.ok(list);
    }

    @GetMapping("/my")
    @Transactional(readOnly = true)
    @Operation(summary = "Lịch sử hóa đơn mua & bán của tôi (TASK-10)")
    public ResponseEntity<Object> myInvoices() {
        Long uid = SecurityUtils.currentUser().getId();
        List<InvoiceDto> list = invoiceRepository
                .findBySellerIdOrBuyerIdOrderByCreatedAtDesc(uid, uid)
                .stream()
                .map(this::toDto)
                .toList();
        return ResponseBuilder.ok(list);
    }

    @GetMapping("/seller-books")
    @Transactional(readOnly = true)
    @Operation(summary = "Bước 1: Lấy danh sách sách đang SELLING của người bán trong khung chat")
    public ResponseEntity<Object> sellerSellingBooks(@RequestParam Long sellerId) {
        var books = bookPostRepository.findByOwnerIdOrderByCreatedAtDesc(sellerId).stream()
                .filter(b -> b.getStatus() == BookPostStatus.SELLING && b.getQuantity() != null && b.getQuantity() > 0)
                .map(com.ulis.business.dto.response.BookPostResponse::from)
                .toList();
        return ResponseBuilder.ok(books);
    }

    @PostMapping("/create")
    @Operation(summary = "Bước 2 & 3: Người bán chốt Hóa đơn -> Xuất thẻ Invoice Card vào Chat + Gửi Email cho Người mua")
    public ResponseEntity<Object> createInvoice(@Valid @RequestBody CreateInvoiceRequest req) {
        Long currentUserId = SecurityUtils.currentUser().getId();
        ChatConversation conv = conversationRepository.findById(req.getConversationId())
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("conversation.notFound")));

        User seller = userRepository.findById(currentUserId)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("auth.user.notFound")));
        User buyer = userRepository.findById(req.getBuyerId())
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("auth.user.notFound")));

        LocalDateTime now = LocalDateTime.now();
        String code = String.format("INV-%05d", INV_SEQ.incrementAndGet());

        Invoice invoice = Invoice.builder()
                .invoiceCode(code)
                .conversationId(conv.getId())
                .seller(seller)
                .buyer(buyer)
                .meetLocation(req.getMeetLocation() == null ? "Sảnh A1 ULIS" : req.getMeetLocation().trim())
                .meetTime(req.getMeetTime() == null ? "Theo lịch hẹn trong chat" : req.getMeetTime().trim())
                .note(req.getNote() == null ? "" : req.getNote().trim())
                .status(InvoiceStatus.CONFIRMED_BY_SELLER)
                .reminderCount(0)
                .createdAt(now)
                .items(new ArrayList<>())
                .build();

        BigDecimal total = BigDecimal.ZERO;
        List<Long> purchasedIds = new ArrayList<>();

        for (CreateInvoiceItemReq itemReq : req.getItems()) {
            BookPost post = bookPostRepository.findById(itemReq.getBookPostId())
                    .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("bookPost.notFound")));
            int qty = itemReq.getQuantity() == null || itemReq.getQuantity() <= 0 ? 1 : itemReq.getQuantity();
            BigDecimal unitPrice = itemReq.getAgreedPrice() != null
                    ? itemReq.getAgreedPrice()
                    : (Boolean.TRUE.equals(post.getIsGiveaway()) ? BigDecimal.ZERO : post.getPrice());

            InvoiceItem entityItem = InvoiceItem.builder()
                    .invoice(invoice)
                    .bookPostId(post.getId())
                    .bookCode(post.getCode())
                    .bookTitle(post.getTitle())
                    .courseCode(post.getCourseCode())
                    .coverUrl(post.getCoverUrl())
                    .quantity(qty)
                    .unitPrice(unitPrice)
                    .build();
            invoice.getItems().add(entityItem);
            total = total.add(unitPrice.multiply(BigDecimal.valueOf(qty)));
            purchasedIds.add(post.getId());
        }

        invoice.setTotalAmount(total);
        invoiceRepository.save(invoice);

        // Xóa khỏi giỏ hàng của người mua các cuốn đã lên hóa đơn
        if (!purchasedIds.isEmpty()) {
            cartItemRepository.deleteByUserIdAndBookPostIdIn(buyer.getId(), purchasedIds);
        }

        InvoiceDto dto = toDto(invoice);
        String payloadJson = "";
        try {
            payloadJson = objectMapper.writeValueAsString(dto);
        } catch (Exception ignored) {
        }

        // Tạo tin nhắn INVOICE_CARD trong luồng Chat
        String summaryMsg = String.format(
                "🧾 [HÓA ĐƠN #%s] Đã chốt %d cuốn sách · Tổng cộng: %,d đ · Điểm hẹn: %s (%s). Đã gửi email xác nhận tới %s.",
                invoice.getInvoiceCode(),
                invoice.getItems().size(),
                total.longValue(),
                invoice.getMeetLocation(),
                invoice.getMeetTime(),
                buyer.getEmail());

        ChatMessage chatMsg = ChatMessage.builder()
                .conversation(conv)
                .sender(seller)
                .content(summaryMsg)
                .isRead(false)
                .messageType("INVOICE_CARD")
                .invoiceId(invoice.getId())
                .invoicePayload(payloadJson)
                .createdAt(now)
                .createdBy(seller.getEmail())
                .build();
        messageRepository.save(chatMsg);

        conv.setLastMessage(summaryMsg);
        conv.setLastMessageAt(now);
        conv.setLastSenderId(seller.getId());
        conv.setUpdatedAt(now);
        conversationRepository.save(conv);

        // Bước 3: Gửi email xác nhận hóa đơn cho người mua
        mailHelper.sendInvoiceCreatedEmail(invoice);

        return ResponseBuilder.ok(dto, messageHelper.getMessage("invoice.created"));
    }

    @PostMapping("/{id}/remind")
    @Operation(summary = "Bước 4: Nhắc nhở người mua bấm xác nhận hóa đơn (Tối đa 3 lần)")
    public ResponseEntity<Object> remindBuyer(@PathVariable Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hóa đơn"));
        if (invoice.getStatus() != InvoiceStatus.CONFIRMED_BY_SELLER) {
            throw new BadRequestException("Chỉ có thể nhắc nhở hóa đơn đang chờ người mua xác nhận");
        }
        int currentCount = invoice.getReminderCount() == null ? 0 : invoice.getReminderCount();
        if (currentCount >= MAX_REMINDERS) {
            throw new BadRequestException(messageHelper.getMessage("invoice.reminder.limit"));
        }

        int nextCount = currentCount + 1;
        LocalDateTime now = LocalDateTime.now();
        invoice.setReminderCount(nextCount);
        invoice.setLastReminderAt(now);
        invoiceRepository.save(invoice);

        InvoiceDto dto = toDto(invoice);
        updateInvoiceMessagePayload(invoice, dto);

        // Gửi tin nhắn nhắc nhở trong Chat + Email nhắc nhở
        conversationRepository.findById(invoice.getConversationId()).ifPresent(conv -> {
            String remindText = String.format(
                    "🔔 [Nhắc nhở lần %d/%d] Bạn %s ơi, vui lòng kiểm tra và bấm xác nhận hoàn tất cho Hóa đơn #%s nhé!",
                    nextCount, MAX_REMINDERS, invoice.getBuyer().getFullName(), invoice.getInvoiceCode());
            ChatMessage msg = ChatMessage.builder()
                    .conversation(conv)
                    .sender(invoice.getSeller())
                    .content(remindText)
                    .isRead(false)
                    .messageType("INVOICE_REMINDER")
                    .invoiceId(invoice.getId())
                    .createdAt(now)
                    .createdBy(invoice.getSeller().getEmail())
                    .build();
            messageRepository.save(msg);
            conv.setLastMessage(remindText);
            conv.setLastMessageAt(now);
            conv.setLastSenderId(invoice.getSeller().getId());
            conversationRepository.save(conv);
        });

        mailHelper.sendInvoiceReminderEmail(invoice);
        return ResponseBuilder.ok(dto, messageHelper.getMessage("invoice.reminded"));
    }

    @PutMapping("/{id}/complete")
    @Operation(summary = "Người mua xác nhận Đã nhận sách & Hoàn tất -> Cộng +1 điểm uy tín (max 5) & trừ tồn kho")
    public ResponseEntity<Object> completeInvoice(@PathVariable Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hóa đơn"));
        if (invoice.getStatus() != InvoiceStatus.CONFIRMED_BY_SELLER) {
            throw new BadRequestException("Hóa đơn đã được xử lý trước đó");
        }

        LocalDateTime now = LocalDateTime.now();
        invoice.setStatus(InvoiceStatus.COMPLETED);
        invoice.setCompletedAt(now);
        invoiceRepository.save(invoice);

        // Trừ số lượng sách, về 0 -> tự chuyển sang SOLD
        for (InvoiceItem item : invoice.getItems()) {
            bookPostRepository.findById(item.getBookPostId()).ifPresent(post -> {
                int currentQty = post.getQuantity() == null ? 1 : post.getQuantity();
                int remain = Math.max(0, currentQty - item.getQuantity());
                post.setQuantity(remain);
                if (remain == 0) {
                    post.setStatus(BookPostStatus.SOLD);
                }
                post.setUpdatedAt(now);
                bookPostRepository.save(post);
            });
        }

        // TASK-02: Cộng +1 điểm uy tín cho cả người bán và người mua (tối đa 5)
        adjustReputation(invoice.getSeller(), +1);
        adjustReputation(invoice.getBuyer(), +1);

        InvoiceDto dto = toDto(invoice);
        updateInvoiceMessagePayload(invoice, dto);

        return ResponseBuilder.ok(dto, messageHelper.getMessage("invoice.completed"));
    }

    @PutMapping("/{id}/fail")
    @Operation(summary = "Giao dịch không hoàn thành / Hủy giao dịch -> Trừ -1 điểm uy tín (min 1)")
    public ResponseEntity<Object> failInvoice(@PathVariable Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy hóa đơn"));
        if (invoice.getStatus() != InvoiceStatus.CONFIRMED_BY_SELLER) {
            throw new BadRequestException("Hóa đơn đã được xử lý trước đó");
        }
        Long currentUserId = SecurityUtils.currentUser().getId();
        if (!invoice.getSeller().getId().equals(currentUserId)
                && !invoice.getBuyer().getId().equals(currentUserId)) {
            throw new ForbiddenException(messageHelper.getMessage("conversation.accessDenied"));
        }

        LocalDateTime now = LocalDateTime.now();
        invoice.setStatus(InvoiceStatus.FAILED);
        invoice.setCompletedAt(now);
        invoiceRepository.save(invoice);

        // TASK-02: Không hoàn thành -> Trừ -1 điểm uy tín (tối thiểu 1)
        adjustReputation(invoice.getSeller(), -1);
        adjustReputation(invoice.getBuyer(), -1);

        InvoiceDto dto = toDto(invoice);
        updateInvoiceMessagePayload(invoice, dto);

        return ResponseBuilder.ok(dto, messageHelper.getMessage("invoice.failed"));
    }

    private void adjustReputation(User user, int delta) {
        int current = user.getReputationScore() == null ? 3 : user.getReputationScore();
        int next = Math.max(1, Math.min(5, current + delta));
        user.setReputationScore(next);
        userRepository.save(user);
    }

    private void updateInvoiceMessagePayload(Invoice invoice, InvoiceDto dto) {
        try {
            String json = objectMapper.writeValueAsString(dto);
            List<ChatMessage> msgs = messageRepository
                    .findByConversationId(invoice.getConversationId(), org.springframework.data.domain.Pageable.unpaged())
                    .getContent();
            for (ChatMessage m : msgs) {
                if (invoice.getId().equals(m.getInvoiceId()) && "INVOICE_CARD".equals(m.getMessageType())) {
                    m.setInvoicePayload(json);
                    messageRepository.save(m);
                }
            }
        } catch (Exception ignored) {
        }
    }

    public InvoiceDto toDto(Invoice inv) {
        List<InvoiceItemDto> itemDtos = inv.getItems().stream()
                .map(i -> InvoiceItemDto.builder()
                        .bookPostId(i.getBookPostId())
                        .bookCode(i.getBookCode())
                        .bookTitle(i.getBookTitle())
                        .courseCode(i.getCourseCode())
                        .coverUrl(i.getCoverUrl())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice() == null ? 0L : i.getUnitPrice().longValue())
                        .build())
                .toList();

        User seller = inv.getSeller();
        User buyer = inv.getBuyer();
        return InvoiceDto.builder()
                .id(inv.getId())
                .invoiceCode(inv.getInvoiceCode())
                .conversationId(inv.getConversationId())
                .sellerId(seller.getId())
                .sellerName(seller.getFullName())
                .sellerEmail(seller.getEmail())
                .sellerReputation(seller.getReputationScore() == null ? 3 : seller.getReputationScore())
                .buyerId(buyer.getId())
                .buyerName(buyer.getFullName())
                .buyerEmail(buyer.getEmail())
                .buyerReputation(buyer.getReputationScore() == null ? 3 : buyer.getReputationScore())
                .totalAmount(inv.getTotalAmount() == null ? 0L : inv.getTotalAmount().longValue())
                .meetLocation(inv.getMeetLocation())
                .meetTime(inv.getMeetTime())
                .note(inv.getNote())
                .status(inv.getStatus().name())
                .reminderCount(inv.getReminderCount() == null ? 0 : inv.getReminderCount())
                .maxReminders(MAX_REMINDERS)
                .lastReminderAt(inv.getLastReminderAt() == null ? null : inv.getLastReminderAt().format(FMT))
                .createdAt(inv.getCreatedAt() == null ? "" : inv.getCreatedAt().format(FMT))
                .completedAt(inv.getCompletedAt() == null ? null : inv.getCompletedAt().format(FMT))
                .items(itemDtos)
                .build();
    }
}

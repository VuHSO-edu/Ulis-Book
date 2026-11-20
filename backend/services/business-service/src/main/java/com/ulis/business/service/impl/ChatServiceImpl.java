package com.ulis.business.service.impl;

import com.ulis.business.dto.request.ConversationListRequest;
import com.ulis.business.dto.request.ConversationMessageListRequest;
import com.ulis.business.dto.request.ConversationOpenRequest;
import com.ulis.business.dto.request.SendMessageRequest;
import com.ulis.business.dto.response.ChatConversationResponse;
import com.ulis.business.dto.response.ChatMessageResponse;
import com.ulis.business.entity.BookPost;
import com.ulis.business.entity.ChatConversation;
import com.ulis.business.entity.ChatMessage;
import com.ulis.business.entity.User;
import com.ulis.business.repository.BookPostRepository;
import com.ulis.business.repository.ConversationRepository;
import com.ulis.business.repository.MessageRepository;
import com.ulis.business.repository.UserRepository;
import com.ulis.business.service.ChatService;
import com.ulis.core.exception.BadRequestException;
import com.ulis.core.exception.ForbiddenException;
import com.ulis.core.exception.NotFoundException;
import com.ulis.core.helper.MessageHelper;
import com.ulis.core.model.response.PageableResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * ChatServiceImpl (ticket 08):
 * - cặp hội thoại chuẩn hoá userA=min(id), userB=max(id), bài đăng nullable —
 *   findPair reuse hội thoại cũ thay vì tạo mới (spec);
 * - unread = số tin do phía kia gửi chưa đọc (đếm riêng theo từng người);
 * - lịch sử: query newest-first rồi đảo ngược trong trang → render ascending,
 *   page 1 (1-based) chứa block tin mới nhất (khớp useConversationMessages FE);
 * - access control: chỉ user A/B được xem/gửi/đánh dấu (403).
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private static final int MAX_PAGE_SIZE = 50;
    private static final int MAX_CONTENT_LENGTH = 2000;

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final BookPostRepository postRepository;
    private final MessageHelper messageHelper;

    @Override
    @Transactional(readOnly = true)
    public PageableResponse<ChatConversationResponse> listConversations(Long userId,
                                                                        ConversationListRequest request) {
        int page = pageIndex(request == null ? null : request.getPageNumber());
        int size = request != null && request.getPageSize() != null
                ? clamp(request.getPageSize()) : 20;

        Page<ChatConversation> result = conversationRepository.findByParticipant(userId,
                PageRequest.of(page, size));

        List<ChatConversationResponse> content = result.getContent().stream()
                .map(c -> toResponse(c, userId))
                .toList();

        return PageableResponse.<ChatConversationResponse>builder()
                .content(content)
                .pageNumber(result.getNumber())
                .pageSize(result.getSize())
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .numberOfElements(result.getNumberOfElements())
                .build();
    }

    @Override
    public ChatConversationResponse open(Long userId, ConversationOpenRequest request) {
        if (request.getPeerId().equals(userId)) {
            throw new BadRequestException(messageHelper.getMessage("conversation.self"));
        }
        User peer = userRepository.findById(request.getPeerId())
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("conversation.peer.notFound")));
        BookPost post = null;
        if (request.getPostId() != null) {
            post = postRepository.findById(request.getPostId())
                    .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("bookPost.notFound")));
        }

        long a = Math.min(userId, peer.getId());
        long b = Math.max(userId, peer.getId());
        Long postId = post == null ? null : post.getId();

        ChatConversation conversation = conversationRepository.findPair(a, b, postId).orElse(null);
        if (conversation == null) {
            LocalDateTime now = LocalDateTime.now();
            User me = userRepository.findById(userId).orElseThrow();
            conversation = ChatConversation.builder()
                    .userA(a == userId ? me : peer)
                    .userB(a == userId ? peer : me)
                    .post(post)
                    .createdAt(now)
                    .updatedAt(now)
                    .createdBy(me.getEmail())
                    .updatedBy(me.getEmail())
                    .build();
            conversationRepository.save(conversation);
            log.info("Opened conversation id={} between {} and {} (post={})",
                    conversation.getId(), a, b, postId);
        }
        return toResponse(conversation, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public PageableResponse<ChatMessageResponse> listMessages(Long userId, Long conversationId,
                                                              ConversationMessageListRequest request) {
        ChatConversation conversation = requireMember(conversationId, userId);

        int page = pageIndex(request == null ? null : request.getPageNumber());
        int size = request != null && request.getPageSize() != null
                ? clamp(request.getPageSize()) : 30;
        Page<ChatMessage> result = messageRepository.findByConversationId(conversationId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt", "id")));

        // Trang chứa block mới nhất; đảo ngược trong trang để render ascending
        // (tin cũ trên, tin mới dưới — cách chat UI hiển thị).
        List<ChatMessageResponse> mapped = result.getContent().stream()
                .map(ChatMessageResponse::from)
                .toList();
        List<ChatMessageResponse> content = new ArrayList<>(mapped);
        Collections.reverse(content);

        return PageableResponse.<ChatMessageResponse>builder()
                .content(content)
                .pageNumber(result.getNumber())
                .pageSize(result.getSize())
                .totalPages(result.getTotalPages())
                .totalElements(result.getTotalElements())
                .numberOfElements(result.getNumberOfElements())
                .build();
    }

    @Override
    public ChatMessageResponse send(Long userId, Long conversationId, SendMessageRequest request) {
        ChatConversation conversation = requireMember(conversationId, userId);
        User sender = participant(conversation, userId);

        String content = request.getContent().trim();
        if (content.length() > MAX_CONTENT_LENGTH) {
            throw new BadRequestException(messageHelper.getMessage("conversation.content.length"));
        }

        LocalDateTime now = LocalDateTime.now();
        ChatMessage message = ChatMessage.builder()
                .conversation(conversation)
                .sender(sender)
                .content(content)
                .isRead(false)
                .createdAt(now)
                .createdBy(sender.getEmail())
                .build();
        messageRepository.save(message);

        conversation.setLastMessage(content);
        conversation.setLastMessageAt(now);
        conversation.setLastSenderId(userId);
        conversation.setUpdatedAt(now);
        conversation.setUpdatedBy(sender.getEmail());
        conversationRepository.save(conversation);

        log.info("Sent message id={} in conversation id={} by user id={}", message.getId(), conversationId, userId);
        return ChatMessageResponse.from(message);
    }

    @Override
    public void markRead(Long userId, Long conversationId) {
        requireMember(conversationId, userId);
        int updated = messageRepository.markAllRead(conversationId, userId);
        log.info("Marked read {} messages in conversation id={} by user id={}", updated, conversationId, userId);
    }

    // ------------------------------------------------------------------ helpers

    private ChatConversationResponse toResponse(ChatConversation conversation, Long viewerId) {
        long unread = messageRepository.countByConversationIdAndSenderIdNotAndIsReadFalse(
                conversation.getId(), viewerId);
        return ChatConversationResponse.from(conversation,
                participant(conversation, viewerId), unread);
    }

    private ChatConversation requireMember(Long conversationId, Long userId) {
        ChatConversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("conversation.notFound")));
        if (!conversation.getUserA().getId().equals(userId)
                && !conversation.getUserB().getId().equals(userId)) {
            throw new ForbiddenException(messageHelper.getMessage("conversation.accessDenied"));
        }
        return conversation;
    }

    /** Trả về User entity của người tham gia (đã chứng minh là thành viên). */
    private User participant(ChatConversation conversation, Long userId) {
        return conversation.getUserA().getId().equals(userId)
                ? conversation.getUserA() : conversation.getUserB();
    }

    /** pageNumber 1-based (FE) -> index 0-based (Spring Pageable); <=0 → trang đầu. */
    private int pageIndex(Integer pageNumber) {
        return pageNumber == null || pageNumber <= 0 ? 0 : pageNumber - 1;
    }

    private int clamp(int size) {
        return Math.min(MAX_PAGE_SIZE, Math.max(1, size));
    }
}

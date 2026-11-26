package com.ulis.business.controller;

import com.ulis.business.entity.Feedback;
import com.ulis.business.repository.FeedbackRepository;
import com.ulis.business.service.impl.NextBookMailHelper;
import com.ulis.core.helper.MessageHelper;
import com.ulis.core.http.ResponseBuilder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

/**
 * Form Góp ý ở cuối trang (Footer) — lưu DB và gửi email về hòm thư NextBook (TASK-09).
 */
@RestController
@RequestMapping("/feedbacks")
@Tag(name = "FeedbackController", description = "Form Góp ý ở cuối trang gửi về Mail NextBook")
@RequiredArgsConstructor
@Transactional
public class FeedbackController {

    private final FeedbackRepository feedbackRepository;
    private final NextBookMailHelper mailHelper;
    private final MessageHelper messageHelper;

    @Data
    public static class SubmitFeedbackRequest {
        @NotBlank
        @Size(max = 100)
        private String senderName;

        @NotBlank
        @Email
        @Size(max = 255)
        private String senderEmail;

        @Size(max = 50)
        private String category;

        @NotBlank
        @Size(max = 2000)
        private String content;
    }

    @PostMapping("/submit")
    @Operation(summary = "Gửi yêu cầu / góp ý từ Footer")
    public ResponseEntity<Object> submit(@Valid @RequestBody SubmitFeedbackRequest req) {
        Feedback feedback = Feedback.builder()
                .senderName(req.getSenderName().trim())
                .senderEmail(req.getSenderEmail().trim().toLowerCase())
                .category(req.getCategory() == null ? "GENERAL" : req.getCategory().trim())
                .content(req.getContent().trim())
                .createdAt(LocalDateTime.now())
                .build();
        feedbackRepository.save(feedback);
        mailHelper.sendFeedbackToAdminEmail(feedback);
        return ResponseBuilder.ok(feedback, messageHelper.getMessage("feedback.sent"));
    }
}

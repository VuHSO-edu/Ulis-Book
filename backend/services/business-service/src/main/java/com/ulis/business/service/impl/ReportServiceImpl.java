package com.ulis.business.service.impl;

import com.ulis.business.dto.request.ReportCreateRequest;
import com.ulis.business.dto.response.ReportResponse;
import com.ulis.business.entity.Report;
import com.ulis.business.entity.User;
import com.ulis.business.enums.ReportSourceType;
import com.ulis.business.enums.ReportStatus;
import com.ulis.business.repository.BookPostRepository;
import com.ulis.business.repository.CommentRepository;
import com.ulis.business.repository.ReportRepository;
import com.ulis.business.repository.UserRepository;
import com.ulis.business.service.ReportService;
import com.ulis.core.exception.BadRequestException;
import com.ulis.core.exception.NotFoundException;
import com.ulis.core.helper.MessageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final BookPostRepository bookPostRepository;
    private final CommentRepository commentRepository;
    private final MessageHelper messageHelper;

    @Override
    @Transactional
    public ReportResponse create(Long reporterId, ReportCreateRequest request) {
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("user.not.found")));

        verifyTargetExists(request.getSourceType(), request.getTargetId());

        if (request.getSourceType() == ReportSourceType.USER && request.getTargetId().equals(reporterId)) {
            throw new BadRequestException(messageHelper.getMessage("report.self.forbidden"));
        }

        boolean duplicate = reportRepository.existsByReporterIdAndSourceTypeAndTargetIdAndStatus(
                reporterId,
                request.getSourceType(),
                request.getTargetId(),
                ReportStatus.PENDING
        );
        if (duplicate) {
            throw new BadRequestException(messageHelper.getMessage("report.duplicate"));
        }

        Report report = Report.builder()
                .reporter(reporter)
                .sourceType(request.getSourceType())
                .targetId(request.getTargetId())
                .targetTitle(request.getTargetTitle())
                .targetSubtitle(request.getTargetSubtitle())
                .reasonType(request.getReasonType())
                .reasonLabel(request.getReasonLabel())
                .description(request.getDescription().trim())
                .status(ReportStatus.PENDING)
                .build();

        Report saved = reportRepository.save(report);
        if (saved.getReportCode() == null) {
            saved.setReportCode("#RP-" + (8845 + saved.getId()));
            saved = reportRepository.save(saved);
        }

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ReportResponse> listForAdmin(ReportStatus status, Pageable pageable) {
        Page<Report> page = status != null
                ? reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                : reportRepository.findAllByOrderByCreatedAtDesc(pageable);
        return page.map(this::toResponse);
    }

    private void verifyTargetExists(ReportSourceType sourceType, Long targetId) {
        boolean exists = switch (sourceType) {
            case POST -> bookPostRepository.existsById(targetId);
            case USER -> userRepository.existsById(targetId);
            case COMMENT -> commentRepository.existsById(targetId);
        };
        if (!exists) {
            throw new NotFoundException(messageHelper.getMessage("report.target.not.found"));
        }
    }

    private ReportResponse toResponse(Report report) {
        User reporter = report.getReporter();
        return ReportResponse.builder()
                .id(report.getId())
                .reportCode(report.getReportCode())
                .sourceType(report.getSourceType())
                .targetId(report.getTargetId())
                .targetTitle(report.getTargetTitle())
                .targetSubtitle(report.getTargetSubtitle())
                .reasonType(report.getReasonType())
                .reasonLabel(report.getReasonLabel())
                .description(report.getDescription())
                .status(report.getStatus())
                .reporterId(reporter != null ? reporter.getId() : null)
                .reporterName(reporter != null ? reporter.getFullName() : null)
                .reporterEmail(reporter != null ? reporter.getEmail() : null)
                .createdAt(report.getCreatedAt())
                .build();
    }
}

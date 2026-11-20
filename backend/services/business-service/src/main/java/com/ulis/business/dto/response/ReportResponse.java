package com.ulis.business.dto.response;

import com.ulis.business.enums.ReportReasonType;
import com.ulis.business.enums.ReportSourceType;
import com.ulis.business.enums.ReportStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ReportResponse {
    private Long id;
    private String reportCode;
    private ReportSourceType sourceType;
    private Long targetId;
    private String targetTitle;
    private String targetSubtitle;
    private ReportReasonType reasonType;
    private String reasonLabel;
    private String description;
    private ReportStatus status;
    private Long reporterId;
    private String reporterName;
    private String reporterEmail;
    private LocalDateTime createdAt;
}

package com.ulis.business.service;

import com.ulis.business.dto.request.ReportCreateRequest;
import com.ulis.business.dto.response.ReportResponse;
import com.ulis.business.enums.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReportService {

    ReportResponse create(Long reporterId, ReportCreateRequest request);

    Page<ReportResponse> listForAdmin(ReportStatus status, Pageable pageable);
}

package com.ulis.business.repository;

import com.ulis.business.entity.Report;
import com.ulis.business.enums.ReportSourceType;
import com.ulis.business.enums.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByReporterIdAndSourceTypeAndTargetIdAndStatus(
            Long reporterId,
            ReportSourceType sourceType,
            Long targetId,
            ReportStatus status
    );

    Page<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Report> findByStatusOrderByCreatedAtDesc(ReportStatus status, Pageable pageable);
}

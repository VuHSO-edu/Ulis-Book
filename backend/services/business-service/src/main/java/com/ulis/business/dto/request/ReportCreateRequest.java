package com.ulis.business.dto.request;

import com.ulis.business.enums.ReportReasonType;
import com.ulis.business.enums.ReportSourceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReportCreateRequest {

    @NotNull(message = "{validation.required}")
    private ReportSourceType sourceType;

    @NotNull(message = "{validation.required}")
    private Long targetId;

    @Size(max = 255)
    private String targetTitle;

    @Size(max = 255)
    private String targetSubtitle;

    @NotNull(message = "{validation.required}")
    private ReportReasonType reasonType;

    @Size(max = 150)
    private String reasonLabel;

    @NotBlank(message = "{validation.required}")
    @Size(max = 2000)
    private String description;
}

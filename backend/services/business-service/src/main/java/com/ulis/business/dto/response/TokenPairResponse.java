package com.ulis.business.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Cặp JWT trả về khi login / refresh.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TokenPairResponse {

    private String accessToken;

    private String refreshToken;

    private String tokenType;

    /** Thời hạn access token (giây). */
    private long expiresIn;
}

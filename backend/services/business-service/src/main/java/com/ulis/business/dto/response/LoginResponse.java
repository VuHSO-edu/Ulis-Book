package com.ulis.business.dto.response;

import com.ulis.business.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Kết quả login / refresh: cặp token + thông tin người dùng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String accessToken;

    private String refreshToken;

    private String tokenType;

    /** Thời hạn access token (giây). */
    private long expiresIn;

    private UserSummary user;

    public static LoginResponse of(TokenPairResponse pair, User user) {
        return LoginResponse.builder()
                .accessToken(pair.getAccessToken())
                .refreshToken(pair.getRefreshToken())
                .tokenType(pair.getTokenType())
                .expiresIn(pair.getExpiresIn())
                .user(UserSummary.from(user))
                .build();
    }
}

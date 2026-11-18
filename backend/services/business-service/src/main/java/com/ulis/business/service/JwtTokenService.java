package com.ulis.business.service;

import com.ulis.business.dto.response.TokenPairResponse;
import com.ulis.business.entity.User;
import com.ulis.business.enums.JwtTokenType;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;

/**
 * Tạo / xác minh JWT (ticket 03). Access token ngắn hạn cho API,
 * refresh token dài hạn để đổi cặp mới khi access hết hạn.
 */
public interface JwtTokenService {

    TokenPairResponse issueTokens(User user);

    /**
     * Xác minh chữ ký + issuer + loại token (typ).
     *
     * @throws JwtException / IllegalArgumentException nếu token sai/hết hạn/sai loại
     */
    Claims verify(String token, JwtTokenType expectedType);
}

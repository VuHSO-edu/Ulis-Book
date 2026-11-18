package com.ulis.business.service.impl;

import com.ulis.business.config.properties.JwtProperties;
import com.ulis.business.dto.response.TokenPairResponse;
import com.ulis.business.entity.User;
import com.ulis.business.enums.JwtTokenType;
import com.ulis.business.service.JwtTokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

/**
 * JwtTokenServiceImpl — ký token HS256 với secret từ JwtProperties, claim chuẩn:
 * sub=email, uid=userId, fullName, role, typ=ACCESS/REFRESH, iss, iat, exp.
 */
@Service
@RequiredArgsConstructor
public class JwtTokenServiceImpl implements JwtTokenService {

    private final JwtProperties jwtProperties;

    @Override
    public TokenPairResponse issueTokens(User user) {
        Instant now = Instant.now();
        String access = buildToken(user, JwtTokenType.ACCESS, now,
                now.plus(jwtProperties.getAccessTokenTtlMinutes(), ChronoUnit.MINUTES));
        String refresh = buildToken(user, JwtTokenType.REFRESH, now,
                now.plus(jwtProperties.getRefreshTokenTtlDays(), ChronoUnit.DAYS));
        return TokenPairResponse.builder()
                .accessToken(access)
                .refreshToken(refresh)
                .tokenType("Bearer")
                .expiresIn(jwtProperties.getAccessTokenTtlMinutes() * 60L)
                .build();
    }

    @Override
    public Claims verify(String token, JwtTokenType expectedType) throws JwtException {
        return Jwts.parser()
                .verifyWith(signingKey())
                .requireIssuer(jwtProperties.getIssuer())
                .require("typ", expectedType.name())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private String buildToken(User user, JwtTokenType type, Instant issuedAt, Instant expiry) {
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("uid", user.getId())
                .claim("fullName", user.getFullName())
                .claim("role", user.getRole().name())
                .claim("typ", type.name())
                .issuer(jwtProperties.getIssuer())
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(expiry))
                // Cố định HS256 (không để jjwt tự chọn theo độ dài key — secret dev dài
                // ~58 byte sẽ bị tự thăng cấp thành HS384, lệch với thiết kế đã chốt).
                .signWith(signingKey(), Jwts.SIG.HS256)
                .compact();
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }
}

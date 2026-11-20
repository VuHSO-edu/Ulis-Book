package com.ulis.business.service.impl;

import com.ulis.business.config.properties.AuthProperties;
import com.ulis.business.dto.request.ForgotPasswordRequest;
import com.ulis.business.dto.request.LoginRequest;
import com.ulis.business.dto.request.OtpVerifyRequest;
import com.ulis.business.dto.request.RefreshTokenRequest;
import com.ulis.business.dto.request.RegisterRequest;
import com.ulis.business.dto.request.ResendOtpRequest;
import com.ulis.business.dto.request.ResetPasswordRequest;
import com.ulis.business.dto.response.LoginResponse;
import com.ulis.business.dto.response.TokenPairResponse;
import com.ulis.business.entity.User;
import com.ulis.business.enums.JwtTokenType;
import com.ulis.business.enums.UserRole;
import com.ulis.business.enums.UserStatus;
import com.ulis.business.repository.UserRepository;
import com.ulis.business.service.AuthService;
import com.ulis.business.service.JwtTokenService;
import com.ulis.business.service.OtpSender;
import com.ulis.core.exception.BadRequestException;
import com.ulis.core.exception.NotFoundException;
import com.ulis.core.exception.UnauthorizedException;
import com.ulis.core.helper.MessageHelper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * AuthServiceImpl — mọi quy tắc nghiệp vụ OTP (một-lần, hết hạn, resend có giới hạn,
 * sai quá lần) nằm ở đây, không ở controller/repository. OTP lưu ở DB dạng hash;
 * mã thô chỉ truyền thẳng tới OtpSender (log dev / SMTP prod).
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthProperties authProperties;
    private final OtpSender otpSender;
    private final MessageHelper messageHelper;
    private final JwtTokenService jwtTokenService;
    private final PlatformTransactionManager transactionManager;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    public String register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User existing = userRepository.findByEmailIgnoreCase(email).orElse(null);

        if (existing != null && existing.getStatus() == UserStatus.BANNED) {
            throw new BadRequestException(messageHelper.getMessage("auth.email.banned"));
        }
        if (existing != null && existing.getStatus() == UserStatus.ACTIVE) {
            throw new BadRequestException(messageHelper.getMessage("auth.email.taken"));
        }

        LocalDateTime now = LocalDateTime.now();
        User user;
        if (existing != null) {
            // Đăng ký dở (INACTIVE) => cập nhật lại thông tin + cấp OTP mới.
            user = existing;
            user.setFullName(request.getFullName().trim());
            user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        } else {
            user = User.builder()
                    .email(email)
                    .fullName(request.getFullName().trim())
                    .passwordHash(passwordEncoder.encode(request.getPassword()))
                    .role(UserRole.STUDENT)
                    .status(UserStatus.INACTIVE)
                    .createdAt(now)
                    .build();
        }

        String otp = applyOtp(user);
        userRepository.save(user);
        otpSender.send(email, otp);

        log.info("Registered INACTIVE user: {}", email);
        return messageHelper.getMessage("auth.register.sent");
    }

    @Override
    public String verifyOtp(OtpVerifyRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("auth.user.notFound")));

        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new BadRequestException(messageHelper.getMessage("auth.otp.already"));
        }
        ensureNotBanned(user);
        validateOtpCode(user, request.getOtpCode());

        user.setStatus(UserStatus.ACTIVE);
        clearOtp(user);
        userRepository.save(user);
        log.info("Activated user: {}", email);
        return messageHelper.getMessage("auth.otp.activated");
    }

    @Override
    public String resendOtp(ResendOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("auth.user.notFound")));

        if (user.getStatus() == UserStatus.ACTIVE) {
            throw new BadRequestException(messageHelper.getMessage("auth.otp.already"));
        }
        ensureNotBanned(user);

        LocalDateTime now = LocalDateTime.now();
        if (user.getOtpLastSentAt() != null
                && ChronoUnit.SECONDS.between(user.getOtpLastSentAt(), now)
                        < authProperties.getOtpCooldownSeconds()) {
            throw new BadRequestException(messageHelper.getMessage("auth.otp.cooldown"));
        }
        if (user.getOtpResendCount() != null
                && user.getOtpResendCount() >= authProperties.getOtpMaxResend()) {
            throw new BadRequestException(messageHelper.getMessage("auth.otp.resendLimit"));
        }

        String otp = applyOtp(user, true);
        userRepository.save(user);
        otpSender.send(email, otp);
        log.info("Resent OTP for {} (count {})", email, user.getOtpResendCount());
        return messageHelper.getMessage("auth.otp.resent");
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);

        // Message chung cho cả "email không tồn tại" và "sai mật khẩu" — tránh lộ danh tính email.
        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException(messageHelper.getMessage("auth.login.invalid"));
        }
        if (user.getStatus() == UserStatus.INACTIVE) {
            throw new UnauthorizedException(messageHelper.getMessage("auth.login.inactive"));
        }
        if (user.getStatus() == UserStatus.BANNED) {
            throw new UnauthorizedException(messageHelper.getMessage("auth.user.banned"));
        }

        TokenPairResponse pair = jwtTokenService.issueTokens(user);
        log.info("User logged in: {}", email);
        return LoginResponse.of(pair, user);
    }

    @Override
    public LoginResponse refresh(RefreshTokenRequest request) {
        Claims claims;
        try {
            claims = jwtTokenService.verify(request.getRefreshToken(), JwtTokenType.REFRESH);
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Refresh token không hợp lệ: {}", e.getMessage());
            throw new UnauthorizedException(messageHelper.getMessage("auth.token.invalid"));
        }

        Long uid = claims.get("uid", Number.class).longValue();
        User user = userRepository.findById(uid).orElse(null);
        if (user == null || user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException(messageHelper.getMessage("auth.token.invalid"));
        }

        TokenPairResponse pair = jwtTokenService.issueTokens(user);
        log.info("Refreshed token pair for {}", user.getEmail());
        return LoginResponse.of(pair, user);
    }

    @Override
    public String forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("auth.user.notFound")));

        ensureNotBanned(user);
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException(messageHelper.getMessage("auth.login.inactive"));
        }

        LocalDateTime now = LocalDateTime.now();
        if (user.getOtpLastSentAt() != null
                && ChronoUnit.SECONDS.between(user.getOtpLastSentAt(), now)
                        < authProperties.getOtpCooldownSeconds()) {
            throw new BadRequestException(messageHelper.getMessage("auth.otp.cooldown"));
        }
        if (user.getOtpResendCount() != null
                && user.getOtpResendCount() >= authProperties.getOtpMaxResend()) {
            throw new BadRequestException(messageHelper.getMessage("auth.otp.resendLimit"));
        }

        String otp = applyOtp(user, true);
        user.setUpdatedAt(now);
        user.setUpdatedBy(email);
        userRepository.save(user);
        otpSender.send(email, otp);
        log.info("Password reset OTP sent for {}", email);
        return messageHelper.getMessage("auth.password.forgotSent");
    }

    @Override
    public String resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException(messageHelper.getMessage("auth.user.notFound")));

        ensureNotBanned(user);
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException(messageHelper.getMessage("auth.login.inactive"));
        }
        validateOtpCode(user, request.getOtpCode());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        clearOtp(user);
        user.setUpdatedAt(LocalDateTime.now());
        user.setUpdatedBy(email);
        userRepository.save(user);
        log.info("Password reset completed for {}", email);
        return messageHelper.getMessage("auth.password.resetSuccess");
    }

    // region Private Helper Methods

    /**
     * Dùng chung cho kích hoạt tài khoản (ticket 02) và đặt lại mật khẩu
     * (ticket 10): OTP phải tồn tại, còn hạn, chưa vượt số lần sai, và khớp mã.
     * Sai mã => tăng bộ đếm và lưu lại (để chặn brute-force), rồi ném lỗi.
     */
    private void validateOtpCode(User user, String otpCode) {
        if (user.getOtpHash() == null || user.getOtpExpiryAt() == null) {
            throw new BadRequestException(messageHelper.getMessage("auth.otp.notRequested"));
        }
        if (LocalDateTime.now().isAfter(user.getOtpExpiryAt())) {
            throw new BadRequestException(messageHelper.getMessage("auth.otp.expired"));
        }
        if (user.getOtpFailedAttempts() != null
                && user.getOtpFailedAttempts() >= authProperties.getOtpMaxAttempts()) {
            throw new BadRequestException(messageHelper.getMessage("auth.otp.attemptLimit"));
        }
        if (!passwordEncoder.matches(otpCode, user.getOtpHash())) {
            // Ghi nhận sai trong transaction riêng (REQUIRES_NEW): lỗi 400 ném ra
            // sẽ rollback transaction ngoài, nên nếu lưu chung thì bộ đếm mất →
            // brute-force không bao giờ bị chặn.
            int attempts = recordFailedAttempt(user.getId());
            log.warn("Wrong OTP attempt {} for {}", attempts, user.getEmail());
            throw new BadRequestException(messageHelper.getMessage("auth.otp.invalid"));
        }
    }

    /** Tăng bộ đếm sai OTP trong transaction độc lập để không bị rollback theo lỗi 400. */
    private int recordFailedAttempt(Long userId) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        Integer attempts = template.execute(status -> {
            User fresh = userRepository.findById(userId).orElseThrow();
            int next = (fresh.getOtpFailedAttempts() == null ? 0 : fresh.getOtpFailedAttempts()) + 1;
            fresh.setOtpFailedAttempts(next);
            userRepository.save(fresh);
            return next;
        });
        return attempts == null ? 0 : attempts;
    }

    private String applyOtp(User user) {
        return applyOtp(user, false);
    }

    /** Tạo OTP mới, lưu hash + hạn dùng, trả về mã thô để gửi qua OtpSender. */
    private String applyOtp(User user, boolean incrementResend) {
        String otp = generateOtp();
        LocalDateTime now = LocalDateTime.now();
        user.setOtpHash(passwordEncoder.encode(otp));
        user.setOtpExpiryAt(now.plusMinutes(authProperties.getOtpExpiryMinutes()));
        user.setOtpLastSentAt(now);
        user.setOtpFailedAttempts(0);
        int count = user.getOtpResendCount() == null ? 0 : user.getOtpResendCount();
        user.setOtpResendCount(incrementResend ? count + 1 : 0);
        return otp;
    }

    private void clearOtp(User user) {
        user.setOtpHash(null);
        user.setOtpExpiryAt(null);
        user.setOtpLastSentAt(null);
        user.setOtpResendCount(0);
        user.setOtpFailedAttempts(0);
    }

    private void ensureNotBanned(User user) {
        if (user.getStatus() == UserStatus.BANNED) {
            throw new BadRequestException(messageHelper.getMessage("auth.user.banned"));
        }
    }

    private String generateOtp() {
        StringBuilder sb = new StringBuilder(authProperties.getOtpLength());
        for (int i = 0; i < authProperties.getOtpLength(); i++) {
            sb.append(secureRandom.nextInt(10));
        }
        return sb.toString();
    }
    // endregion
}

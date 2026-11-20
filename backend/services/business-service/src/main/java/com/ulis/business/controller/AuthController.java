package com.ulis.business.controller;

import com.ulis.business.dto.request.ForgotPasswordRequest;
import com.ulis.business.dto.request.LoginRequest;
import com.ulis.business.dto.request.OtpVerifyRequest;
import com.ulis.business.dto.request.RefreshTokenRequest;
import com.ulis.business.dto.request.RegisterRequest;
import com.ulis.business.dto.request.ResendOtpRequest;
import com.ulis.business.dto.request.ResetPasswordRequest;
import com.ulis.business.service.AuthService;
import com.ulis.core.http.ResponseBuilder;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Auth API — đăng ký + OTP email giáo dục (ticket 02); đăng nhập + refresh JWT (ticket 03).
 */
@RestController
@RequestMapping("/auth")
@Tag(name = "AuthController", description = "Đăng ký, OTP & đăng nhập JWT")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản (email .edu/.edu.vn) và gửi OTP")
    public ResponseEntity<Object> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseBuilder.ok(null, authService.register(request));
    }

    @PostMapping("/otp/verify")
    @Operation(summary = "Xác minh OTP để kích hoạt tài khoản")
    public ResponseEntity<Object> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        return ResponseBuilder.ok(null, authService.verifyOtp(request));
    }

    @PostMapping("/otp/resend")
    @Operation(summary = "Gửi lại OTP (giới hạn số lần)")
    public ResponseEntity<Object> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        return ResponseBuilder.ok(null, authService.resendOtp(request));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập bằng email + mật khẩu, trả cặp JWT")
    public ResponseEntity<Object> login(@Valid @RequestBody LoginRequest request) {
        return ResponseBuilder.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Đổi mới cặp JWT bằng refresh token (xoay vòng)")
    public ResponseEntity<Object> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseBuilder.ok(authService.refresh(request));
    }

    @PostMapping("/password/forgot")
    @Operation(summary = "Gửi OTP đặt lại mật khẩu tới email giáo dục")
    public ResponseEntity<Object> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseBuilder.ok(null, authService.forgotPassword(request));
    }

    @PostMapping("/password/reset")
    @Operation(summary = "Đặt lại mật khẩu bằng OTP")
    public ResponseEntity<Object> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseBuilder.ok(null, authService.resetPassword(request));
    }
}

package com.ulis.business.service;

import com.ulis.business.dto.request.ForgotPasswordRequest;
import com.ulis.business.dto.request.LoginRequest;
import com.ulis.business.dto.request.OtpVerifyRequest;
import com.ulis.business.dto.request.RefreshTokenRequest;
import com.ulis.business.dto.request.RegisterRequest;
import com.ulis.business.dto.request.ResendOtpRequest;
import com.ulis.business.dto.request.ResetPasswordRequest;
import com.ulis.business.dto.response.LoginResponse;

/**
 * Nghiệp vụ auth — đăng ký email giáo dục + OTP (ticket 02),
 * đăng nhập + refresh JWT (ticket 03).
 */
public interface AuthService {

    String register(RegisterRequest request);

    String verifyOtp(OtpVerifyRequest request);

    String resendOtp(ResendOtpRequest request);

    LoginResponse login(LoginRequest request);

    LoginResponse refresh(RefreshTokenRequest request);

    /** Gửi OTP đặt lại mật khẩu cho tài khoản đã kích hoạt (ticket 10). */
    String forgotPassword(ForgotPasswordRequest request);

    /** Xác minh OTP và đặt mật khẩu mới — OTP một lần, dùng chung hạ tầng OTP. */
    String resetPassword(ResetPasswordRequest request);
}

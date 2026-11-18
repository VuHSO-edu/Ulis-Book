package com.ulis.business.service;

import com.ulis.business.dto.request.LoginRequest;
import com.ulis.business.dto.request.OtpVerifyRequest;
import com.ulis.business.dto.request.RefreshTokenRequest;
import com.ulis.business.dto.request.RegisterRequest;
import com.ulis.business.dto.request.ResendOtpRequest;
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
}

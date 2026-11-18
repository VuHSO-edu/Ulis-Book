import { http } from '@ulis/apis';
import type { BaseResponse } from '@ulis/apis';

/**
 * API auth (ticket 02) — page không gọi http trực tiếp (vuhso-frontend-rules §7).
 */
export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
}

export interface VerifyOtpPayload {
  email: string;
  otpCode: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserSummary {
  id: number;
  email: string;
  fullName: string;
  role: string;
  status: string;
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user?: UserSummary;
}

/** Trích message từ envelope lỗi của backend (BaseResponse.message). */
export const extractErrorMessage = (e: unknown): string | null => {
  const err = e as { response?: { data?: { message?: unknown } } };
  const message = err?.response?.data?.message;
  return typeof message === 'string' && message.length > 0 ? message : null;
};

export const register = (data: RegisterPayload) =>
  http.post<BaseResponse>('/auth/register', data);

export const verifyOtp = (data: VerifyOtpPayload) =>
  http.post<BaseResponse>('/auth/otp/verify', data);

export const resendOtp = (data: ResendOtpPayload) =>
  http.post<BaseResponse>('/auth/otp/resend', data);

export const login = (data: LoginPayload) =>
  http.post<BaseResponse<LoginResponseData>>('/auth/login', data);

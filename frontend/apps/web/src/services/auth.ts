import { http } from '@ulis/apis';
import type { BaseResponse } from '@ulis/apis';

/**
 * API auth (ticket 02) — page không gọi http trực tiếp (vuhso-frontend-rules §7).
 */
export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  msv?: string;
  faculty?: string;
  major?: string;
  className?: string;
  phone?: string;
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

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otpCode: string;
  newPassword: string;
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

/** Trích message lỗi rõ ràng từ phản hồi của backend hoặc lỗi kết nối mạng. */
export const extractErrorMessage = (e: unknown): string | null => {
  const err = e as {
    response?: {
      status?: number;
      data?: { message?: unknown; errors?: Record<string, string> | string[] };
    };
    code?: string;
    message?: string;
  };
  const data = err?.response?.data;
  if (data?.errors && typeof data.errors === 'object') {
    const details = Array.isArray(data.errors)
      ? data.errors.filter((x): x is string => typeof x === 'string' && x.length > 0)
      : Object.values(data.errors).filter((x): x is string => typeof x === 'string' && x.length > 0);
    if (details.length > 0) {
      return details.join(' ');
    }
  }
  if (typeof data?.message === 'string' && data.message.trim().length > 0) {
    return data.message.trim();
  }
  const status = err?.response?.status;
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
  if (status === 404) return 'Không tìm thấy dữ liệu được yêu cầu.';
  if (status && status >= 500) return 'Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau ít phút.';
  if (!err?.response && (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED')) {
    return 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.';
  }
  return null;
};

export const register = (data: RegisterPayload) =>
  http.post<BaseResponse>('/auth/register', data);

export const verifyOtp = (data: VerifyOtpPayload) =>
  http.post<BaseResponse>('/auth/otp/verify', data);

export const resendOtp = (data: ResendOtpPayload) =>
  http.post<BaseResponse>('/auth/otp/resend', data);

export const login = (data: LoginPayload) =>
  http.post<BaseResponse<LoginResponseData>>('/auth/login', data);

export const forgotPassword = (data: ForgotPasswordPayload) =>
  http.post<BaseResponse>('/auth/password/forgot', data);

export const resetPassword = (data: ResetPasswordPayload) =>
  http.post<BaseResponse>('/auth/password/reset', data);

export const peekDevOtp = (email: string) =>
  http.get<BaseResponse<{ email: string; otpCode: string }>>('/auth/otp/dev-peek', {
    params: { email },
  });

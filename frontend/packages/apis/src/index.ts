import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { clearSession, emitSessionExpired, getSession, saveSession } from '@ulis/utils';

/**
 * Envelope phản hồi chuẩn từ backend com.ulis.core (ApiResponse<T>).
 */
export interface BaseResponse<T = unknown> {
  status: number;
  message?: string;
  path?: string;
  timestamp?: string;
  data?: T;
  error?: unknown;
}

/** Dữ liệu cặp token trả về từ /auth/login và /auth/refresh. */
export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
}

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

/**
 * Client axios dùng chung — mọi service phải đi qua đây,
 * không gọi http trực tiếp ở tầng page (vuhso-frontend-rules §7).
 * baseURL được gán ở app (import.meta.env.FIS_API_BASE_URL).
 */
export const http: AxiosInstance = axios.create({
  timeout: 30000,
});

/**
 * Client cho các thao tác POST/PUT/DELETE (blocking UI spinner) — tách biệt với http (GET)
 * theo vuhso-frontend-rules §5.
 */
export const httpBlocking: AxiosInstance = http;

// Request interceptor: gắn access token từ session (nếu có).
http.interceptors.request.use((config) => {
  const session = getSession();
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// Refresh token một lần, singleton để tránh "refresh storm" khi nhiều request 401 cùng lúc.
let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = (): Promise<string> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const session = getSession();
      if (!session?.refreshToken) {
        throw new Error('MISSING_REFRESH_TOKEN');
      }
      const response = await axios.post<BaseResponse<TokenData>>(
        `${http.defaults.baseURL ?? ''}/auth/refresh`,
        { refreshToken: session.refreshToken },
        { timeout: 10000 },
      );
      const tokens = response.data?.data;
      if (!tokens?.accessToken) {
        throw new Error('INVALID_REFRESH_RESPONSE');
      }
      saveSession({
        ...session,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken ?? session.refreshToken,
      });
      return tokens.accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

// Response interceptor: 401 => thử refresh một lần rồi retry; vẫn 401 => xoá phiên.
http.interceptors.response.use(
  (response: AxiosResponse<BaseResponse>) => response,
  async (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? '';

    // Login/refresh tự thân báo 401 — không refresh vòng lặp.
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/refresh');

    if (status === 401 && !isAuthEndpoint) {
      const config = error.config as RetryableConfig | undefined;
      if (config && !config._retry) {
        config._retry = true;
        try {
          const newToken = await refreshAccessToken();
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${newToken}`;
          return http(config);
        } catch {
          clearSession();
          emitSessionExpired();
        }
      }
    }
    return Promise.reject(error);
  }
);

export const getHealth = () => http.get<BaseResponse<{ status: string }>>('/health');

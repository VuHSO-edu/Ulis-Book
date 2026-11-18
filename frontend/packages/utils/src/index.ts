/**
 * Tiện ích dùng chung — theo vuhso-frontend-rules §3.6.
 * Storage có tiền tố `ulis_` để tránh đè key của app khác trên cùng origin.
 */

const STORAGE_PREFIX = 'ulis_';

export const getStorage = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const setStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
};

export const removeStorage = (key: string): void => {
  localStorage.removeItem(STORAGE_PREFIX + key);
};

export const STORAGE_KEY = {
  LANG: 'lang',
  LOGIN_DATA: 'login-data',
  TOKEN: 'access-token',
} as const;

/**
 * Phiên đăng nhập (ticket 03) — nguồn sự thật cho cả http interceptor (`@ulis/apis`)
 * lẫn store phiên (`store/useAuth`). Thao tác qua getSession/saveSession/clearSession,
 * không đọc localStorage trực tiếp ở nơi khác.
 */
export interface SessionUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
  status: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  user?: SessionUser;
}

export const getSession = (): AuthSession | null => getStorage<AuthSession>(STORAGE_KEY.TOKEN);

export const saveSession = (session: AuthSession): void => {
  setStorage(STORAGE_KEY.TOKEN, session);
};

export const clearSession = (): void => {
  removeStorage(STORAGE_KEY.TOKEN);
  removeStorage(STORAGE_KEY.LOGIN_DATA);
};

/** Sự kiện phiên hết hạn — interceptor bắn ra khi refresh thất bại; App lắng nghe để logout. */
export const SESSION_EXPIRED_EVENT = 'ulis:session-expired';

export const emitSessionExpired = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
};

export const DATE_FORMAT = 'DD/MM/YYYY';
export const DATE_TIME_FORMAT = 'DD/MM/YYYY HH:mm:ss';

/** Tiền tố cho từng service backend — theo vuhso-frontend-rules §3.6. */
export const API_SERVICE_SUBPATH = {
  BUSINESS: '/business-api/',
  ADMIN: '/admin-api/',
} as const;

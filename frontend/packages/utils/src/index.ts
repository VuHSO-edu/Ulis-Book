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

/**
 * Chuẩn hóa đối tượng filter trước khi gửi lên Server Filter — loại bỏ
 * undefined, null, chuỗi rỗng '', và NaN (theo vuhso-frontend-rules §4).
 */
export const normalizeFilterValues = <T extends Record<string, unknown>>(values: T): Partial<T> => {
  const result: Partial<T> = {};
  for (const key of Object.keys(values) as Array<keyof T>) {
    const val = values[key];
    if (val === undefined || val === null || val === '') continue;
    if (typeof val === 'number' && Number.isNaN(val)) continue;
    if (typeof val === 'string' && val.trim() === '') continue;
    result[key] = typeof val === 'string' ? (val.trim() as T[keyof T]) : val;
  }
  return result;
};

/**
 * Tự động chuyển đổi chuỗi số ngày tháng liền nhau `ddmmyyyy` sang `dd/mm/yyyy`
 * và kiểm tra tính hợp lệ của ngày/tháng (kể cả năm nhuận).
 */
export const formatAndValidateDateInput = (
  raw: string,
): { formatted: string; valid: boolean; isValid: boolean; timestamp?: number } => {
  const digits = raw.replace(/\D/g, '');
  let formatted = raw.trim();
  if (/^\d{8}$/.test(digits)) {
    formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(formatted);
  if (!match) {
    return { formatted, valid: false, isValid: false };
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || year < 1900 || year > 2100) {
    return { formatted, valid: false, isValid: false };
  }
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const maxDaysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (day > maxDaysInMonth[month - 1]) {
    return { formatted, valid: false, isValid: false };
  }
  const timestamp = new Date(year, month - 1, day).getTime();
  return { formatted, valid: true, isValid: true, timestamp };
};

/** Định dạng tiền tệ VND chuẩn tiếng Việt (căn phải trong bảng). */
export const formatCurrencyVnd = (amount: number): string => {
  if (!Number.isFinite(amount) || amount <= 0) return '0 đ';
  return `${amount.toLocaleString('vi-VN')} đ`;
};


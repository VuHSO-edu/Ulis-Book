import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getStorage, STORAGE_KEY } from '@ulis/utils';
import vi from './vi-VN';
import en from './en-US';

const resources = { vi, en };

void i18n.use(initReactI18next).init({
  resources,
  lng: getStorage<string>(STORAGE_KEY.LANG) ?? 'vi',
  fallbackLng: 'vi',
  ns: Object.keys(vi) as string[],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnNull: false,
});

/**
 * Type-level path cho resouce object: biến nested object thành chuỗi `a.b.c`.
 */
type Paths<T> = T extends Record<string, unknown>
  ? {
      [K in keyof T]: T[K] extends Record<string, unknown>
        ? `${Extract<K, string>}.${Paths<T[K]>}`
        : Extract<K, string>;
    }[keyof T]
  : never;

type Namespace = keyof typeof vi;

/** Key hợp lệ dạng `<namespace>:<path>` — sai key = lỗi compile. */
export type I18nKey =
  {
    [K in Namespace]: `${Extract<K, string>}:${Paths<(typeof vi)[K]>}`;
  }[Namespace];

export const translate = (key: I18nKey, options?: Record<string, unknown>): string =>
  i18n.t(key, options);

/**
 * Regex dùng chung cho validation — theo vuhso-frontend-rules §3.5.
 * EDU_EMAIL phải khớp chính xác luật backend (AuthConstants.EDU_EMAIL_REGEX).
 */
export const COMMON_VALIDATION_PATTERN = {
  EDU_EMAIL: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(edu|edu\.vn)$/,
  CODE: /^[A-Za-z0-9_]+$/,
  INTEGER: /^\d+$/,
} as const;

export { i18n };

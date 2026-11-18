import { create } from 'zustand';
import {
  AuthSession,
  clearSession,
  getSession,
  saveSession,
  SessionUser,
} from '@ulis/utils';

interface AuthState {
  isAuthenticated: boolean;
  user: SessionUser | null;
  login: (session: AuthSession) => void;
  logout: () => void;
}

const readInitial = () => {
  const session = getSession();
  return { isAuthenticated: !!session?.accessToken, user: session?.user ?? null };
};

/**
 * Store phiên người dùng (Zustand) — token + thông tin user lưu trong storage
 * qua @ulis/utils (session); interceptor @ulis/apis tự nạp header và tự refresh.
 * Skeleton cũ chỉ set token stub; ticket 03 dùng login thật trả cặp JWT.
 */
export const useAuth = create<AuthState>((set) => ({
  ...readInitial(),
  login: (session) => {
    saveSession(session);
    set({ isAuthenticated: true, user: session.user ?? null });
  },
  logout: () => {
    clearSession();
    set({ isAuthenticated: false, user: null });
  },
}));

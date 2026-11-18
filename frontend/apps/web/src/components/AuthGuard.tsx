import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/useAuth';

/**
 * Guard xác thực — theo vuhso-frontend-rules §4 (Permissions guard).
 * Chưa đăng nhập => redirect /login, nhớ lại đường dẫn ban đầu.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return <>{children}</>;
}

import { useEffect } from 'react';
import { BrowserRouter, Routes } from 'react-router-dom';
import { SESSION_EXPIRED_EVENT } from '@ulis/utils';
import { routes } from './routes';
import { useAuth } from './store/useAuth';

/**
 * Root app — lắng nghe sự kiện phiên hết hạn do interceptor @ulis/apis bắn
 * (refresh thất bại): logout qua store, guard tự redirect về /login.
 */
export default function App() {
  useEffect(() => {
    const onSessionExpired = () => useAuth.getState().logout();
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
  }, []);

  return (
    <BrowserRouter>
      <Routes>{routes}</Routes>
    </BrowserRouter>
  );
}

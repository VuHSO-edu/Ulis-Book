import { useEffect, useState } from 'react';
import { BrowserRouter, Routes } from 'react-router-dom';
import { Spin } from '@ulis/components';
import { translate } from '@ulis/locale';
import { SESSION_EXPIRED_EVENT } from '@ulis/utils';
import { routes } from './routes';
import { useAuth } from './store/useAuth';
import { applyThemeCssVariables } from './services/v2';
import { localDb } from './services/local-db';

/**
 * Root app — màn hình loading khởi tạo trước khi vào ứng dụng + lắng nghe sự kiện phiên hết hạn
 * + đồng bộ bảng màu hệ thống do Admin cấu hình (TASK-04).
 */
export default function App() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    applyThemeCssVariables(localDb.getAppearance());
    const onSessionExpired = () => useAuth.getState().logout();
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    const timer = setTimeout(() => setBooting(false), 650);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
      clearTimeout(timer);
    };
  }, []);

  if (booting) {
    return (
      <div className="ulis-initial-loader">
        <div className="loader-card">
          <div className="loader-brand-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <h1 className="loader-title">{translate('common:appName')}</h1>
          <p className="loader-subtitle">{translate('home:heroSubtitle')}</p>
          <div style={{ marginTop: 16 }}>
            <Spin size="default" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>{routes}</Routes>
    </BrowserRouter>
  );
}

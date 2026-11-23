import { useEffect, useState } from 'react';
import { BrowserRouter, Routes } from 'react-router-dom';
import { MaterialIcon, Spin } from '@ulis/components';
import { translate } from '@ulis/locale';
import { SESSION_EXPIRED_EVENT } from '@ulis/utils';
import { routes } from './routes';
import { useAuth } from './store/useAuth';

/**
 * Root app — màn hình loading khởi tạo trước khi vào ứng dụng + lắng nghe sự kiện phiên hết hạn.
 */
export default function App() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
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
            <MaterialIcon name="menu_book" size={26} />
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

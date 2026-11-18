import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { http } from '@ulis/apis';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import '@ulis/styles/app-shared.scss';
import './App.scss';
import App from './App';

dayjs.locale('vi');

// Gán base URL API theo env (dev: http://localhost:8080 · prod: /business-api).
http.defaults.baseURL = import.meta.env.FIS_API_BASE_URL;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false, staleTime: 60_000 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN} theme={{ token: { colorPrimary: '#1f3a93' } }}>
        <AntdApp>
          <App />
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  </StrictMode>
);

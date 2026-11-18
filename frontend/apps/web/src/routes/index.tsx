import { lazy, Suspense } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { Spin } from 'antd';
import AuthGuard from '../components/AuthGuard';
import AppLayout from '../layouts/AppLayout';

const LoginPage = lazy(() => import('../pages/login'));
const RegisterPage = lazy(() => import('../pages/register'));
const OtpVerifyPage = lazy(() => import('../pages/otp-verify'));
const HomePage = lazy(() => import('../pages/home'));
const ProfilePage = lazy(() => import('../pages/profile'));

const withSuspense = (node: React.ReactNode) => (
  <Suspense fallback={<Spin size="large" className="page-loading" />}>{node}</Suspense>
);

/**
 * Route table — các màn công khai (login/register/otp) không cần guard;
 * màn còn lại nằm sau AuthGuard (chưa đăng nhập => redirect /login).
 */
export const routes = [
  <Route key="login" path="/login" element={withSuspense(<LoginPage />)} />,
  <Route key="register" path="/register" element={withSuspense(<RegisterPage />)} />,
  <Route key="otp-verify" path="/otp-verify" element={withSuspense(<OtpVerifyPage />)} />,
  <Route
    key="guard"
    path="/"
    element={
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    }
  >
    <Route index element={withSuspense(<HomePage />)} />
    <Route path="profile" element={withSuspense(<ProfilePage />)} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Route>,
];

import { lazy, Suspense } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { Spin } from '@ulis/components';
import AuthGuard from '../components/AuthGuard';
import AppLayout from '../layouts/AppLayout';
import AdminLayout from '../layouts/AdminLayout';

const LoginPage = lazy(() => import('../pages/login'));
const RegisterPage = lazy(() => import('../pages/register'));
const OtpVerifyPage = lazy(() => import('../pages/otp-verify'));
const ForgotPasswordPage = lazy(() => import('../pages/forgot-password'));
const HomePage = lazy(() => import('../pages/home'));
const BookDetailPage = lazy(() => import('../pages/book-detail'));
const MyPostsPage = lazy(() => import('../pages/my-posts'));
const ChatPage = lazy(() => import('../pages/chat'));
const ProfilePage = lazy(() => import('../pages/profile'));

const AdminReportsPage = lazy(() => import('../pages/admin/reports'));
const AdminBookPostsPage = lazy(() => import('../pages/admin/book-posts'));
const AdminUsersPage = lazy(() => import('../pages/admin/users'));
const AdminBookCategoriesPage = lazy(() => import('../pages/admin/book-categories'));

const withSuspense = (node: React.ReactNode) => (
  <Suspense fallback={<Spin size="large" className="page-loading" />}>{node}</Suspense>
);

/**
 * Route table theo SPEC.md & doc/01..08:
 * - Công khai: /login, /register, /otp-verify, / (Trang chủ khám phá sách), /books/:id (Chi tiết sách)
 * - Sinh viên đã đăng nhập: /profile, /my-posts, /chat
 * - Admin Console: /admin/reports, /admin/book-posts, /admin/users, /admin/book-categories
 */
export const routes = [
  <Route key="login" path="/login" element={withSuspense(<LoginPage />)} />,
  <Route key="register" path="/register" element={withSuspense(<RegisterPage />)} />,
  <Route key="otp-verify" path="/otp-verify" element={withSuspense(<OtpVerifyPage />)} />,
  <Route key="forgot-password" path="/forgot-password" element={withSuspense(<ForgotPasswordPage />)} />,

  <Route key="student-app" path="/" element={<AppLayout />}>
    <Route index element={withSuspense(<HomePage />)} />
    <Route path="books/:id" element={withSuspense(<BookDetailPage />)} />
    <Route
      path="my-posts"
      element={
        <AuthGuard>
          {withSuspense(<MyPostsPage />)}
        </AuthGuard>
      }
    />
    <Route
      path="chat"
      element={
        <AuthGuard>
          {withSuspense(<ChatPage />)}
        </AuthGuard>
      }
    />
    <Route
      path="profile"
      element={
        <AuthGuard>
          {withSuspense(<ProfilePage />)}
        </AuthGuard>
      }
    />
  </Route>,

  <Route key="admin-console" path="/admin" element={<AdminLayout />}>
    <Route index element={<Navigate to="/admin/reports" replace />} />
    <Route path="reports" element={withSuspense(<AdminReportsPage />)} />
    <Route path="book-posts" element={withSuspense(<AdminBookPostsPage />)} />
    <Route path="users" element={withSuspense(<AdminUsersPage />)} />
    <Route path="book-categories" element={withSuspense(<AdminBookCategoriesPage />)} />
  </Route>,

  <Route key="fallback" path="*" element={<Navigate to="/" replace />} />
];

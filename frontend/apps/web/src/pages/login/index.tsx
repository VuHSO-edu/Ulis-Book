import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { App, Button, Card, Form, Input, Typography } from 'antd';
import { translate } from '@ulis/locale';
import { useAuth } from '../../store/useAuth';
import { extractErrorMessage, login } from '../../services/auth';

interface LoginFormValues {
  username: string;
  password: string;
}

/**
 * Màn đăng nhập thật (ticket 03) — gọi POST /auth/login, lưu cặp JWT + user
 * vào phiên; thành công thì về trang yêu cầu ban đầu (from của guard).
 */
export default function LoginPage() {
  const loginState = useAuth((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: LoginFormValues) => {
    setSubmitting(true);
    try {
      const resp = await login({ email: values.username, password: values.password });
      const t = resp.data?.data;
      if (!t?.accessToken) {
        throw new Error('NO_TOKEN');
      }
      loginState({
        accessToken: t.accessToken,
        refreshToken: t.refreshToken,
        user: t.user
          ? {
              id: t.user.id,
              email: t.user.email,
              fullName: t.user.fullName,
              role: t.user.role,
              status: t.user.status,
            }
          : undefined,
      });
      const from = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(from, { replace: true });
    } catch (e) {
      message.error(extractErrorMessage(e) ?? translate('common:unknownError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <Card className="login-card">
        <Typography.Title level={3} className="login-title" style={{ textAlign: 'center' }}>
          {translate('login:title')}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
          {translate('login:subtitle')}
        </Typography.Paragraph>
        <Form<LoginFormValues> layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="username"
            label={translate('login:username')}
            rules={[
              { required: true, message: translate('common:validation.required', { field: translate('login:username') }) },
              { type: 'email', message: translate('common:validation.email', { field: translate('login:username') }) },
            ]}
          >
            <Input placeholder={translate('login:usernamePlaceholder')} />
          </Form.Item>
          <Form.Item
            name="password"
            label={translate('login:password')}
            rules={[{ required: true, message: translate('common:validation.required', { field: translate('login:password') }) }]}
          >
            <Input.Password placeholder={translate('login:passwordPlaceholder')} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting}>
            {translate('button:login')}
          </Button>
        </Form>
        <Typography.Paragraph style={{ marginTop: 16, textAlign: 'center' }}>
          {translate('login:noAccount')} <Link to="/register">{translate('login:toRegister')}</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}

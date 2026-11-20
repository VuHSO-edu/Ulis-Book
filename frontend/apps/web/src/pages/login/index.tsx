import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { App, Button, Form, Input, MaterialIcon } from '@ulis/components';
import { COMMON_VALIDATION_PATTERN, translate } from '@ulis/locale';
import { useAuth } from '../../store/useAuth';
import { extractErrorMessage, login, register } from '../../services/auth';

interface LoginFormValues {
  username: string;
  password: string;
}

interface RegisterFormValues {
  fullName: string;
  email: string;
  password: string;
  confirm: string;
}

export function AuthSplitPage({ defaultTab = 'login' }: { defaultTab?: 'login' | 'register' }) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(defaultTab);
  const [submitting, setSubmitting] = useState(false);
  const loginState = useAuth((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const onLoginFinish = async (values: LoginFormValues) => {
    const cleanEmail = values.username.trim();
    setSubmitting(true);
    try {
      const resp = await login({ email: cleanEmail, password: values.password });
      const t = resp.data?.data;
      if (!t?.accessToken) throw new Error('NO_TOKEN');
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
      const defaultTarget = t.user?.role === 'ADMIN' ? '/admin/reports' : '/';
      const from = (location.state as { from?: string } | null)?.from ?? defaultTarget;
      navigate(from, { replace: true });
    } catch (e) {
      const errMsg = extractErrorMessage(e);
      message.error(errMsg || translate('common:unknownError'));
    } finally {
      setSubmitting(false);
    }
  };

  const onRegisterFinish = async (values: RegisterFormValues) => {
    const cleanEmail = values.email.trim();
    const cleanName = values.fullName.trim();
    if (!cleanName) {
      message.error(
        translate('common:validation.whitespace', { field: translate('register:fullName') }),
      );
      return;
    }
    setSubmitting(true);
    try {
      await register({
        email: cleanEmail,
        password: values.password,
        fullName: cleanName,
      });
      message.success(translate('register:success'));
      navigate(`/otp-verify?email=${encodeURIComponent(cleanEmail)}`);
    } catch (e) {
      const errMsg = extractErrorMessage(e);
      message.error(errMsg || translate('common:unknownError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ulis-auth-page">
      <div className="ulis-auth-minimal-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <Link to="/" className="ulis-brand" style={{ textDecoration: 'none' }}>
            <span className="brand-icon">
              <MaterialIcon name="menu_book" size={19} />
            </span>
            <span className="brand-title">{translate('common:appName')}</span>
          </Link>

          <Link
            to="/"
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: '#64748b',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <MaterialIcon name="arrow_back" size={15} />
            <span>{translate('nav:breadcrumbHome')}</span>
          </Link>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              margin: '0 0 6px',
              fontFamily: "'Merriweather', Georgia, serif",
              fontSize: 22,
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            {activeTab === 'login' ? translate('button:login') : translate('login:toRegister')}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
            {translate('login:subtitle')}
          </p>
        </div>

        <div className="ulis-auth-tabs" style={{ marginBottom: 22 }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              navigate('/login', { replace: true });
            }}
            className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
          >
            <span>{translate('button:login')}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              navigate('/register', { replace: true });
            }}
            className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
          >
            <span>{translate('login:toRegister')}</span>
          </button>
        </div>

        {activeTab === 'login' ? (
          <Form<LoginFormValues> layout="vertical" onFinish={onLoginFinish}>
            <Form.Item
              name="username"
              label={translate('login:username')}
              rules={[
                {
                  required: true,
                  message: translate('common:validation.required', {
                    field: translate('login:username'),
                  }),
                },
                {
                  type: 'email',
                  message: translate('common:validation.email', {
                    field: translate('login:username'),
                  }),
                },
                {
                  pattern: COMMON_VALIDATION_PATTERN.EDU_EMAIL,
                  message: translate('register:emailHint'),
                },
              ]}
            >
              <Input
                autoFocus
                size="large"
                placeholder={translate('login:usernamePlaceholder')}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={translate('login:password')}
              rules={[
                {
                  required: true,
                  message: translate('common:validation.required', {
                    field: translate('login:password'),
                  }),
                },
              ]}
            >
              <Input.Password
                size="large"
                placeholder={translate('login:passwordPlaceholder')}
              />
            </Form.Item>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                marginBottom: 18,
              }}
            >
              <Link
                to="/forgot-password"
                style={{ fontSize: 12.5, fontWeight: 600, color: '#2563eb' }}
              >
                {translate('login:forgotPassword')}
              </Link>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
              className="ulis-primary-btn"
              style={{ height: 42 }}
            >
              {translate('button:login')}
            </Button>
          </Form>
        ) : (
          <Form<RegisterFormValues> layout="vertical" onFinish={onRegisterFinish}>
            <Form.Item
              name="fullName"
              label={translate('register:fullName')}
              rules={[
                {
                  required: true,
                  message: translate('common:validation.required', {
                    field: translate('register:fullName'),
                  }),
                },
              ]}
            >
              <Input
                autoFocus
                size="large"
                placeholder={translate('register:fullNamePlaceholder')}
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={translate('register:email')}
              rules={[
                {
                  required: true,
                  message: translate('common:validation.required', {
                    field: translate('register:email'),
                  }),
                },
                {
                  type: 'email',
                  message: translate('common:validation.email', {
                    field: translate('register:email'),
                  }),
                },
                {
                  pattern: COMMON_VALIDATION_PATTERN.EDU_EMAIL,
                  message: translate('register:emailHint'),
                },
              ]}
            >
              <Input size="large" placeholder={translate('register:emailPlaceholder')} />
            </Form.Item>

            <Form.Item
              name="password"
              label={translate('register:password')}
              rules={[
                {
                  required: true,
                  message: translate('common:validation.required', {
                    field: translate('register:password'),
                  }),
                },
                { min: 8, message: translate('register:passwordMin') },
              ]}
            >
              <Input.Password
                size="large"
                placeholder={translate('register:passwordPlaceholder')}
              />
            </Form.Item>

            <Form.Item
              name="confirm"
              label={translate('register:confirm')}
              dependencies={['password']}
              rules={[
                {
                  required: true,
                  message: translate('common:validation.required', {
                    field: translate('register:confirm'),
                  }),
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(translate('register:confirmNotMatch')));
                  },
                }),
              ]}
            >
              <Input.Password
                size="large"
                placeholder={translate('register:confirmPlaceholder')}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
              className="ulis-primary-btn"
              style={{ height: 42, marginTop: 6 }}
            >
              {translate('register:submit')}
            </Button>
          </Form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <AuthSplitPage defaultTab="login" />;
}

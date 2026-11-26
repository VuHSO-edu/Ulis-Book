import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { App, Button, Form, Input, MaterialIcon } from '@ulis/components';
import { COMMON_VALIDATION_PATTERN, translate } from '@ulis/locale';
import { useAuth } from '../../store/useAuth';
import { extractErrorMessage, login, register } from '../../services/auth';
import NextBookLogo from '../../components/NextBookLogo';

interface LoginFormValues {
  username: string;
  password: string;
}

interface RegisterFormValues {
  fullName: string;
  msv: string;
  faculty?: string;
  className?: string;
  phone?: string;
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
        msv: values.msv?.trim(),
        faculty: values.faculty?.trim(),
        className: values.className?.trim(),
        phone: values.phone?.trim(),
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
      <div className="ulis-auth-booknet-shell">
        {/* Left column: BookNet Illustration & Tagline */}
        <div
          style={{
            padding: '28px 24px',
            borderRadius: 4,
            background: 'var(--ulis-seashell)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
          }}
        >
          <NextBookLogo showDomainBadge size={40} />

          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-primary)',
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1.35,
              color: 'var(--ulis-midnight-violet)',
              maxWidth: 340,
            }}
          >
            {translate('home:promoHeadline')}
          </h2>

          <div
            style={{
              width: '100%',
              maxWidth: 300,
              padding: 20,
              borderRadius: 4,
              background: 'var(--ulis-wheat)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <MaterialIcon
              name="library_books"
              size={52}
              style={{ color: 'var(--ulis-french-blue)' }}
            />
            <div
              style={{
                fontFamily: 'var(--font-primary)',
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--ulis-midnight-violet)',
              }}
            >
              {translate('login:editorialBadge')}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-secondary)',
                fontSize: 12.5,
                color: 'var(--ulis-midnight-muted)',
                lineHeight: 1.5,
              }}
            >
              {translate('login:editorialDesc')}
            </div>
          </div>

          <Link
            to="/"
            style={{
              fontFamily: 'var(--font-primary)',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--ulis-french-blue)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MaterialIcon name="arrow_back" size={16} />
            <span>{translate('nav:breadcrumbHome')}</span>
          </Link>
        </div>

        {/* Right column: Login / Register Card */}
        <div
          style={{
            padding: '28px 32px',
            borderRadius: 4,
            background: 'var(--ulis-seashell)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <h1
              style={{
                margin: '0 0 6px',
                fontFamily: 'var(--font-primary)',
                fontSize: 24,
                fontWeight: 700,
                color: 'var(--ulis-midnight-violet)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              {activeTab === 'login' ? translate('button:login') : translate('login:toRegister')}
            </h1>
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-secondary)',
                fontSize: 13,
                color: 'var(--ulis-midnight-muted)',
              }}
            >
              {translate('login:subtitle')}
            </p>
          </div>

          <div
            className="ulis-auth-tabs"
            style={{ background: '#ffffff', marginBottom: 20 }}
          >
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
                  justifyContent: 'space-between',
                  marginBottom: 18,
                  fontFamily: 'var(--font-secondary)',
                  fontSize: 12.5,
                }}
              >
                <span style={{ color: 'var(--ulis-midnight-muted)' }}>
                  {translate('login:noAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      navigate('/register', { replace: true });
                    }}
                    style={{
                      border: 'none',
                      background: 'none',
                      padding: 0,
                      color: 'var(--ulis-french-blue)',
                      fontWeight: 700,
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    {translate('login:toRegister')}
                  </button>
                </span>
                <Link
                  to="/forgot-password"
                  style={{ fontWeight: 600, color: 'var(--ulis-french-blue)' }}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
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
                    placeholder={translate('register:fullNamePlaceholder')}
                  />
                </Form.Item>

                <Form.Item
                  name="msv"
                  label={translate('register:msv')}
                  rules={[
                    {
                      required: true,
                      message: translate('common:validation.required', {
                        field: translate('register:msv'),
                      }),
                    },
                  ]}
                >
                  <Input placeholder={translate('register:msvPlaceholder')} />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
                <Form.Item name="faculty" label={translate('profile:faculty')}>
                  <Input placeholder={translate('profile:facultyPlaceholder')} />
                </Form.Item>

                <Form.Item name="className" label={translate('profile:className')}>
                  <Input placeholder={translate('profile:classNamePlaceholder')} />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
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
                  <Input placeholder={translate('register:emailPlaceholder')} />
                </Form.Item>

                <Form.Item name="phone" label={translate('profile:phone')}>
                  <Input placeholder={translate('profile:phonePlaceholder')} />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' }}>
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
                  <Input.Password placeholder={translate('register:passwordPlaceholder')} />
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
                  <Input.Password placeholder={translate('register:confirmPlaceholder')} />
                </Form.Item>
              </div>

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
    </div>
  );
}

export default function LoginPage() {
  return <AuthSplitPage defaultTab="login" />;
}

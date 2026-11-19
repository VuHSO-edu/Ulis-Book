import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { App, Button, Checkbox, Form, Input, MaterialIcon } from '@ulis/components';
import { COMMON_VALIDATION_PATTERN, translate } from '@ulis/locale';
import { useAuth } from '../../store/useAuth';
import { extractErrorMessage, login, register } from '../../services/auth';

interface LoginFormValues {
  username: string;
  password: string;
  keepLogin?: boolean;
}

interface RegisterFormValues {
  fullName: string;
  msv: string;
  majorCourse: string;
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

  const handleQuickDemo = (mode: 'student' | 'admin') => {
    const isAdmin = mode === 'admin';
    loginState({
      accessToken: isAdmin ? 'demo-admin-jwt-token' : 'demo-student-jwt-token',
      refreshToken: 'demo-refresh-token',
      user: {
        id: isAdmin ? 99 : 1,
        email: isAdmin ? 'admin@ulis.edu.vn' : 'an.nv@ulis.edu.vn',
        fullName: isAdmin ? 'Ban Quản Trị ULIS Books' : 'Nguyễn Văn An',
        role: isAdmin ? 'ADMIN' : 'USER',
        status: 'ACTIVE',
      },
    });
    navigate(isAdmin ? '/admin/reports' : '/', { replace: true });
  };

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
      const from = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(from, { replace: true });
    } catch (e) {
      // Fallback nếu backend chưa bật để người dùng vẫn test được đầy đủ luồng UI
      const errMsg = extractErrorMessage(e);
      if (!errMsg) {
        const isAdminEmail = cleanEmail.toLowerCase().startsWith('admin');
        loginState({
          accessToken: 'ulis-local-jwt-token',
          refreshToken: 'ulis-local-refresh-token',
          user: {
            id: isAdminEmail ? 99 : 1,
            email: cleanEmail,
            fullName: isAdminEmail ? 'Ban Quản Trị ULIS Books' : 'Nguyễn Văn An',
            role: isAdminEmail ? 'ADMIN' : 'USER',
            status: 'ACTIVE',
          },
        });
        navigate(isAdminEmail ? '/admin/reports' : '/', { replace: true });
      } else {
        message.error(errMsg);
      }
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
      if (!errMsg) {
        message.success(translate('register:success'));
        navigate(`/otp-verify?email=${encodeURIComponent(cleanEmail)}`);
      } else {
        message.error(errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ulis-auth-page">
      <div className="ulis-auth-shell">
        {/* CỘT TRÁI (5/12): Campus Editorial Showcase theo Stitch 571a230665d14229bd9ad442e4c4de80 */}
        <div className="ulis-auth-editorial">
          <div>
            <div className="editorial-badge">
              <MaterialIcon name="school" size={15} />
              <span>{translate('login:editorialBadge')}</span>
            </div>

            <h1 className="editorial-title">{translate('login:editorialTitle')}</h1>
            <p className="editorial-desc">{translate('login:editorialDesc')}</p>

            <div className="trust-item">
              <span className="trust-icon">
                <MaterialIcon name="verified" size={18} />
              </span>
              <div>
                <div className="trust-title">{translate('login:trust1Title')}</div>
                <div className="trust-desc">{translate('login:trust1Desc')}</div>
              </div>
            </div>

            <div className="trust-item">
              <span className="trust-icon">
                <MaterialIcon name="auto_stories" size={18} />
              </span>
              <div>
                <div className="trust-title">{translate('login:trust2Title')}</div>
                <div className="trust-desc">{translate('login:trust2Desc')}</div>
              </div>
            </div>

            <div className="trust-item">
              <span className="trust-icon">
                <MaterialIcon name="shield_lock" size={18} />
              </span>
              <div>
                <div className="trust-title">{translate('login:trust3Title')}</div>
                <div className="trust-desc">{translate('login:trust3Desc')}</div>
              </div>
            </div>
          </div>

          <div className="quote-card">
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6cf8bb' }}>
              ★ ★ ★ ★ ★ · {translate('login:quoteCourse')}
            </div>
            <div className="quote-text">{translate('login:quoteText')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: '#2563eb',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                PL
              </span>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>
                  {translate('login:quoteAuthor')}
                </div>
                <div style={{ fontSize: 11, color: '#b4c5ff' }}>
                  {translate('login:quoteFaculty')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (7/12): Segmented Auth Hub */}
        <div className="ulis-auth-form-col">
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#131b2e' }}>
                {translate('login:title')}
              </h2>
              <Link
                to="/"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#004ac6',
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
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#596377' }}>
              {translate('login:subtitle')}
            </p>
          </div>

          <div className="ulis-auth-tabs">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                navigate('/login', { replace: true });
              }}
              className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
            >
              <MaterialIcon name="login" size={17} />
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
              <MaterialIcon name="person_add" size={17} />
              <span>{translate('login:toRegister')}</span>
            </button>
          </div>

          {/* Nút SSO VNU + Demo nhanh */}
          <div style={{ marginBottom: 14 }}>
            <button
              type="button"
              className="ulis-sso-fastlane-btn"
              onClick={() => handleQuickDemo('student')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    padding: '2px 7px',
                    borderRadius: 5,
                    background: '#006c49',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  {translate('common:vnuBadge')}
                </span>
                <span>{translate('login:ssoButton')}</span>
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: '#6cf8bb',
                  color: '#005236',
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {translate('login:ssoInstant')} →
              </span>
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 8,
                padding: '6px 10px',
                borderRadius: 8,
                background: '#f2f3ff',
                fontSize: 11.5,
              }}
            >
              <span style={{ color: '#596377' }}>{translate('login:demoAccountHint')}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('student')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 5,
                    border: '1px solid #004ac6',
                    background: '#ffffff',
                    color: '#004ac6',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {translate('login:quickDemoStudent')}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemo('admin')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 5,
                    border: '1px solid #006c49',
                    background: '#ffffff',
                    color: '#006c49',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {translate('login:quickDemoAdmin')}
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: '#737686',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              margin: '4px 0 12px',
            }}
          >
            — {translate('login:orDivider')} —
          </div>

          {activeTab === 'login' ? (
            <Form<LoginFormValues>
              layout="vertical"
              onFinish={onLoginFinish}
              initialValues={{
                username: 'an.nv@ulis.edu.vn',
                keepLogin: true,
              }}
            >
              <Form.Item
                name="username"
                label={translate('login:username')}
                extra={
                  <span style={{ fontSize: 11, color: '#006c49' }}>
                    ✓ {translate('login:emailDomainNote')}
                  </span>
                }
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
                  placeholder={translate('login:usernamePlaceholder')}
                  suffix={<span style={{ fontSize: 11, fontWeight: 700, color: '#006c49' }}>.edu.vn</span>}
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
                <Input.Password placeholder={translate('login:passwordPlaceholder')} />
              </Form.Item>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <Form.Item name="keepLogin" valuePropName="checked" noStyle>
                  <Checkbox>{translate('login:keepLogin')}</Checkbox>
                </Form.Item>
                <Link
                  to="/otp-verify?email=an.nv%40ulis.edu.vn&reset=1"
                  style={{ fontSize: 12, fontWeight: 700, color: '#004ac6' }}
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
                style={{ height: 40 }}
              >
                {translate('login:submitLogin')}
              </Button>
            </Form>
          ) : (
            <Form<RegisterFormValues> layout="vertical" onFinish={onRegisterFinish}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                  <Input autoFocus placeholder={translate('register:fullNamePlaceholder')} />
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
                    {
                      pattern: COMMON_VALIDATION_PATTERN.CODE,
                      message: translate('common:validation.codePattern', {
                        field: translate('register:msv'),
                      }),
                    },
                  ]}
                >
                  <Input placeholder={translate('register:msvPlaceholder')} />
                </Form.Item>
              </div>

              <Form.Item name="majorCourse" label={translate('register:majorCourse')}>
                <Input placeholder={translate('register:majorCoursePlaceholder')} />
              </Form.Item>

              <Form.Item
                name="email"
                label={translate('register:email')}
                extra={
                  <span style={{ fontSize: 11, color: '#006c49' }}>
                    {translate('register:otpSendNote')}
                  </span>
                }
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                style={{ height: 40 }}
              >
                {translate('register:submit')}
              </Button>
            </Form>
          )}

          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid #eef1f8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11.5,
              color: '#596377',
            }}
          >
            <span>{translate('login:honorNote')}</span>
            <span style={{ fontWeight: 700, color: '#004ac6' }}>
              {translate('login:securityToken')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <AuthSplitPage defaultTab="login" />;
}

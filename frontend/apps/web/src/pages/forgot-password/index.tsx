import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { App, Button, Form, Input, MaterialIcon } from '@ulis/components';
import { COMMON_VALIDATION_PATTERN, translate } from '@ulis/locale';
import { extractErrorMessage, forgotPassword } from '../../services/auth';

interface ForgotPasswordFormValues {
  email: string;
}

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();
  const navigate = useNavigate();

  const onFinish = async (values: ForgotPasswordFormValues) => {
    const cleanEmail = values.email.trim();
    setSubmitting(true);
    try {
      await forgotPassword({ email: cleanEmail });
      message.success(translate('forgotPassword:success'));
      navigate(`/otp-verify?email=${encodeURIComponent(cleanEmail)}&reset=1`);
    } catch (e) {
      const errMsg = extractErrorMessage(e);
      if (!errMsg) {
        message.success(translate('forgotPassword:success'));
        navigate(`/otp-verify?email=${encodeURIComponent(cleanEmail)}&reset=1`);
      } else {
        message.error(errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ulis-auth-page">
      <div className="ulis-otp-card">
        <div
          style={{
            height: 6,
            background: 'linear-gradient(90deg, #004ac6 0%, #2563eb 55%, #006c49 100%)',
          }}
        />

        <div style={{ padding: '28px 32px 24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                background: '#eef2ff',
                border: '1px solid #dbe1ff',
                color: '#004ac6',
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              <MaterialIcon name="lock_reset" size={15} />
              <span>{translate('forgotPassword:securityBadge')}</span>
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#737686' }}>
              {translate('otp:casVersion')}
            </span>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <h1
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 22,
                fontWeight: 800,
                color: '#191c1e',
                margin: '0 0 8px',
              }}
            >
              {translate('forgotPassword:title')}
            </h1>
            <p style={{ fontSize: 13, color: '#434655', margin: 0, lineHeight: 1.55 }}>
              {translate('forgotPassword:subtitle')}
            </p>
          </div>

          <Form<ForgotPasswordFormValues> layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="email"
              label={translate('forgotPassword:emailLabel')}
              rules={[
                {
                  required: true,
                  message: translate('common:validation.required', {
                    field: translate('forgotPassword:emailLabel'),
                  }),
                },
                {
                  pattern: COMMON_VALIDATION_PATTERN.EDU_EMAIL,
                  message: translate('register:emailPlaceholder'),
                },
              ]}
            >
              <Input
                autoFocus
                size="large"
                placeholder={translate('forgotPassword:emailPlaceholder')}
                prefix={<MaterialIcon name="mail" size={18} style={{ color: '#737686' }} />}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitting}
              className="ulis-primary-btn"
              style={{ height: 42, marginTop: 4 }}
            >
              {translate('forgotPassword:submit')}
            </Button>
          </Form>

          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 13,
                fontWeight: 700,
                color: '#004ac6',
              }}
            >
              <MaterialIcon name="arrow_back" size={16} />
              <span>{translate('forgotPassword:backToLogin')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

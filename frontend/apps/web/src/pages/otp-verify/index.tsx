import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { App, Button, Card, Input, Space, Typography } from 'antd';
import { translate } from '@ulis/locale';
import { extractErrorMessage, resendOtp, verifyOtp } from '../../services/auth';

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Màn nhập OTP (6 chữ số) để kích hoạt tài khoản. Có resend + đếm ngược cooldown.
 */
export default function OtpVerifyPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { message } = App.useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const onVerify = async () => {
    if (!/^\d{6}$/.test(otp)) {
      message.warning(translate('otp:otpRequired'));
      return;
    }
    setVerifying(true);
    try {
      await verifyOtp({ email, otpCode: otp });
      message.success(translate('otp:success'));
      navigate('/login', { replace: true });
    } catch (e) {
      message.error(extractErrorMessage(e) ?? translate('common:unknownError'));
    } finally {
      setVerifying(false);
    }
  };

  const onResend = async () => {
    setResending(true);
    try {
      await resendOtp({ email });
      message.success(translate('otp:resendSuccess'));
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setOtp('');
    } catch (e) {
      message.error(extractErrorMessage(e) ?? translate('common:unknownError'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="login-screen">
      <Card className="login-card">
        <Typography.Title level={3} style={{ textAlign: 'center' }}>
          {translate('otp:title')}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center' }}>
          {translate('otp:subtitle')} <strong>{email}</strong>
        </Typography.Paragraph>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Input.OTP
            length={6}
            value={otp}
            onChange={setOtp}
            disabled={verifying}
            style={{ width: '100%', justifyContent: 'center' }}
          />
          <Button type="primary" block loading={verifying} onClick={onVerify}>
            {translate('otp:submit')}
          </Button>
          <div style={{ textAlign: 'center' }}>
            {countdown > 0 ? (
              <Typography.Text type="secondary">
                {translate('otp:resendCountdown', { seconds: countdown })}
              </Typography.Text>
            ) : (
              <Button type="link" loading={resending} onClick={onResend}>
                {translate('otp:resend')}
              </Button>
            )}
          </div>
        </Space>
        <Typography.Paragraph style={{ marginTop: 16, textAlign: 'center' }}>
          <Link to="/register">{translate('register:haveAccount')} </Link>·{' '}
          <Link to="/login">{translate('otp:toLogin')}</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}

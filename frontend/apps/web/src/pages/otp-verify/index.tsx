import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { App, Button, Form, Input, MaterialIcon } from '@ulis/components';
import { translate } from '@ulis/locale';
import {
  extractErrorMessage,
  forgotPassword,
  peekDevOtp,
  resendOtp,
  resetPassword,
  verifyOtp,
} from '../../services/auth';

const RESEND_COOLDOWN_SECONDS = 60;

export default function OtpVerifyPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const initialResetOpen = searchParams.get('reset') === '1';

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [devOtpHint, setDevOtpHint] = useState<string>('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [remainingTries, setRemainingTries] = useState(5);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const { message } = App.useApp();
  const navigate = useNavigate();

  const loadDevOtp = useCallback(async () => {
    if (!email) return;
    try {
      const res = await peekDevOtp(email);
      const code = res.data?.data?.otpCode ?? '';
      if (/^\d{6}$/.test(code)) {
        setDevOtpHint(code);
        setDigits(code.split(''));
      }
    } catch {
      // Bỏ qua khi chạy ở prod hoặc không có dev-peek
    }
  }, [email]);

  useEffect(() => {
    loadDevOtp();
  }, [loadDevOtp]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleDigitChange = (index: number, value: string) => {
    const onlyNums = value.replace(/\D/g, '');
    if (onlyNums.length === 6) {
      setDigits(onlyNums.split(''));
      inputRefs.current[5]?.focus();
      return;
    }
    const clean = onlyNums.slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const otpCode = digits.join('');

  const onVerify = async () => {
    if (!/^\d{6}$/.test(otpCode)) {
      message.warning(translate('otp:otpRequired'));
      return;
    }
    setVerifying(true);
    try {
      await verifyOtp({ email, otpCode });
      message.success(translate('otp:success'));
      navigate('/login', { replace: true });
    } catch (e) {
      const errMsg = extractErrorMessage(e);
      message.error(errMsg || translate('common:unknownError'));
    } finally {
      setVerifying(false);
    }
  };

  const onResend = async () => {
    if (countdown > 0 || remainingTries <= 0) return;
    setResending(true);
    try {
      if (initialResetOpen) {
        await forgotPassword({ email });
      } else {
        await resendOtp({ email });
      }
      message.success(translate('otp:resendSuccess'));
      setCountdown(RESEND_COOLDOWN_SECONDS);
      setRemainingTries((c) => Math.max(0, c - 1));
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      await loadDevOtp();
    } catch (e) {
      const errMsg = extractErrorMessage(e);
      message.error(errMsg || translate('common:unknownError'));
    } finally {
      setResending(false);
    }
  };

  const hasMin8 = newPassword.length >= 8;

  const onResetPassword = async () => {
    if (!/^\d{6}$/.test(otpCode)) {
      message.warning(translate('otp:otpRequired'));
      return;
    }
    if (!hasMin8) {
      message.error(translate('register:passwordMin'));
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error(translate('register:confirmNotMatch'));
      return;
    }
    setVerifying(true);
    try {
      await resetPassword({ email, otpCode, newPassword });
      message.success(translate('otp:resetSuccess'));
      navigate('/login', { replace: true });
    } catch (e) {
      const errMsg = extractErrorMessage(e);
      message.error(errMsg || translate('common:unknownError'));
    } finally {
      setVerifying(false);
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
            marginBottom: 20,
          }}
        >
          <Link to="/" className="ulis-brand" style={{ textDecoration: 'none' }}>
            <span className="brand-icon">
              <MaterialIcon name="menu_book" size={19} />
            </span>
            <span className="brand-title">{translate('common:appName')}</span>
          </Link>

          <Link
            to="/login"
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
            <span>{translate('otp:toLogin')}</span>
          </Link>
        </div>

        <div style={{ marginBottom: 18 }}>
          <h1
            style={{
              margin: '0 0 6px',
              fontFamily: "'Merriweather', Georgia, serif",
              fontSize: 22,
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            {initialResetOpen ? translate('otp:resetSubmit') : translate('otp:title')}
          </h1>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
            {translate('otp:subtitlePrefix')} <strong>{email}</strong>
          </p>

          {devOtpHint && (
            <div
              onClick={() => setDigits(devOtpHint.split(''))}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#065f46',
                fontSize: 12.5,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <span>
                Mã OTP (Dev Local): <strong style={{ fontSize: 14, letterSpacing: 1 }}>{devOtpHint}</strong>
              </span>
              <span style={{ fontSize: 11.5, textDecoration: 'underline' }}>Đã tự động điền</span>
            </div>
          )}
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: 6,
            }}
          >
            {translate('otp:otpLabel')} <span style={{ color: '#ef4444' }}>*</span>
          </label>

          <div className="ulis-otp-digits">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                aria-label={`OTP ${idx + 1}`}
                className="otp-digit-input"
                value={digit}
                autoFocus={idx === 0}
                onPaste={handlePaste}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
              />
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: 8,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              marginBottom: 16,
              fontSize: 12,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 600, color: '#475569' }}>
              <MaterialIcon name="timer" size={16} style={{ color: '#2563eb' }} />
              <span>{translate('otp:resendCountdown', { seconds: countdown })}</span>
            </span>

            <button
              type="button"
              disabled={countdown > 0 || resending}
              onClick={onResend}
              style={{
                border: 'none',
                background: 'none',
                fontSize: 12,
                fontWeight: 600,
                color: countdown > 0 ? '#94a3b8' : '#2563eb',
                cursor: countdown > 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {translate('otp:resend')} {translate('otp:remainingTries', { count: remainingTries })}
            </button>
          </div>

          {!initialResetOpen ? (
            <Button
              type="primary"
              block
              loading={verifying}
              onClick={onVerify}
              className="ulis-primary-btn"
              style={{ height: 42 }}
            >
              {translate('otp:submit')}
            </Button>
          ) : (
            <Form layout="vertical" onFinish={onResetPassword}>
              <Form.Item label={translate('otp:newPassword')} required>
                <Input.Password
                  size="large"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={translate('otp:newPasswordPlaceholder')}
                />
              </Form.Item>

              <Form.Item label={translate('otp:confirmNewPassword')} required>
                <Input.Password
                  size="large"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={translate('otp:confirmNewPasswordPlaceholder')}
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                loading={verifying}
                className="ulis-primary-btn"
                style={{ height: 42, marginTop: 4 }}
              >
                {translate('otp:resetSubmit')}
              </Button>
            </Form>
          )}
        </div>
      </div>
    </div>
  );
}

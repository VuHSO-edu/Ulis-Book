import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { App, Button, Form, Input, MaterialIcon } from '@ulis/components';
import { translate } from '@ulis/locale';
import {
  extractErrorMessage,
  forgotPassword,
  resendOtp,
  resetPassword,
  verifyOtp,
} from '../../services/auth';

const RESEND_COOLDOWN_SECONDS = 45;

export default function OtpVerifyPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || 'an.nv@ulis.edu.vn';
  const initialResetOpen = searchParams.get('reset') === '1';

  const [digits, setDigits] = useState<string[]>(['8', '4', '9', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN_SECONDS);
  const [remainingTries, setRemainingTries] = useState(4);
  const [showResetSection, setShowResetSection] = useState(initialResetOpen);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const { message } = App.useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleDigitChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
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
      if (!errMsg) {
        message.success(translate('otp:success'));
        navigate('/login', { replace: true });
      } else {
        message.error(errMsg);
      }
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
    } catch {
      message.success(translate('otp:resendSuccess'));
    } finally {
      setCountdown(60);
      setRemainingTries((c) => Math.max(0, c - 1));
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setResending(false);
    }
  };

  const hasMin8 = newPassword.length >= 8;
  const hasAlphanumeric = /[A-Za-z]/.test(newPassword) && /\d/.test(newPassword);

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
      if (!errMsg) {
        message.success(translate('otp:resetSuccess'));
        navigate('/login', { replace: true });
      } else {
        message.error(errMsg);
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="ulis-auth-page">
      <div className="ulis-otp-card">
        {/* Top Accent Gradient Bar */}
        <div
          style={{
            height: 6,
            background: 'linear-gradient(90deg, #004ac6 0%, #2563eb 55%, #006c49 100%)',
          }}
        />

        <div style={{ padding: '28px 32px 24px' }}>
          {/* Header Security Badge */}
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
              <MaterialIcon name="verified_user" size={15} />
              <span>{translate('otp:securityBadge')}</span>
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#737686' }}>
              {translate('otp:casVersion')}
            </span>
          </div>

          {/* Icon + Title + Email Pill */}
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div
              style={{
                width: 56,
                height: 56,
                margin: '0 auto 12px',
                borderRadius: 16,
                background: '#eef2ff',
                border: '1px solid #dbe1ff',
                color: '#004ac6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <MaterialIcon name="mark_email_read" size={28} />
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '2px solid #ffffff',
                }}
              />
            </div>

            <h1 style={{ margin: '0 0 6px', fontSize: 21, fontWeight: 800, color: '#131b2e' }}>
              {translate('otp:title')}
            </h1>
            <p style={{ margin: '0 0 10px', fontSize: 13, color: '#596377' }}>
              {translate('otp:subtitle')}
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 8,
                background: '#f2f3ff',
                border: '1px solid #d5dcff',
                fontSize: 13,
                fontWeight: 700,
                color: '#1677ff',
              }}
            >
              <MaterialIcon name="alternate_email" size={16} />
              <span>{email}</span>
              <MaterialIcon name="check_circle" size={15} style={{ color: '#006c49' }} />
            </div>
          </div>

          {/* 6-digit OTP inputs */}
          <div>
            <label
              style={{
                display: 'block',
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: '#000000',
              }}
            >
              {translate('otp:otpLabel')} <span style={{ color: '#ba1a1a' }}>*</span>
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
                  maxLength={1}
                  aria-label={`OTP ${idx + 1}`}
                  className="otp-digit-input"
                  value={digit}
                  autoFocus={idx === 3}
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
                background: '#f2f3ff',
                marginBottom: 16,
                fontSize: 12,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700 }}>
                <MaterialIcon name="timer" size={16} style={{ color: '#004ac6' }} />
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
                  fontWeight: 700,
                  color: countdown > 0 ? '#8c95a6' : '#1677ff',
                  cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {translate('otp:resend')} {translate('otp:remainingTries', { count: remainingTries })}
              </button>
            </div>

            <Button
              type="primary"
              block
              loading={verifying}
              onClick={onVerify}
              className="ulis-primary-btn"
              style={{ height: 40 }}
            >
              {translate('otp:submit')}
            </Button>
          </div>

          {/* Expandable Password Reset via OTP */}
          <div
            style={{
              textAlign: 'center',
              margin: '16px 0 12px',
              fontSize: 11,
              fontWeight: 700,
              color: '#737686',
            }}
          >
            — {translate('otp:orDivider')} —
          </div>

          <div
            style={{
              borderRadius: 10,
              border: '1px solid #d5dcff',
              background: '#faf8ff',
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => setShowResetSection((v) => !v)}
              style={{
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MaterialIcon name="lock_reset" size={20} style={{ color: '#004ac6' }} />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#131b2e' }}>
                    {translate('otp:resetToggleTitle')}
                  </div>
                  <div style={{ fontSize: 11, color: '#596377' }}>
                    {translate('otp:resetToggleDesc')}
                  </div>
                </div>
              </div>
              <MaterialIcon name={showResetSection ? 'expand_less' : 'expand_more'} size={20} />
            </div>

            {showResetSection && (
              <div style={{ padding: '12px 14px 14px', borderTop: '1px solid #e2e7ff' }}>
                <Form layout="vertical" onFinish={onResetPassword}>
                  <Form.Item label={translate('otp:newPassword')} required>
                    <Input.Password
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={translate('otp:newPasswordPlaceholder')}
                    />
                  </Form.Item>

                  <Form.Item label={translate('otp:confirmNewPassword')} required>
                    <Input.Password
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={translate('otp:confirmNewPasswordPlaceholder')}
                    />
                  </Form.Item>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      marginBottom: 12,
                      fontSize: 11.5,
                    }}
                  >
                    <span
                      style={{
                        color: hasMin8 ? '#006c49' : '#737686',
                        fontWeight: 700,
                      }}
                    >
                      {hasMin8 ? '✓' : '○'} {translate('otp:rule8Chars')}
                    </span>
                    <span
                      style={{
                        color: hasAlphanumeric ? '#006c49' : '#737686',
                        fontWeight: 700,
                      }}
                    >
                      {hasAlphanumeric ? '✓' : '○'} {translate('otp:ruleAlphanumeric')}
                    </span>
                  </div>

                  <Button
                    htmlType="submit"
                    block
                    className="ulis-primary-btn"
                    style={{ height: 36 }}
                  >
                    {translate('otp:resetSubmit')}
                  </Button>
                </Form>
              </div>
            )}
          </div>
        </div>

        {/* Footer Trust Banner */}
        <div
          style={{
            padding: '14px 28px',
            background: '#f2f3ff',
            borderTop: '1px solid #e2e7ff',
            fontSize: 11.5,
            color: '#596377',
          }}
        >
          <p style={{ margin: '0 0 10px', lineHeight: 1.45 }}>{translate('otp:trustNotice')}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link
              to="/login"
              style={{
                fontWeight: 700,
                color: '#004ac6',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <MaterialIcon name="arrow_back" size={14} />
              <span>{translate('otp:toLogin')}</span>
            </Link>
            <span>
              {translate('otp:cloudBadge')} · {translate('otp:tlsBadge')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

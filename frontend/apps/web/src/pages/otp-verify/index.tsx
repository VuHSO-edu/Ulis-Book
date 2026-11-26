import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
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
import NextBookLogo from '../../components/NextBookLogo';

const RESEND_COOLDOWN_SECONDS = 60;

/**
 * Màn hình xác thực OTP theo giao diện Web mới (TASK-11):
 * Split layout đồng bộ với Login/Register, font Lexend, Heading in đậm, 6 ô OTP rõ nét.
 */
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

  if (!email) {
    return <Navigate to="/register" replace />;
  }

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

  const onResetPassword = async () => {
    if (!/^\d{6}$/.test(otpCode)) {
      message.warning(translate('otp:otpRequired'));
      return;
    }
    if (newPassword.length < 8) {
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
      <div className="ulis-auth-booknet-shell">
        {/* Left Editorial Panel — Đồng bộ hoàn toàn ngôn ngữ thiết kế Web mới */}
        <div
          style={{
            padding: '32px 26px',
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
          <NextBookLogo showDomainBadge size={42} />

          <h2
            style={{
              margin: 0,
              fontSize: 22,
              lineHeight: 1.35,
              color: 'var(--ulis-midnight-violet)',
              maxWidth: 340,
            }}
          >
            {translate('otp:title')}
          </h2>

          <div
            style={{
              width: '100%',
              maxWidth: 310,
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
              name="verified_user"
              size={48}
              style={{ color: 'var(--ulis-french-blue)' }}
            />
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ulis-midnight-violet)' }}>
              {translate('otp:securityBadge')}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--ulis-midnight-muted)',
                lineHeight: 1.55,
              }}
            >
              {translate('otp:trustNotice')}
            </div>
          </div>

          <Link
            to="/login"
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: 'var(--ulis-french-blue)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <MaterialIcon name="arrow_back" size={16} />
            <span>{translate('otp:toLogin')}</span>
          </Link>
        </div>

        {/* Right OTP Card */}
        <div
          style={{
            padding: '28px 32px',
            borderRadius: 4,
            background: 'var(--ulis-seashell)',
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 10px',
                borderRadius: 4,
                background: 'var(--ulis-wheat)',
                color: 'var(--ulis-midnight-violet)',
                fontSize: 11.5,
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              <MaterialIcon name="mark_email_read" size={15} />
              <span>{translate('common:vnuVerified')}</span>
            </span>

            <h1 style={{ margin: '0 0 8px', fontSize: 23 }}>
              {initialResetOpen ? translate('otp:resetSubmit') : translate('otp:title')}
            </h1>
            <p
              style={{
                margin: '0 0 12px',
                fontSize: 13,
                color: 'var(--ulis-midnight-muted)',
                lineHeight: 1.55,
              }}
            >
              {translate('otp:subtitle')}{' '}
              <strong style={{ color: 'var(--ulis-french-blue)' }}>{email}</strong>
            </p>

            {devOtpHint && (
              <div
                onClick={() => setDigits(devOtpHint.split(''))}
                style={{
                  padding: '10px 14px',
                  borderRadius: 4,
                  background: '#dceee9',
                  color: '#2e6f5e',
                  fontSize: 12.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
              >
                <span>
                  Mã OTP (Dev Local):{' '}
                  <strong style={{ fontSize: 15, letterSpacing: 2 }}>{devOtpHint}</strong>
                </span>
                <span style={{ fontSize: 11.5, textDecoration: 'underline' }}>Đã tự động điền</span>
              </div>
            )}
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13.5,
                fontWeight: 700,
                color: 'var(--ulis-midnight-violet)',
                marginBottom: 8,
              }}
            >
              {translate('otp:otpLabel')} <span style={{ color: '#c83e3b' }}>*</span>
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
                  style={{
                    background: '#ffffff',
                    border: digit
                      ? '2px solid var(--ulis-french-blue)'
                      : '1px solid var(--ulis-border)',
                  }}
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
                padding: '10px 14px',
                borderRadius: 4,
                background: 'var(--ulis-wheat)',
                marginBottom: 18,
                fontSize: 12.5,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 700,
                  color: 'var(--ulis-midnight-violet)',
                }}
              >
                <MaterialIcon name="timer" size={16} />
                <span>{translate('otp:resendCountdown', { seconds: countdown })}</span>
              </span>

              <button
                type="button"
                disabled={countdown > 0 || resending}
                onClick={onResend}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color:
                    countdown > 0 ? 'var(--ulis-midnight-muted)' : 'var(--ulis-french-blue)',
                  cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                  textDecoration: countdown > 0 ? 'none' : 'underline',
                }}
              >
                {translate('otp:resend')}{' '}
                {translate('otp:remainingTries', { count: remainingTries })}
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
    </div>
  );
}

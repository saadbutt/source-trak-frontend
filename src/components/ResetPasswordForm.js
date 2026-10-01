import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHash, FiLock, FiMail } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import IconField from './IconField';

const RESEND_COOLDOWN_SECONDS = 60;
// Surface "request a new code" prominently after this many failed attempts so
// the user doesn't get stuck after the backend silently consumes the code at 5.
const ATTEMPTS_BEFORE_RESEND_HINT = 2;

const validatePassword = (pw) => {
  if (pw.length < 10) return 'Password must be at least 10 characters.';
  if (!/[A-Za-z]/.test(pw)) return 'Password must contain at least one letter.';
  if (!/\d/.test(pw)) return 'Password must contain at least one digit.';
  return null;
};

// Shared by the /reset-password page and the landing-page auth panel.
// `onDone(email)` replaces navigation to /login; `onBack` replaces the
// "Back to sign in" link.
const ResetPasswordForm = ({ initialEmail = '', onDone, onBack }) => {
  const navigate = useNavigate();
  const { resetPassword, forgotPassword } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [info, setInfo] = useState(initialEmail
    ? `We sent a 6-digit code to ${initialEmail}. It expires in 30 minutes.`
    : 'Enter your email and the 6-digit code we sent you.'
  );
  const [cooldown, setCooldown] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const clearErrors = () => {
    setCodeError('');
    setPasswordError('');
    setGeneralError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();

    if (!email) {
      setGeneralError('Email is required.');
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setCodeError('Enter the 6-digit code from your email.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    const pwError = validatePassword(password);
    if (pwError) {
      setPasswordError(pwError);
      return;
    }

    setIsLoading(true);
    const result = await resetPassword(email, code, password);
    setIsLoading(false);

    if (result.success) {
      if (onDone) {
        onDone(email);
      } else {
        navigate(`/login?email=${encodeURIComponent(email)}`, {
          replace: true,
          state: { flash: 'Password updated. Please sign in with your new password.' },
        });
      }
      return;
    }

    // Branch on the server's error string to surface field-level errors.
    const msg = (result.error || '').toLowerCase();
    if (msg.includes('invalid or expired')) {
      setFailedAttempts((n) => n + 1);
      setCodeError('Invalid or expired code. Request a new one if it has been a while.');
    } else if (msg.includes('password must')) {
      setPasswordError(result.error);
    } else {
      setGeneralError(result.error);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email || isResending) return;
    clearErrors();
    setInfo('');
    setIsResending(true);
    const result = await forgotPassword(email);
    setIsResending(false);

    if (result.success) {
      setInfo(`A new 6-digit code has been sent to ${email}. The previous code is no longer valid.`);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setFailedAttempts(0);
      setCode('');
    } else {
      setGeneralError(result.error);
    }
  };

  const showResendHint = failedAttempts >= ATTEMPTS_BEFORE_RESEND_HINT;

  return (
    <>
      <form onSubmit={handleSubmit} className="auth-form">
        {info && <div className="info-message">{info}</div>}

        <IconField
          id="email"
          label="Email"
          icon={FiMail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          readOnly={Boolean(initialEmail)}
          autoComplete="email"
          required
        />

        <IconField
          id="code"
          label="Verification code"
          icon={FiHash}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          helper={codeError ? <span className="field-error">{codeError}</span> : null}
          required
        />

        <IconField
          id="password"
          label="New password"
          icon={FiLock}
          reveal
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 10 characters"
          autoComplete="new-password"
          required
        />

        <IconField
          id="confirmPassword"
          label="Confirm password"
          icon={FiLock}
          reveal
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter password"
          autoComplete="new-password"
          helper={passwordError ? <span className="field-error">{passwordError}</span> : null}
          required
        />

        {generalError && <div className="error-message">{generalError}</div>}

        <button
          type="submit"
          className="btn btn-primary auth-submit"
          disabled={isLoading}
        >
          {isLoading ? 'Updating...' : 'Update Password'}
        </button>
      </form>

      <div className="auth-footer">
        <p style={showResendHint ? { fontWeight: 600 } : undefined}>
          {showResendHint ? 'Need a new code? ' : "Didn't get the code? "}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending || !email}
            className="auth-link link-button"
          >
            {isResending
              ? 'Sending...'
              : cooldown > 0
                ? `Send a new code in ${cooldown}s`
                : 'Send a new code'}
          </button>
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          {onBack ? (
            <button type="button" onClick={onBack} className="auth-link link-button">Back to sign in</button>
          ) : (
            <Link to="/login" className="auth-link">Back to sign in</Link>
          )}
        </p>
      </div>
    </>
  );
};

export default ResetPasswordForm;

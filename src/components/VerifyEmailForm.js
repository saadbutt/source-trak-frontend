import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHash, FiMail } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import IconField from './IconField';

const RESEND_COOLDOWN_SECONDS = 60;

// Shared by the /verify-email page and the landing-page auth panel.
// `onBack` replaces the "Back to sign in" link when embedded in the panel.
const VerifyEmailForm = ({ initialEmail = '', onBack }) => {
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }

    setIsLoading(true);
    const result = await verifyEmail(email, code);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      // The server returns one identical 400 for every failure mode (mismatch,
      // expired, max attempts, unknown email). Surface it as-is.
      setError(result.error || 'Invalid or expired code.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;
    setError('');
    setInfo('');
    setIsResending(true);
    const result = await resendVerification(email);
    setIsResending(false);

    if (result.success) {
      setInfo('If your email is registered, a new code has been sent.');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } else {
      setError(result.error);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="auth-form">
        <IconField
          id="email"
          label="Email"
          icon={FiMail}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
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
          required
        />

        {info && <div className="info-message">{info}</div>}
        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          className="btn btn-primary auth-submit"
          disabled={isLoading}
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <div className="auth-footer">
        <p>
          Didn't get a code?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending || !email}
            className="auth-link link-button"
          >
            {isResending
              ? 'Sending...'
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : 'Resend code'}
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

export default VerifyEmailForm;

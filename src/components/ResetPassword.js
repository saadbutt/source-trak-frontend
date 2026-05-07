import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import Footer from './Footer';
import '../styles/Auth.css';

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

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword, forgotPassword } = useAuth();

  const initialEmail = searchParams.get('email') || '';
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
      navigate(`/login?email=${encodeURIComponent(email)}`, {
        replace: true,
        state: { flash: 'Password updated. Please sign in with your new password.' },
      });
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
    <div className="auth-page">
      <Header />

      <main className="auth-main">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1>Set a new password</h1>
              <p>Choose a strong password — at least 10 characters with a letter and a digit.</p>
            </div>

            {info && (
              <div className="info-message" style={{ marginBottom: '1rem' }}>
                {info}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="you@example.com"
                  readOnly={Boolean(initialEmail)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="code" className="form-label">Verification Code</label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="form-input"
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                />
                {codeError && (
                  <div className="error-message" style={{ marginTop: '0.5rem' }}>
                    {codeError}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">New Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="At least 10 chars, 1 letter, 1 digit"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  placeholder="Confirm your new password"
                  required
                />
                {passwordError && (
                  <div className="error-message" style={{ marginTop: '0.5rem' }}>
                    {passwordError}
                  </div>
                )}
              </div>

              {generalError && (
                <div className="error-message" style={{ marginBottom: '1rem' }}>
                  {generalError}
                </div>
              )}

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
                  className="auth-link"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: cooldown > 0 || !email ? 'not-allowed' : 'pointer',
                    opacity: cooldown > 0 || !email ? 0.6 : 1,
                  }}
                >
                  {isResending
                    ? 'Sending...'
                    : cooldown > 0
                      ? `Send a new code in ${cooldown}s`
                      : 'Send a new code'}
                </button>
              </p>
              <p style={{ marginTop: '0.5rem' }}>
                <Link to="/login" className="auth-link">Back to sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPassword;

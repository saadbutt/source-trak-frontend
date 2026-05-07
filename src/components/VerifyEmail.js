import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import Footer from './Footer';
import '../styles/Auth.css';

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();

  const [email, setEmail] = useState(searchParams.get('email') || '');
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
    <div className="auth-page">
      <Header />

      <main className="auth-main">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1>Verify Your Email</h1>
              <p>Enter the 6-digit code we sent to your inbox.</p>
            </div>

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
              </div>

              {info && (
                <div className="info-message" style={{ marginBottom: '1rem' }}>
                  {info}
                </div>
              )}
              {error && (
                <div className="error-message" style={{ marginBottom: '1rem' }}>
                  {error}
                </div>
              )}

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
                      ? `Resend in ${cooldown}s`
                      : 'Resend code'}
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

export default VerifyEmail;

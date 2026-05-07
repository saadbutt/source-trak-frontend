import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import Footer from './Footer';
import '../styles/Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await forgotPassword(email);
    setIsLoading(false);

    if (result.success) {
      // Anti-enumeration: navigate regardless of whether the email exists. The
      // "check your inbox" message lives on the next screen so this one never
      // leaks user existence.
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      return;
    }
    setError(result.error);
  };

  return (
    <div className="auth-page">
      <Header />

      <main className="auth-main">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1>Reset your password</h1>
              <p>Enter the email associated with your account and we'll send you a 6-digit code.</p>
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
                {isLoading ? 'Sending...' : 'Send Code'}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Remembered it?{' '}
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

export default ForgotPassword;

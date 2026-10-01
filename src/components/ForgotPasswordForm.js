import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import IconField from './IconField';

// Shared by the /forgot-password page and the landing-page auth panel.
// `onCodeSent(email)` replaces navigation to /reset-password; `onBack` replaces
// the "Back to sign in" link.
const ForgotPasswordForm = ({ initialEmail = '', onCodeSent, onBack }) => {
  const [email, setEmail] = useState(initialEmail);
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
      // Anti-enumeration: continue regardless of whether the email exists. The
      // "check your inbox" message lives on the next step so this one never
      // leaks user existence.
      if (onCodeSent) onCodeSent(email);
      else navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      return;
    }
    setError(result.error);
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

        {error && <div className="error-message">{error}</div>}

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

export default ForgotPasswordForm;

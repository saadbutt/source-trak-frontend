import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { FiLock, FiMail } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import IconField from './IconField';

// Shared by the /login page and the landing-page auth panel. In the panel,
// `onForgotPassword` replaces the /forgot-password link, and `initialEmail` /
// `flash` stand in for the ?email= param and router-state flash message.
const LoginForm = ({ onForgotPassword, initialEmail, flash }) => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: initialEmail ?? (searchParams.get('email') || ''),
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const message = flash ?? location.state?.flash;
    if (message) setInfo(message);
  }, [flash, location.state]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setInfo('');

    const result = await login(formData.email, formData.password);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <IconField
        id="email"
        label="Email"
        icon={FiMail}
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="you@company.com"
        autoComplete="email"
        required
      />

      <IconField
        id="password"
        label="Password"
        icon={FiLock}
        reveal
        value={formData.password}
        onChange={handleChange}
        placeholder="Your password"
        autoComplete="current-password"
        required
      />

      <div className="auth-inline-links" style={{ marginBottom: '1rem', textAlign: 'right' }}>
        {onForgotPassword ? (
          <button type="button" onClick={onForgotPassword} className="auth-link link-button">Forgot password?</button>
        ) : (
          <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
        )}
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
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  );
};

export default LoginForm;

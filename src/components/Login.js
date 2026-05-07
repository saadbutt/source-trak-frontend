import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import Footer from './Footer';
import '../styles/Auth.css';

const Login = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    if (location.state?.flash) setInfo(location.state.flash);
  }, [location.state]);

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
    <div className="auth-page">
      <Header />

      <main className="auth-main">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-header">
              <h1>Welcome Back</h1>
              <p>Sign in to your SourceTrak account</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="auth-inline-links" style={{ marginBottom: '1rem', textAlign: 'right' }}>
                <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
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

            <div className="auth-footer">
              <p>
                Don't have an account?
                <Link to="/signup" className="auth-link">Sign up here</Link>
              </p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                Need to verify your email?
                <Link to="/verify-email" className="auth-link">Enter your code</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;

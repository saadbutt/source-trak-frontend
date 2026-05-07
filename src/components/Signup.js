import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import Footer from './Footer';
import '../styles/Auth.css';

// Backend at staging.sourcetrak.com accepts these exact role strings (verified
// from its 400 response). The "4-role" list in the API reference doc does not
// match the deployed reality — staging is the source of truth.
const ROLE_OPTIONS = [
  { value: 'Farm/Producer', label: 'Farm/Producer (Origin Stage)' },
  { value: 'Processing/Packaging', label: 'Processing/Packaging' },
  { value: 'Logistics & Cold Chain Monitoring', label: 'Logistics & Cold Chain Monitoring' },
  { value: 'Distribution/Retail', label: 'Distribution/Retail' },
  { value: 'Consumer Interaction', label: 'Consumer Interaction' },
  { value: 'Compliance & Audit', label: 'Compliance & Audit' },
  { value: 'Analytics & Insights', label: 'Analytics & Insights' },
];

// Mirror server rules so we don't make the user round-trip a 400.
const validatePassword = (pw) => {
  if (pw.length < 10) return 'Password must be at least 10 characters.';
  if (!/[A-Za-z]/.test(pw)) return 'Password must contain at least one letter.';
  if (!/\d/.test(pw)) return 'Password must contain at least one digit.';
  return null;
};

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Farm/Producer',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const pwError = validatePassword(formData.password);
    if (pwError) {
      setError(pwError);
      return;
    }

    setIsLoading(true);
    const result = await signup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
    });
    setIsLoading(false);

    if (result.success) {
      // Anti-enumeration: the server returns the same response whether the
      // email is new or already registered. Always send the user to verify.
      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
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
              <h1>Join SourceTrak</h1>
              <p>Create your account to start tracking your supply chain</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="name" className="form-label">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Enter your full name"
                  required
                />
              </div>

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
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="role" className="form-label">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
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
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?
                <Link to="/login" className="auth-link">Sign in here</Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Signup;

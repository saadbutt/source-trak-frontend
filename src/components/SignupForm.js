import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiMail, FiMapPin, FiShoppingBag, FiTool, FiTruck, FiUser } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import IconField from './IconField';

// Backend at staging.sourcetrak.com accepts these exact role strings (verified
// from its 400 response). The "4-role" list in the API reference doc does not
// match the deployed reality — staging is the source of truth.
// Signup offers the same 4 supply-chain stages as the mobile app. Values must
// stay as the backend strings; labels are industry-neutral for demos.
const ROLE_OPTIONS = [
  { value: 'Farm/Producer', label: 'Producer (Origin)', short: 'Producer', icon: FiMapPin },
  { value: 'Processing/Packaging', label: 'Processing & Packaging', short: 'Processing', icon: FiTool },
  { value: 'Logistics & Cold Chain Monitoring', label: 'Logistics & Transport', short: 'Logistics', icon: FiTruck },
  { value: 'Distribution/Retail', label: 'Distribution & Retail', short: 'Distribution', icon: FiShoppingBag },
];

// Mirror server rules so we don't make the user round-trip a 400.
const validatePassword = (pw) => {
  if (pw.length < 10) return 'Password must be at least 10 characters.';
  if (!/[A-Za-z]/.test(pw)) return 'Password must contain at least one letter.';
  if (!/\d/.test(pw)) return 'Password must contain at least one digit.';
  return null;
};

// Shared by the /signup page and the landing-page auth panel.
// `onSignedUp(email)` replaces navigation to /verify-email.
const SignupForm = ({ onSignedUp }) => {
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
      if (onSignedUp) onSignedUp(formData.email);
      else navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } else {
      setError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form signup-form">
      <IconField
        id="name"
        label="Full name"
        icon={FiUser}
        value={formData.name}
        onChange={handleChange}
        placeholder="First and last name"
        autoComplete="name"
        required
      />

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
        placeholder="Min. 10 characters"
        autoComplete="new-password"
        helper={<>Use at least <strong>10 characters</strong>, with one letter and one digit.</>}
        required
      />

      <IconField
        id="confirmPassword"
        label="Confirm password"
        icon={FiLock}
        reveal
        value={formData.confirmPassword}
        onChange={handleChange}
        placeholder="Re-enter password"
        autoComplete="new-password"
        required
      />

      <fieldset className="form-group role-picker">
        <legend className="form-label">Your supply-chain role</legend>
        <div className="role-grid">
          {ROLE_OPTIONS.map(({ value, label, short, icon: Icon }) => (
            <label
              key={value}
              className={`role-tile ${formData.role === value ? 'selected' : ''}`}
              title={label}
            >
              <input
                type="radio"
                name="role"
                value={value}
                checked={formData.role === value}
                onChange={handleChange}
                aria-label={label}
              />
              <span className="role-tile-icon"><Icon /></span>
              <span className="role-tile-label">{short}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <div className="error-message">
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

      <p className="auth-terms">
        By continuing you agree to our <strong>Terms</strong> &amp; <strong>Privacy Policy</strong>
      </p>
    </form>
  );
};

export default SignupForm;

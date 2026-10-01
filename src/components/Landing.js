import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import VerifyEmailForm from './VerifyEmailForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import ResetPasswordForm from './ResetPasswordForm';
import '../styles/Auth.css';
import '../styles/Landing.css';

const PANEL_COPY = {
  signin: {
    title: 'Welcome back',
    subtitle: 'Sign in to record and verify supply-chain data.',
  },
  signup: {
    title: 'Create your account',
    subtitle: 'Join your supply chain on SourceTrak in a minute.',
  },
  verify: {
    title: 'Verify your email',
    subtitle: 'Enter the 6-digit code we sent to your inbox.',
  },
  forgot: {
    title: 'Reset your password',
    subtitle: "Enter the email associated with your account and we'll send you a 6-digit code.",
  },
  reset: {
    title: 'Set a new password',
    subtitle: 'Choose a strong password — at least 10 characters with a letter and a digit.',
  },
};

const PASSWORD_UPDATED = 'Password updated. Please sign in with your new password.';

// Split-screen landing: brand + headline on the left, a full-height auth
// panel on the right (mirrors the mobile auth screen). The whole auth flow —
// sign in, sign up, email verification, forgot / reset password — runs inside
// the panel without leaving the page.
const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  // 'signin' | 'signup' | 'verify' | 'forgot' | 'reset'
  const [view, setView] = useState('signin');
  // Email carried between steps (signup → verify, forgot → reset → signin).
  const [email, setEmail] = useState('');
  const [flash, setFlash] = useState('');

  const go = (next, nextEmail) => {
    if (nextEmail !== undefined) setEmail(nextEmail);
    setFlash('');
    setView(next);
  };

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Show a loader while redirecting authenticated users
  if (isAuthenticated()) {
    return (
      <div className="loading-container landing-redirect">
        <div className="loading-spinner"></div>
        <p>Redirecting to dashboard...</p>
      </div>
    );
  }

  const copy = PANEL_COPY[view];
  const isTabView = view === 'signin' || view === 'signup';

  return (
    <div className="landing-page">
      <section className="landing-brand">
        <Link to="/" className="landing-logo">
          <img src="/logo.png" alt="SourceTrak" />
        </Link>

        <div className="landing-hero">
          <h1 className="main-headline">
            <span className="blockchain-text">Blockchain-Powered</span>
            <span className="supply-chain-text">Supply Chain</span>
            <span className="transparency-text">Transparency</span>
          </h1>

          <p className="description">
            Track your products from origin to market with complete transparency.
            Our blockchain technology ensures every step of your supply chain is verified and immutable.
          </p>
        </div>

        <footer className="landing-footer">
          <p>© 2026 SourceTrak. All rights reserved.</p>
          <nav>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#contact">Contact</a>
          </nav>
        </footer>
      </section>

      <section className="landing-panel">
        <div className="landing-panel-inner">
          <div className="landing-panel-intro">
            <h2>{copy.title}</h2>
            <p>{copy.subtitle}</p>
          </div>

          {isTabView && (
            <div className="auth-seg" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={view === 'signin'}
                className={`auth-seg-item ${view === 'signin' ? 'active' : ''}`}
                onClick={() => go('signin')}
              >
                Sign in
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'signup'}
                className={`auth-seg-item ${view === 'signup' ? 'active' : ''}`}
                onClick={() => go('signup')}
              >
                Create account
              </button>
            </div>
          )}

          {view === 'signin' && (
            <>
              <LoginForm
                initialEmail={email || undefined}
                flash={flash || undefined}
                onForgotPassword={() => go('forgot')}
              />
              <div className="auth-footer">
                <p>
                  Need to verify your email?
                  <button type="button" className="auth-link link-button" onClick={() => go('verify')}>
                    Enter your code
                  </button>
                </p>
              </div>
            </>
          )}

          {view === 'signup' && (
            <SignupForm onSignedUp={(e) => go('verify', e)} />
          )}

          {view === 'verify' && (
            <VerifyEmailForm initialEmail={email} onBack={() => go('signin')} />
          )}

          {view === 'forgot' && (
            <ForgotPasswordForm
              initialEmail={email}
              onCodeSent={(e) => go('reset', e)}
              onBack={() => go('signin')}
            />
          )}

          {view === 'reset' && (
            <ResetPasswordForm
              initialEmail={email}
              onDone={(e) => {
                go('signin', e);
                setFlash(PASSWORD_UPDATED);
              }}
              onBack={() => go('signin')}
            />
          )}
        </div>
      </section>
    </div>
  );
};

export default Landing;

import React from 'react';
import Header from './Header';
import Footer from './Footer';
import ForgotPasswordForm from './ForgotPasswordForm';
import '../styles/Auth.css';

const ForgotPassword = () => {
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

            <ForgotPasswordForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ForgotPassword;

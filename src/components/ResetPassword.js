import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ResetPasswordForm from './ResetPasswordForm';
import '../styles/Auth.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();

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

            <ResetPasswordForm initialEmail={searchParams.get('email') || ''} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPassword;

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import VerifyEmailForm from './VerifyEmailForm';
import '../styles/Auth.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();

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

            <VerifyEmailForm initialEmail={searchParams.get('email') || ''} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VerifyEmail;

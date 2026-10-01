import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import LoginForm from './LoginForm';
import '../styles/Auth.css';

const Login = () => {
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

            <LoginForm />

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

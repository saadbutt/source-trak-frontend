import React from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import SignupForm from './SignupForm';
import '../styles/Auth.css';

const Signup = () => {
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

            <SignupForm />

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

import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Header from './Header';
import Footer from './Footer';
import FeatureCard from './FeatureCard';
import '../styles/Landing.css';

const Landing = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Show loading or nothing while redirecting authenticated users
  if (isAuthenticated()) {
    return (
      <div className="landing-page">
        <Header />
        <main className="main-content">
          <div className="content-container">
            <div className="loading-message">
              <div className="loading-spinner"></div>
              <p>Redirecting to dashboard...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="landing-page">
      <Header />
      
      <main className="main-content">
        <div className="content-container">
          <div className="left-column">
            <h1 className="main-headline">
              <span className="blockchain-text">Blockchain-Powered</span>
              <span className="supply-chain-text">Supply Chain</span>
              <span className="transparency-text">Transparency</span>
            </h1>
            
            <p className="description">
              Track your farm products from harvest to market with complete transparency. 
              Our blockchain technology ensures every step of your supply chain is verified and immutable.
            </p>
            
            <div className="cta-buttons">
              <Link to="/signup" className="btn btn-primary">
                Start Tracking
                <span className="arrow">→</span>
              </Link>
              <Link to="/login" className="btn btn-secondary">
                View Demo
              </Link>
            </div>
          </div>
          
          <div className="right-column">
            <FeatureCard
              icon="🛡️"
              title="Blockchain Security"
              description="Your data is secured with enterprise-grade blockchain technology, ensuring tamper-proof records."
            />
            <FeatureCard
              icon="👥"
              title="Multi-Party Access"
              description="Share verified data with suppliers, distributors, and consumers in real-time."
            />
            <FeatureCard
              icon="👁️"
              title="Real-time Tracking"
              description="Monitor your products throughout the entire supply chain with live updates."
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Landing;

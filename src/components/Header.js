import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Header.css';

const Header = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="header">
      <div className="header-container">
        <Link to={isAuthenticated() ? "/dashboard" : "/"} className="logo">
          <img src="/logo.png" alt="SourceTrak Logo" className="logo-icon" />
        </Link>
        {isAuthenticated() ? (
          <Link to="/dashboard" className="btn-get-started">
            Dashboard
          </Link>
        ) : (
          <Link to="/login" className="btn-get-started">
            Get Started
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;

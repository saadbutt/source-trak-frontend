import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <img src="/logo.png" alt="SourceTrak Logo" className="logo-icon" />
        </Link>
        <Link to="/login" className="btn-get-started">
          Get Started
        </Link>
      </div>
    </header>
  );
};

export default Header;

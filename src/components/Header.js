import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Header.css';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setShowProfileDropdown(false);
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="header">
      <div className="header-container">
        <Link to={isAuthenticated() ? "/dashboard" : "/"} className="logo">
          <img src="/logo.png" alt="SourceTrak Logo" className="logo-icon" />
        </Link>
        
        {isAuthenticated() ? (
          <div className="user-menu">
            <div className="profile-dropdown" ref={dropdownRef}>
              <button 
                className="profile-button"
                onClick={toggleProfileDropdown}
              >
                <div className="profile-avatar">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="profile-name">{user?.name || 'User'}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              
              {showProfileDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="user-info">
                      <div className="user-name">{user?.name || 'User'}</div>
                      <div className="user-role">{user?.role || 'Unknown Role'}</div>
                      <div className="user-email">{user?.email || 'No email'}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link 
                    to="/dashboard" 
                    className="dropdown-item"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <span className="dropdown-icon">🏠</span>
                    Dashboard
                  </Link>
                  <button 
                    className="dropdown-item"
                    onClick={handleLogout}
                  >
                    <span className="dropdown-icon">🚪</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
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

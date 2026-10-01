import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiAward, FiChevronDown, FiHome, FiLogOut, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { roleLabel } from '../utils/roles';
import '../styles/Header.css';

const AUTH_ROUTES = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password'];

const initialsOf = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'U';
};

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const onAuthRoute = AUTH_ROUTES.includes(location.pathname);
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
                  {initialsOf(user?.name)}
                </div>
                <span className="profile-name">{user?.name || 'User'}</span>
                <span className={`dropdown-arrow ${showProfileDropdown ? 'open' : ''}`}><FiChevronDown size={16} /></span>
              </button>
              
              {showProfileDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="user-info">
                      <div className="user-name">{user?.name || 'User'}</div>
                      <div className="user-role"><FiAward size={13} />{user?.role ? roleLabel(user.role) : 'Unknown Role'}</div>
                      <div className="user-email">{user?.email || 'No email'}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link 
                    to="/dashboard" 
                    className="dropdown-item"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <span className="dropdown-icon"><FiHome size={16} /></span>
                    Dashboard
                  </Link>
                  <button 
                    className="dropdown-item danger"
                    onClick={handleLogout}
                  >
                    <span className="dropdown-icon"><FiLogOut size={16} /></span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : onAuthRoute ? null : (
          <div className="header-auth">
            <Link to="/login" className="btn-sign-in">
              Sign in
            </Link>
            <Link to="/signup" className="btn-get-started">
              Sign up
              <FiArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

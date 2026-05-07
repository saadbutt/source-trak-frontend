import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService, { ApiError } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const GENERIC_LOGIN_ERROR = 'Invalid email or password.';
const GENERIC_RATE_LIMIT_ERROR = 'Too many requests. Please slow down and try again in a moment.';
const GENERIC_NETWORK_ERROR = 'Something went wrong. Please try again.';

const toResult = (error) => {
  if (error instanceof ApiError) {
    if (error.status === 429) {
      return { success: false, status: 429, error: GENERIC_RATE_LIMIT_ERROR };
    }
    return { success: false, status: error.status, error: error.message };
  }
  return { success: false, status: 0, error: GENERIC_NETWORK_ERROR };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearLocalAuth = useCallback(() => {
    apiService.clearAuth();
    setUser(null);
  }, []);

  // Hydrate on mount: if we have tokens, validate via /auth/me. If validation
  // fails (and the refresh interceptor couldn't recover), wipe everything.
  useEffect(() => {
    apiService.setForceLogoutHandler(() => setUser(null));

    let cancelled = false;
    const hydrate = async () => {
      const accessToken = apiService.getAccessToken();
      const cachedUser = apiService.getStoredUser();
      if (!accessToken) {
        setLoading(false);
        return;
      }
      // Show the cached user immediately to avoid a flash; revalidate behind it.
      if (cachedUser) setUser(cachedUser);
      try {
        const fresh = await apiService.me();
        if (cancelled) return;
        apiService.setUser(fresh);
        setUser(fresh);
      } catch {
        if (!cancelled) clearLocalAuth();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    hydrate();
    return () => {
      cancelled = true;
      apiService.setForceLogoutHandler(null);
    };
  }, [clearLocalAuth]);

  const login = async (email, password) => {
    try {
      const response = await apiService.login(email, password);
      setUser(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      // Anti-enumeration: every 401 from /auth/login must read the same.
      if (error instanceof ApiError && error.status === 401) {
        return { success: false, status: 401, error: GENERIC_LOGIN_ERROR };
      }
      return toResult(error);
    }
  };

  const signup = async ({ name, email, password, role }) => {
    try {
      const response = await apiService.signup({ name, email, password, role });
      return { success: true, message: response?.message };
    } catch (error) {
      return toResult(error);
    }
  };

  const verifyEmail = async (email, code) => {
    try {
      const response = await apiService.verifyEmail(email, code);
      setUser(response.user);
      return { success: true, user: response.user };
    } catch (error) {
      return toResult(error);
    }
  };

  const resendVerification = async (email) => {
    try {
      const response = await apiService.resendVerification(email);
      return { success: true, message: response?.message };
    } catch (error) {
      return toResult(error);
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await apiService.forgotPassword(email);
      return { success: true, message: response?.message };
    } catch (error) {
      return toResult(error);
    }
  };

  const resetPassword = async (email, code, newPassword) => {
    try {
      const response = await apiService.resetPassword(email, code, newPassword);
      // Server revokes all sessions on success — wipe local state too so a
      // stale token in this tab doesn't keep the old session alive.
      clearLocalAuth();
      return { success: true, message: response?.message };
    } catch (error) {
      return toResult(error);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await apiService.changePassword(currentPassword, newPassword);
      // Server revokes all sessions on success; force a re-login.
      clearLocalAuth();
      return { success: true, message: response?.message };
    } catch (error) {
      return toResult(error);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } finally {
      setUser(null);
    }
  };

  const logoutAll = async () => {
    try {
      await apiService.logoutAll();
    } finally {
      setUser(null);
    }
  };

  const isAuthenticated = () => user !== null;
  const isFarmer = () => user?.role === 'Farmer';

  const value = {
    user,
    loading,
    login,
    signup,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
    logout,
    logoutAll,
    isAuthenticated,
    isFarmer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

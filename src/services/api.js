// SourceTrak API client.
//
// Auth model: Bearer JWT access token + opaque refresh token (rotation).
// Tokens persist in localStorage so users stay logged in across reloads.
// Known accepted risk: refresh token is XSS-exposed; revisit if a BFF lands.

const API_BASE_URL = '/api';

const ACCESS_TOKEN_KEY = 'sourcetrak_access_token';
const REFRESH_TOKEN_KEY = 'sourcetrak_refresh_token';
const USER_KEY = 'sourcetrak_user';

class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.refreshing = null;
    this.onForceLogout = null;
  }

  // ----- token storage -----

  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  getStoredUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }

  setTokens({ access_token, refresh_token }) {
    if (access_token) localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
    if (refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
  }

  setUser(user) {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  clearAuth() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  // Allows AuthContext to react when a refresh is rejected (rotation revoked).
  setForceLogoutHandler(handler) {
    this.onForceLogout = handler;
  }

  // ----- HTTP core -----

  buildHeaders(extra = {}) {
    const headers = { 'Content-Type': 'application/json', ...extra };
    const token = this.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  async parseBody(response) {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { error: text };
    }
  }

  async request(endpoint, options = {}, _retry = false) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: this.buildHeaders(options.headers),
    };

    const response = await fetch(url, config);
    const body = await this.parseBody(response);

    if (response.ok) return body;

    // Single-flight refresh on 401. Don't try to refresh requests that ARE the
    // refresh, and don't loop if the retry also 401s.
    const isRefreshCall = endpoint === '/auth/refresh';
    if (
      response.status === 401 &&
      !isRefreshCall &&
      !_retry &&
      this.getRefreshToken()
    ) {
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        return this.request(endpoint, options, true);
      }
    }

    throw new ApiError(
      body?.error || `HTTP ${response.status}`,
      response.status,
      body
    );
  }

  async refreshTokens() {
    if (this.refreshing) return this.refreshing;

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    this.refreshing = (async () => {
      try {
        const url = `${this.baseURL}/auth/refresh`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
        const body = await this.parseBody(response);
        if (!response.ok) {
          // Rotation revoked or expired — wipe everything and notify.
          this.clearAuth();
          if (this.onForceLogout) this.onForceLogout();
          return false;
        }
        this.setTokens(body);
        return true;
      } catch {
        this.clearAuth();
        if (this.onForceLogout) this.onForceLogout();
        return false;
      } finally {
        this.refreshing = null;
      }
    })();

    return this.refreshing;
  }

  // ----- auth endpoints -----

  async signup({ name, email, password, role }) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  }

  async verifyEmail(email, code) {
    const body = await this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
    if (body?.access_token) this.setTokens(body);
    if (body?.user) this.setUser(body.user);
    return body;
  }

  async resendVerification(email) {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async login(email, password) {
    const body = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (body?.access_token) this.setTokens(body);
    if (body?.user) this.setUser(body.user);
    return body;
  }

  async logout() {
    const refreshToken = this.getRefreshToken();
    try {
      if (refreshToken) {
        await this.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } finally {
      this.clearAuth();
    }
  }

  async logoutAll() {
    try {
      await this.request('/auth/logout-all', { method: 'POST' });
    } finally {
      this.clearAuth();
    }
  }

  async me() {
    return this.request('/auth/me');
  }

  async forgotPassword(email) {
    return this.request('/auth/password/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email, code, newPassword) {
    return this.request('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify({ email, code, new_password: newPassword }),
    });
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/auth/password/change', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  }

  // ----- application endpoints (preserved for existing screens) -----

  async getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  async getAllUsers() {
    return this.request('/users');
  }

  async createBatch() {
    return this.request('/batches', { method: 'POST' });
  }

  async getBatch(batchId) {
    return this.request(`/batches/${batchId}`);
  }

  async getBatchData(batchId) {
    return this.request(`/batches/${batchId}/data`);
  }

  async getBatchBlockchainData(batchId) {
    return this.request(`/batches/${batchId}/blockchain`);
  }

  async getUserTraceabilityHistory(_userId, page = 1, pageSize = 100) {
    return this.request(`/me/history?page=${page}&page_size=${pageSize}`);
  }

  async submitData(data) {
    return this.request('/data', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitTraceabilityData(_role, data) {
    return this.request('/data', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDataByEventId(eventId) {
    return this.request(`/data/event/${eventId}`);
  }
}

const apiService = new ApiService();
export { ApiError };
export default apiService;

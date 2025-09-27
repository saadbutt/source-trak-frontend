// API Service for connecting to deployed backend
// Update the API_BASE_URL to your deployed backend URL

const API_BASE_URL = '/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to get headers with authentication
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add user authentication headers if available
    const user = JSON.parse(localStorage.getItem('sourcetrak_user') || '{}');
    if (user.id) {
      headers['user-id'] = user.id;
      headers['user-role'] = user.role;
    }

    return headers;
  }

  // Helper method to make HTTP requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(email, password) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Alias for signup
  async createUser(userData) {
    return this.signup(userData);
  }

  async logout() {
    return this.request('/logout', {
      method: 'POST',
    });
  }

  // User management
  async getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  async getAllUsers() {
    return this.request('/users');
  }

  // Batch management
  async createBatch() {
    return this.request('/batches', {
      method: 'POST',
    });
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

  async getUserTraceabilityHistory(userId, page = 1, pageSize = 100) {
    return this.request(`/batches/history?page=${page}&page_size=${pageSize}`);
  }

  // Data submission
  async submitData(data) {
    return this.request('/data', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDataByEventId(eventId) {
    return this.request(`/data/event/${eventId}`);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

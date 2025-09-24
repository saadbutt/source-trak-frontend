// API Service for SourceTrak Backend Integration
const API_BASE_URL = process.env.NODE_ENV === 'development' ? '/api' : 'https://staging.sourcetrak.com/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to get headers with user authentication
  getHeaders(userId = null) {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (userId) {
      headers['user-id'] = userId;
    }
    
    return headers;
  }

  // Authentication APIs
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/login?user-email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      const response = await fetch(`${this.baseURL}/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async createUser(userData) {
    try {
      const response = await fetch(`${this.baseURL}/users`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'User creation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  async getUser(userId) {
    try {
      const response = await fetch(`${this.baseURL}/users/${userId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get user');
      }

      return await response.json();
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  // Batch Management APIs
  async createBatch(userId) {
    try {
      const response = await fetch(`${this.baseURL}/batches`, {
        method: 'POST',
        headers: this.getHeaders(userId),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Batch creation failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Create batch error:', error);
      throw error;
    }
  }

  async getBatch(batchId) {
    try {
      const response = await fetch(`${this.baseURL}/batches/${batchId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get batch');
      }

      return await response.json();
    } catch (error) {
      console.error('Get batch error:', error);
      throw error;
    }
  }

  async getBatchData(batchId) {
    try {
      const response = await fetch(`${this.baseURL}/batches/${batchId}/data`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get batch data');
      }

      return await response.json();
    } catch (error) {
      console.error('Get batch data error:', error);
      throw error;
    }
  }

  async getBatchBlockchainData(batchId) {
    try {
      const response = await fetch(`${this.baseURL}/batches/${batchId}/blockchain`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get blockchain data');
      }

      return await response.json();
    } catch (error) {
      console.error('Get blockchain data error:', error);
      throw error;
    }
  }

  // Data Submission APIs
  async submitData(userId, data) {
    try {
      const response = await fetch(`${this.baseURL}/data`, {
        method: 'POST',
        headers: this.getHeaders(userId),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Data submission failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Submit data error:', error);
      throw error;
    }
  }

  async getDataByEventId(eventId) {
    try {
      const response = await fetch(`${this.baseURL}/data/event/${eventId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get data by event ID');
      }

      return await response.json();
    } catch (error) {
      console.error('Get data by event ID error:', error);
      throw error;
    }
  }

  // User History APIs
  async getUserTraceabilityHistory(userId, page = 1, pageSize = 10) {
    try {
      console.log('API: Getting user history for userId:', userId);
      const response = await fetch(`${this.baseURL}/batches/history?page=${page}&page_size=${pageSize}`, {
        method: 'GET',
        headers: this.getHeaders(userId),
      });

      console.log('API: Response status:', response.status);
      if (!response.ok) {
        const error = await response.json();
        console.error('API: Error response:', error);
        throw new Error(error.error || 'Failed to get user history');
      }

      const data = await response.json();
      console.log('API: Success response:', data);
      return data;
    } catch (error) {
      console.error('Get user history error:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import Header from './Header';
import Footer from './Footer';
import FarmEntryForm from './FarmEntryForm';
import DataHistory from './DataHistory';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [farmData, setFarmData] = useState([]);
  const [activeTab, setActiveTab] = useState('entry');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check authentication and load data
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    loadUserHistory();
  }, [isAuthenticated, navigate, user]);

  // Load user's traceability history from backend
  const loadUserHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await apiService.getUserTraceabilityHistory(user.id, 1, 100);
      if (response.data) {
        // Transform backend data to frontend format
        const transformedData = response.data.map(item => {
          // item.data is already a JavaScript object, not a JSON string
          const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
          return {
            id: item.event_id,
            farm_id: data.farm_id,
            farm_name: data.farm_name,
            location_coordinates: data.location_coordinates,
            harvest_date: data.harvest_date,
            product_type: data.product_type,
            batch_id: item.batch_id,
            farming_method: data.farming_method,
            certifications: data.certifications,
            timestamp: item.created_at,
            status: item.tx_status ? 'verified' : 'pending',
            txHash: item.txhash
          };
        });
        setFarmData(transformedData);
      }
    } catch (error) {
      console.error('Error loading user history:', error);
      //setError('Failed to load data history');
      // Fallback to localStorage
      const savedData = localStorage.getItem('sourcetrak-farm-data');
      if (savedData) {
        setFarmData(JSON.parse(savedData));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDataSubmit = (newData) => {
    setFarmData(prevData => [newData, ...prevData]);
    // Refresh the history to get the latest data from backend
    loadUserHistory();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const stats = {
    totalEntries: farmData.length,
    verifiedEntries: farmData.filter(entry => entry.status === 'verified').length,
    uniqueProducts: new Set(farmData.map(entry => entry.product_type)).size,
    uniqueFarms: new Set(farmData.map(entry => entry.farm_name)).size
  };

  return (
    <div className="dashboard-page">
      <Header />
      
      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <div className="header-content">
              <div>
                <h1>Welcome, {user?.name}</h1>
                <p>Manage your farm data and track your products</p>
                <span className="user-role">Role: {user?.role}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            {loading ? (
              <div className="loading-message">
                <div className="loading-spinner"></div>
                <p>Loading data...</p>
              </div>
            ) : (
              <>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <h3>{stats.totalEntries}</h3>
                    <p>Total Entries</p>
                  </div>
                </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{stats.verifiedEntries}</h3>
                <p>Verified Entries</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🌱</div>
              <div className="stat-content">
                <h3>{stats.uniqueProducts}</h3>
                <p>Product Types</p>
              </div>
            </div>
                <div className="stat-card">
                  <div className="stat-icon">🏡</div>
                  <div className="stat-content">
                    <h3>{stats.uniqueFarms}</h3>
                    <p>Farms</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="dashboard-tabs">
            <button 
              className={`tab-btn ${activeTab === 'entry' ? 'active' : ''}`}
              onClick={() => setActiveTab('entry')}
            >
              Add New Entry
            </button>
            <button 
              className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              View History
            </button>
          </div>

          {/* Error message displayed near content area */}
          {error && (
            <div className="error-message" style={{ marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'entry' && (
              <FarmEntryForm onDataSubmit={handleDataSubmit} />
            )}
            {activeTab === 'history' && (
              <DataHistory farmData={farmData} />
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;

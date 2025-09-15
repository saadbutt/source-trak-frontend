import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import FarmEntryForm from './FarmEntryForm';
import DataHistory from './DataHistory';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [farmData, setFarmData] = useState([]);
  const [activeTab, setActiveTab] = useState('entry');

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('sourcetrak-farm-data');
    if (savedData) {
      setFarmData(JSON.parse(savedData));
    }
  }, []);

  // Save data to localStorage whenever farmData changes
  useEffect(() => {
    localStorage.setItem('sourcetrak-farm-data', JSON.stringify(farmData));
  }, [farmData]);

  const handleDataSubmit = (newData) => {
    setFarmData(prevData => [newData, ...prevData]);
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
            <h1>Farmer Dashboard</h1>
            <p>Manage your farm data and track your products</p>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
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

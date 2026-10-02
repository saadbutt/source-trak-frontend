import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { FiBox, FiCheckCircle } from 'react-icons/fi';
import Header from './Header';
import Footer from './Footer';
import EntryWizard from './entry/EntryWizard';
import ConsumerEntryForm from './ConsumerEntryForm';
import DataHistory from './DataHistory';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
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
    // loadUserHistory is redefined every render; listing it would refetch in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate, user]);

  // Load user's traceability history from backend
  const loadUserHistory = async () => {
    if (!user) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await apiService.getUserTraceabilityHistory(user.id, 1, 100);
      console.log('Backend response:', response);
      if (response.data) {
        // Transform backend data to frontend format
        const transformedData = response.data.map(item => {
          // item.data is already a JavaScript object, not a JSON string
          const data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data;
          
          // Transform data based on the user role from the backend
          const userRole = item.user_role || 'Unknown';
          
          // Create a generic data structure that works for all roles
          return {
            id: item.event_id,
            batch_id: item.batch_id,
            timestamp: item.created_at,
            status: item.tx_status ? 'verified' : 'pending',
            txHash: item.txhash,
            user_role: userRole,
            // Role-specific fields - will be undefined for other roles
            farm_id: data.farm_id,
            farm_name: data.farm_name,
            location_coordinates: data.location_coordinates,
            harvest_date: data.harvest_date,
            product_type: data.product_type,
            farming_method: data.farming_method,
            quantity: data.quantity,
            quantity_unit: data.quantity_unit,
            certifications: data.certifications,
            // Processing fields
            processor_id: data.processor_id,
            facility_name: data.facility_name,
            processing_date: data.processing_date,
            product_transformation_details: data.product_transformation_details,
            packaging_type: data.packaging_type,
            expiration_date: data.expiration_date,
            lot_number: data.lot_number,
            quality_check_result: data.quality_check_result,
            processing_certifications: data.processing_certifications,
            // Logistics fields
            shipment_id: data.shipment_id,
            logistics_provider_id: data.logistics_provider_id,
            departure_time: data.departure_time,
            arrival_time: data.arrival_time,
            // Distribution fields
            retailer_id: data.retailer_id,
            distribution_center_location: data.distribution_center_location,
            store_location: data.store_location,
            inventory_id: data.inventory_id,
            shelf_life_remaining: data.shelf_life_remaining,
            display_date: data.display_date,
            product_qr_code: data.product_qr_code,
            // Consumer fields
            qrid: data.qrid,
            product_authentication_status: data.product_authentication_status,
            scan_timestamp: data.scan_timestamp,
            scan_location: data.scan_location,
            consumer_feedback: data.consumer_feedback,
            loyalty_id: data.loyalty_id,
            sustainability_score: data.sustainability_score
          };
        });
        console.log('Transformed data:', transformedData);
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


  const stats = {
    totalEntries: farmData.length,
    verifiedEntries: farmData.filter(entry => entry.status === 'verified').length
  };

  return (
    <div className="dashboard-page">
      <Header />
      
      <main className="dashboard-main">
        <div className="dashboard-container">

          {/* Stats Cards */}
          <div className="stats-grid">
            {loading ? (
              <div className="loading-message">
                <div className="loading-spinner"></div>
                <p>Loading data...</p>
              </div>
            ) : (
              <>
                <div className="stat-card stat-card-primary">
                  <div className="stat-icon">
                    <FiBox />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.totalEntries}</h3>
                    <p>Total Entries</p>
                  </div>
                </div>
                <div className="stat-card stat-card-secondary">
                  <div className="stat-icon">
                    <FiCheckCircle />
                  </div>
                  <div className="stat-content">
                    <h3>{stats.verifiedEntries}</h3>
                    <p>Verified Entries</p>
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
              {(() => {
                switch (user.role) {
                  case 'Processing/Packaging':
                    return 'Add Processing Data';
                  case 'Logistics & Cold Chain Monitoring':
                    return 'Add Logistics Data';
                  case 'Distribution/Retail':
                    return 'Add Distribution Data';
                  case 'Consumer Interaction':
                    return 'Add Consumer Data';
                  default:
                    return 'Add New Entry';
                }
              })()}
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
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Tab Content */}
          <div className="tab-content">
            {activeTab === 'entry' && (
              user.role === 'Consumer Interaction'
                ? <ConsumerEntryForm onDataSubmit={handleDataSubmit} />
                : <EntryWizard key={user.role} role={user.role} onDataSubmit={handleDataSubmit} />
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

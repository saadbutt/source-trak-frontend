import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DataHistory.css';

const DataHistory = ({ farmData }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    return (
      <span className={`status-badge status-${status}`}>
        {status === 'verified' ? '✓ Verified' : status}
      </span>
    );
  };

  return (
    <div className="data-history">
      <div className="history-header">
        <h2>Farm Data History</h2>
        
        <div className="history-controls">
          <div className="entry-count">
            {farmData.length} {farmData.length === 1 ? 'entry' : 'entries'}
          </div>
        </div>
      </div>

      {farmData.length === 0 ? (
        <div className="no-data">
          <div className="no-data-icon">📊</div>
          <h3>No Data Found</h3>
          <p>
            You haven't submitted any farm data yet. Start by adding your first entry!
          </p>
        </div>
      ) : (
        <div className="data-grid">
          {farmData.map((entry) => (
            <div 
              key={entry.id} 
              className="data-card"
            >
              <div className="card-header">
                <h3 className="product-name">{entry.product_type}</h3>
                {getStatusBadge(entry.status)}
              </div>
              
              <div className="card-content">
                <div className="data-row">
                  <span className="label">Farm:</span>
                  <span className="value">{entry.farm_name}</span>
                </div>
                <div className="data-row">
                  <span className="label">Harvest Date:</span>
                  <span className="value">{formatDate(entry.harvest_date)}</span>
                </div>
                <div className="data-row">
                  <span className="label">Farming Method:</span>
                  <span className="value">{entry.farming_method}</span>
                </div>
                <div className="data-row">
                  <span className="label">Certifications:</span>
                  <span className="value">{entry.certifications}</span>
                </div>
                <div className="data-row">
                  <span className="label">Batch ID:</span>
                  <span className="value batch-id">{entry.batch_id}</span>
                </div>
                <div className="data-row">
                  <span className="label">Submitted:</span>
                  <span className="value">{formatDate(entry.timestamp)}</span>
                </div>
              </div>
              
              <div className="card-footer">
                <button 
                  className="view-details-btn"
                  onClick={() => navigate(`/batch/${entry.batch_id}`)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default DataHistory;

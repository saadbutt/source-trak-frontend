import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DataHistory.css';

const DataHistory = ({ farmData }) => {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const filteredData = farmData.filter(entry => {
    if (filter === 'all') return true;
    return entry.product_type.toLowerCase().includes(filter.toLowerCase());
  });

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
        <p>View and manage all your submitted farm entries</p>
        
        <div className="history-controls">
          <div className="search-filter">
            <input
              type="text"
              placeholder="Search by product type..."
              value={filter === 'all' ? '' : filter}
              onChange={(e) => setFilter(e.target.value || 'all')}
              className="search-input"
            />
          </div>
          <div className="entry-count">
            {filteredData.length} {filteredData.length === 1 ? 'entry' : 'entries'}
          </div>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="no-data">
          <div className="no-data-icon">📊</div>
          <h3>No Data Found</h3>
          <p>
            {filter === 'all' 
              ? "You haven't submitted any farm data yet. Start by adding your first entry!"
              : "No entries match your search criteria."
            }
          </p>
        </div>
      ) : (
        <div className="data-grid">
          {filteredData.map((entry) => (
            <div 
              key={entry.id} 
              className="data-card"
              onClick={() => setSelectedEntry(entry)}
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

      {/* Detail Modal */}
      {selectedEntry && (
        <div className="modal-overlay" onClick={() => setSelectedEntry(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Entry Details</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedEntry(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Farm ID</span>
                  <span className="detail-value batch-id">{selectedEntry.farm_id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Farm Name</span>
                  <span className="detail-value">{selectedEntry.farm_name}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Location Coordinates</span>
                  <span className="detail-value">{selectedEntry.location_coordinates}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Product Type</span>
                  <span className="detail-value">{selectedEntry.product_type}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Harvest Date</span>
                  <span className="detail-value">{formatDate(selectedEntry.harvest_date)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Farming Method</span>
                  <span className="detail-value">{selectedEntry.farming_method}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Certifications</span>
                  <span className="detail-value">{selectedEntry.certifications}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Batch ID</span>
                  <span className="detail-value batch-id">{selectedEntry.batch_id}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className="detail-value">{getStatusBadge(selectedEntry.status)}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Submitted</span>
                  <span className="detail-value">{new Date(selectedEntry.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataHistory;

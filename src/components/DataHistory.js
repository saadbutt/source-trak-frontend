import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/DataHistory.css';

const DataHistory = ({ farmData }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  const getDisplayFields = (entry) => {
    const userRole = entry.user_role || 'Unknown';
    
    switch (userRole.toLowerCase()) {
      case 'farm/producer':
        return {
          title: entry.product_type || 'Farm Product',
          fields: [
            { label: 'Farm:', value: entry.farm_name },
            { label: 'Harvest Date:', value: entry.harvest_date ? formatDate(entry.harvest_date) : 'N/A' },
            { label: 'Farming Method:', value: entry.farming_method },
            { label: 'Certifications:', value: entry.certifications }
          ]
        };
      case 'processing/packaging':
        return {
          title: entry.packaging_type || 'Processed Product',
          fields: [
            { label: 'Facility:', value: entry.facility_name },
            { label: 'Processing Date:', value: entry.processing_date ? formatDate(entry.processing_date) : 'N/A' },
            { label: 'Packaging Type:', value: entry.packaging_type },
            { label: 'Lot Number:', value: entry.lot_number }
          ]
        };
      case 'logistics & cold chain monitoring':
        return {
          title: `Shipment ${entry.shipment_id || 'Unknown'}`,
          fields: [
            { label: 'Provider:', value: entry.logistics_provider_id },
            { label: 'Departure:', value: entry.departure_time ? formatDate(entry.departure_time) : 'N/A' },
            { label: 'Arrival:', value: entry.arrival_time ? formatDate(entry.arrival_time) : 'N/A' },
            { label: 'Shipment ID:', value: entry.shipment_id }
          ]
        };
      case 'distribution/retail':
        return {
          title: `Retail ${entry.retailer_id || 'Unknown'}`,
          fields: [
            { label: 'Store Location:', value: entry.store_location },
            { label: 'Inventory ID:', value: entry.inventory_id },
            { label: 'Shelf Life:', value: entry.shelf_life_remaining },
            { label: 'Display Date:', value: entry.display_date ? formatDate(entry.display_date) : 'N/A' }
          ]
        };
      case 'consumer interaction':
        return {
          title: `Consumer Feedback`,
          fields: [
            { label: 'QR ID:', value: entry.qrid },
            { label: 'Scan Time:', value: entry.scan_timestamp ? formatDate(entry.scan_timestamp) : 'N/A' },
            { label: 'Feedback:', value: entry.consumer_feedback },
            { label: 'Sustainability Score:', value: entry.sustainability_score }
          ]
        };
      default:
        return {
          title: 'Data Entry',
          fields: [
            { label: 'Type:', value: userRole },
            { label: 'Data:', value: 'View details for more information' }
          ]
        };
    }
  };

  return (
    <div className="data-history">
      <div className="history-header">
        <h2>Data History</h2>
        
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
          {farmData.map((entry) => {
            const displayData = getDisplayFields(entry);
            return (
              <div 
                key={entry.id} 
                className="data-card"
              >
                <div className="card-header">
                  <h3 className="product-name">{displayData.title}</h3>
                  {getStatusBadge(entry.status)}
                </div>
                
                <div className="card-content">
                  {displayData.fields.map((field, index) => (
                    <div key={index} className="data-row">
                      <span className="label">{field.label}</span>
                      <span className="value">{field.value || 'N/A'}</span>
                    </div>
                  ))}
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
            );
          })}
        </div>
      )}

    </div>
  );
};

export default DataHistory;

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import QRCodeModal from './QRCodeModal';
import '../styles/DataDetailView.css';

const DataDetailView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state?.data;
  const [showQRModal, setShowQRModal] = useState(false);

  if (!data) {
    return (
      <div className="data-detail-page">
        <Header />
        <main className="data-detail-main">
          <div className="data-detail-container">
            <div className="error-message">
              <h2>No Data Found</h2>
              <p>The requested data could not be found.</p>
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleViewBlockchain = () => {
    if (data.txHash && data.txHash !== 'pending-blockchain-connection') {
      // Open blockchain explorer in new tab
      window.open(`http://167.99.222.73:8090/#/transactions/${data.txHash}`, '_blank');
    } else {
      alert('Blockchain transaction is still pending or not available.');
    }
  };

  const handleViewQRCode = () => {
    setShowQRModal(true);
  };

  return (
    <div className="data-detail-page">
      <Header />
      
      <main className="data-detail-main">
        <div className="data-detail-container">
          <div className="detail-header">
            <button onClick={handleBackToDashboard} className="btn btn-secondary">
              ← Back to Dashboard
            </button>
            <h1>Product Details</h1>
            <div className="status-badge">
              {data.status === 'verified' ? (
                <span className="status-verified">✅ Verified</span>
              ) : (
                <span className="status-pending">⏳ Pending</span>
              )}
            </div>
          </div>

          <div className="detail-content">
            <div className="detail-section">
              <h2>Farm Information</h2>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Farm ID</label>
                  <span className="detail-value">{data.farm_id}</span>
                </div>
                <div className="detail-item">
                  <label>Farm Name</label>
                  <span className="detail-value">{data.farm_name}</span>
                </div>
                <div className="detail-item">
                  <label>Location Coordinates</label>
                  <span className="detail-value">{data.location_coordinates}</span>
                </div>
                <div className="detail-item">
                  <label>Farming Method</label>
                  <span className="detail-value">{data.farming_method}</span>
                </div>
                <div className="detail-item">
                  <label>Certifications</label>
                  <span className="detail-value">{data.certifications}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h2>Product Information</h2>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Product Type</label>
                  <span className="detail-value">{data.product_type}</span>
                </div>
                <div className="detail-item">
                  <label>Harvest Date</label>
                  <span className="detail-value">{data.harvest_date}</span>
                </div>
                <div className="detail-item">
                  <label>Batch ID</label>
                  <span className="detail-value">{data.batch_id}</span>
                </div>
                <div className="detail-item">
                  <label>Event ID</label>
                  <span className="detail-value">{data.id}</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h2>Blockchain Information</h2>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Transaction Hash</label>
                  <span className="detail-value">
                    {data.txHash === 'pending-blockchain-connection' ? (
                      <span className="pending-hash">Pending blockchain connection</span>
                    ) : (
                      <span className="tx-hash">{data.txHash}</span>
                    )}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Submission Time</label>
                  <span className="detail-value">
                    {new Date(data.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Verification Status</label>
                  <span className="detail-value">
                    {data.status === 'verified' ? '✅ Verified on Blockchain' : '⏳ Pending Verification'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="detail-actions">
            <button onClick={handleViewQRCode} className="btn btn-primary">
              📱 View QR Code
            </button>
            <button 
              onClick={handleViewBlockchain} 
              className="btn btn-secondary"
              disabled={!data.txHash || data.txHash === 'pending-blockchain-connection'}
            >
              🔗 View on Blockchain Explorer
            </button>
            <button onClick={() => window.print()} className="btn btn-outline">
              🖨️ Print Details
            </button>
          </div>
        </div>
      </main>
      
      <Footer />
      
      {/* QR Code Modal */}
      <QRCodeModal 
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        data={data}
      />
    </div>
  );
};

export default DataDetailView;

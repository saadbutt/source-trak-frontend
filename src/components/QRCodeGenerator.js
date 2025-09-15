import React from 'react';
import QRCode from 'qrcode.react';
import '../styles/QRCode.css';

const QRCodeGenerator = ({ data }) => {
  const qrData = JSON.stringify({
    farm_id: data.farm_id,
    farm_name: data.farm_name,
    location_coordinates: data.location_coordinates,
    harvest_date: data.harvest_date,
    product_type: data.product_type,
    batch_id: data.batch_id,
    farming_method: data.farming_method,
    certifications: data.certifications,
    farmer_signature: data.farmer_signature,
    timestamp: data.timestamp,
    status: data.status
  });

  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code-canvas');
    const link = document.createElement('a');
    link.download = `sourcetrak-${data.batch_id}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="qr-generator">
      <div className="qr-header">
        <h3>QR Code Generated</h3>
        <p>Scan this QR code to view product details</p>
      </div>
      
      <div className="qr-container">
        <div className="qr-code-wrapper">
          <QRCode
            id="qr-code-canvas"
            value={qrData}
            size={200}
            level="H"
            includeMargin={true}
            renderAs="canvas"
          />
        </div>
        
        <div className="qr-info">
          <div className="qr-details">
            <h4>Product Information</h4>
            <div className="qr-detail-item">
              <span className="label">Batch ID:</span>
              <span className="value">{data.batch_id}</span>
            </div>
            <div className="qr-detail-item">
              <span className="label">Farm:</span>
              <span className="value">{data.farm_name}</span>
            </div>
            <div className="qr-detail-item">
              <span className="label">Product:</span>
              <span className="value">{data.product_type}</span>
            </div>
            <div className="qr-detail-item">
              <span className="label">Harvest Date:</span>
              <span className="value">{new Date(data.harvest_date).toLocaleDateString()}</span>
            </div>
            <div className="qr-detail-item">
              <span className="label">Status:</span>
              <span className="value status-verified">✓ Verified</span>
            </div>
          </div>
          
          <button onClick={downloadQRCode} className="btn btn-secondary download-btn">
            Download QR Code
          </button>
        </div>
      </div>
      
      <div className="qr-instructions">
        <h4>How to Use This QR Code:</h4>
        <ul>
          <li>Print this QR code and attach it to your product packaging</li>
          <li>Consumers can scan it to view complete product information</li>
          <li>All data is verified and stored on the blockchain</li>
          <li>Track your product's journey through the supply chain</li>
        </ul>
      </div>
    </div>
  );
};

export default QRCodeGenerator;

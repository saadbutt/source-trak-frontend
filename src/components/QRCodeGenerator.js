import React from 'react';
import QRCode from 'qrcode.react';
import '../styles/QRCode.css';

const QRCodeGenerator = ({ data }) => {
  // Generate a direct URL to the batch details page
  const qrData = `${window.location.origin}/batch/${data.batch_id}`;

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
        <p>Scan this QR code to visit the product details page</p>
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
          <li>Consumers can scan it to be taken directly to the product details page</li>
          <li>All data is verified and stored on the blockchain</li>
          <li>Track your product's journey through the supply chain</li>
        </ul>
      </div>
    </div>
  );
};

export default QRCodeGenerator;

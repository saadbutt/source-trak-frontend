import React from 'react';
import QRCode from 'qrcode.react';
import '../styles/QRCodeModal.css';

const QRCodeModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  // Create shareable link for the QR code
  const shareableLink = `${window.location.origin}/batch/${data.batch_id}`;
  
  const qrData = {
    type: 'sourcetrak_batch',
    shareable_link: shareableLink,
    farm_id: data.farm_id,
    farm_name: data.farm_name,
    location_coordinates: data.location_coordinates,
    harvest_date: data.harvest_date,
    product_type: data.product_type,
    batch_id: data.batch_id,
    farming_method: data.farming_method,
    certifications: data.certifications,
    timestamp: data.timestamp,
    txHash: data.txHash
  };

  const handleDownload = () => {
    // Add a small delay to ensure canvas is fully rendered
    setTimeout(() => {
      // Get the existing QR code canvas element
      const canvas = document.getElementById('qr-code-canvas-modal');
      if (!canvas) {
        // Try to find any canvas element in the modal
        const modalCanvas = document.querySelector('.qr-modal-content canvas');
        if (modalCanvas) {
          downloadCanvas(modalCanvas);
        } else {
          // QR code not found, silently fail
          return;
        }
        return;
      }
      
      downloadCanvas(canvas);
    }, 100); // 100ms delay to ensure canvas is rendered
  };

  const downloadCanvas = (canvas) => {
    try {
      // Convert canvas to blob and download directly
      canvas.toBlob((blob) => {
        if (!blob) {
          // Error generating QR code, silently fail
          return;
        }
        
        // Create download link and trigger download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sourcetrak-qr-${data.batch_id}.png`;
        link.style.display = 'none';
        
        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        URL.revokeObjectURL(url);
      }, 'image/png', 1.0); // High quality PNG
    } catch (error) {
      // Download error, silently fail
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=700');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${data.farm_name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              background-color: white;
            }
            .qr-container {
              max-width: 500px;
              margin: 0 auto;
            }
            h1 { color: #2d3748; margin-bottom: 20px; }
            .qr-code { 
              margin: 20px 0; 
              display: flex;
              justify-content: center;
            }
            .data-info { 
              text-align: left; 
              margin-top: 20px; 
              padding: 15px;
              background-color: #f7fafc;
              border-radius: 5px;
            }
            .data-item { 
              margin: 8px 0; 
              display: flex; 
              justify-content: space-between;
            }
            .label { font-weight: bold; color: #4a5568; }
            .value { color: #2d3748; }
            .qr-data {
              margin-top: 20px; 
              padding: 15px; 
              background-color: #ebf8ff; 
              border-radius: 5px;
              font-size: 12px;
              word-break: break-all;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h1>Product QR Code</h1>
            <div class="qr-code">
              <div id="qrcode"></div>
            </div>
            <div class="data-info">
              <h3>Product Information</h3>
              <div class="data-item">
                <span class="label">Farm:</span>
                <span class="value">${data.farm_name}</span>
              </div>
              <div class="data-item">
                <span class="label">Product:</span>
                <span class="value">${data.product_type}</span>
              </div>
              <div class="data-item">
                <span class="label">Harvest Date:</span>
                <span class="value">${data.harvest_date}</span>
              </div>
              <div class="data-item">
                <span class="label">Method:</span>
                <span class="value">${data.farming_method}</span>
              </div>
              <div class="data-item">
                <span class="label">Status:</span>
                <span class="value">${data.status === 'verified' ? '✅ Verified' : '⏳ Pending'}</span>
              </div>
            </div>
            <div class="qr-data">
              <strong>QR Code Data:</strong><br>
              ${JSON.stringify(qrData, null, 2)}
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <h2>Product QR Code</h2>
          <button className="qr-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="qr-modal-body">
          <div className="qr-code-container">
            <QRCode
              id="qr-code-canvas-modal"
              value={JSON.stringify(qrData)}
              size={300}
              level="M"
              includeMargin={true}
              renderAs="canvas"
            />
          </div>
          
          <div className="qr-product-info">
            <h3>Product Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Farm:</span>
                <span className="info-value">{data.farm_name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Product:</span>
                <span className="info-value">{data.product_type}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Harvest Date:</span>
                <span className="info-value">{data.harvest_date}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Method:</span>
                <span className="info-value">{data.farming_method}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status:</span>
                <span className="info-value">
                  {data.status === 'verified' ? '✅ Verified' : '⏳ Pending'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Shareable Link:</span>
                <span className="info-value shareable-link">
                  <a href={shareableLink} target="_blank" rel="noopener noreferrer">
                    {shareableLink}
                  </a>
                </span>
              </div>
            </div>
          </div>
          
          <div className="qr-data-section">
            <h4>QR Code Data:</h4>
            <pre className="qr-data-content">
              {JSON.stringify(qrData, null, 2)}
            </pre>
          </div>
        </div>
        
        <div className="qr-modal-footer">
          <button onClick={handleDownload} className="btn btn-primary">
            📥 Download QR Code
          </button>
          <button onClick={handlePrint} className="btn btn-secondary">
            🖨️ Print QR Code
          </button>
          <button onClick={onClose} className="btn btn-outline">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;

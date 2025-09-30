import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import Header from './Header';
import Footer from './Footer';
import QRCodeModal from './QRCodeModal';
import FarmEntryForm from './FarmEntryForm';
import '../styles/DataDetailView.css';

const DataDetailView = () => {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [blockchainError, setBlockchainError] = useState('');
  const [showAddDataForm, setShowAddDataForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [batchHistory, setBatchHistory] = useState([]);

  const loadBatchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch batch data from API
      const response = await apiService.getBatchData(batchId);
      
      if (response && response.batch && response.data && response.data.length > 0) {
        // Get the first (or most recent) data entry
        const firstDataEntry = response.data[0];
        const batchInfo = response.batch;
        
        // Parse the data field (it's JSON string from backend)
        const parsedData = typeof firstDataEntry.data === 'string' 
          ? JSON.parse(firstDataEntry.data) 
          : firstDataEntry.data;
        
        // Transform API response to match expected format
        const transformedData = {
          id: batchInfo.batch_id,
          farm_id: parsedData.farm_id,
          farm_name: parsedData.farm_name,
          location_coordinates: parsedData.location_coordinates,
          harvest_date: parsedData.harvest_date,
          product_type: parsedData.product_type,
          batch_id: batchInfo.batch_id,
          farming_method: parsedData.farming_method,
          certifications: parsedData.certifications,
          timestamp: firstDataEntry.created_at,
          status: firstDataEntry.tx_status ? 'verified' : 'pending',
          txHash: firstDataEntry.txhash
        };
        
        setData(transformedData);
        
        // Transform and set batch history from the response data
        const transformedHistory = await Promise.all(response.data.map(async (entry) => {
          const parsedData = typeof entry.data === 'string' 
            ? JSON.parse(entry.data) 
            : entry.data;
          
          // Try to get user role from backend if not provided
          let userRole = entry.user_role;
          let userName = entry.user_name;
          
          if (!userRole) {
            try {
              // Make a call to get user info from the backend
              const userResponse = await apiService.getUser(entry.user_id);
              if (userResponse && userResponse.role) {
                userRole = userResponse.role;
                userName = userResponse.name;
              } else {
                userRole = 'Unknown Role';
              }
            } catch (error) {
              // Could not fetch user role, use default
              userRole = 'Unknown Role';
            }
          }
          
          return {
            ...entry,
            data: parsedData,
            user_role: userRole,
            user_name: userName,
            action: 'Data Entry' // Default action
          };
        }));
        setBatchHistory(transformedHistory);
      } else if (response && response.batch) {
        // Batch exists but no data entries yet
        setError('Batch exists but no data entries found. This batch may be empty.');
      } else {
        setError('Batch not found');
      }
    } catch (error) {
      console.error('Error loading batch data:', error);
      setError(`Failed to load batch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    // Check if data was passed via navigation state (legacy support)
    if (location.state?.data) {
      setData(location.state.data);
      setLoading(false);
      return;
    }

    // If batchId is provided, fetch data from API
    if (batchId) {
      loadBatchData();
    } else {
      setError('No batch ID provided');
      setLoading(false);
    }
  }, [batchId, isAuthenticated, navigate, location.state, loadBatchData]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleViewBlockchain = () => {
    if (data.txHash && data.txHash !== 'pending-blockchain-connection') {
      window.open(`http://167.99.222.73:8090/#/transactions/${data.txHash}`, '_blank');
      setBlockchainError('');
    } else {
      setBlockchainError('Blockchain transaction is still pending or not available.');
    }
  };

  const handleViewQRCode = () => {
    setShowQRModal(true);
  };

  const handleDownloadQRCode = () => {
    // Generate QR code data
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

    // Create a hidden canvas element for QR code generation
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    canvas.style.position = 'absolute';
    canvas.style.left = '-9999px';
    canvas.style.top = '-9999px';
    document.body.appendChild(canvas);

    // Use the qrcode.react library to generate QR code directly
    import('qrcode.react').then(QRCodeReact => {
      import('react-dom').then(ReactDOM => {
        // Create a temporary React element
        const qrElement = React.createElement(QRCodeReact.default, {
          value: JSON.stringify(qrData),
          size: 512,
          level: 'M',
          includeMargin: true,
          renderAs: 'canvas'
        });
        
        // Render to hidden canvas
        ReactDOM.render(qrElement, canvas);
        
        // Wait for render to complete, then download
        setTimeout(() => {
          const qrCanvas = canvas.querySelector('canvas');
          if (qrCanvas) {
            qrCanvas.toBlob((blob) => {
              if (!blob) {
                setError('Error generating QR code image. Please try again.');
                return;
              }
              
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `sourcetrak-qr-${data.batch_id}.png`;
              link.style.display = 'none';
              
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              
              // Clean up
              document.body.removeChild(canvas);
            }, 'image/png', 1.0);
          } else {
            setError('Error generating QR code. Please try again.');
            document.body.removeChild(canvas);
          }
        }, 100);
      });
    }).catch(error => {
      setError('Error generating QR code. Please try again.');
      document.body.removeChild(canvas);
    });
  };

  const handleShareLink = () => {
    if (!data || !data.batch_id) {
      setError('Cannot share: Batch data not available');
      return;
    }
    
    const shareUrl = `${window.location.origin}/batch/${data.batch_id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setSuccessMessage('Shareable link copied to clipboard!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setSuccessMessage('Shareable link copied to clipboard!');
      setTimeout(() => setSuccessMessage(''), 3000);
    });
  };

  const handleAddDataToBatch = () => {
    setShowAddDataForm(true);
  };

  const handleDataSubmit = (newData) => {
    // Add the new data to batch history
    setBatchHistory(prev => [...prev, newData]);
    setShowAddDataForm(false);
  };

  const canAddData = () => {
    // Allow only non-farmer roles to add data to existing batches
    // Farmers can only create new batches, not add to existing ones
    if (!user || !user.role || !['Producer', 'Logistics', 'Retailer'].includes(user.role)) {
      return false;
    }
    
    // Check if the current user has already added data to this batch
    const userAlreadyAddedData = batchHistory.some(entry => entry.user_id === user.id);
    
    // Don't show the button if user has already added data to this batch
    return !userAlreadyAddedData;
  };

  if (loading) {
    return (
      <div className="data-detail-page">
        <Header />
        <main className="data-detail-main">
          <div className="data-detail-container">
            <div className="loading-message">
              <div className="loading-spinner"></div>
              <p>Loading batch data...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="data-detail-page">
        <Header />
        <main className="data-detail-main">
          <div className="data-detail-container">
            <div className="error-message">
              <h2>Data Not Found</h2>
              <p>{error || 'The requested batch data could not be found.'}</p>
              <button onClick={handleBackToDashboard} className="btn btn-primary">
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="data-detail-page">
      <Header />
      <main className="data-detail-main">
        <div className="data-detail-container">
          {/* Simple Header */}
          <div className="simple-header">
            <button onClick={handleBackToDashboard} className="btn btn-outline">
              ← Back to Dashboard
            </button>
            <h1>Batch Details</h1>
            <div className="status-badge">
              {data.status === 'verified' ? (
                <span className="status-verified">✅ Verified</span>
              ) : (
                <span className="status-pending">⏳ Pending</span>
              )}
            </div>
          </div>

          {/* Simple Form Layout */}
          <div className="simple-form">
            <div className="form-group">
              <label>Batch ID</label>
              <div className="input-with-button">
                <input type="text" value={data.batch_id} readOnly className="form-input" />

              </div>
            </div>

            <div className="form-group">
              <label>Farm Name</label>
              <input type="text" value={data.farm_name} readOnly className="form-input" />
            </div>

            <div className="form-group">
              <label>Product Type</label>
              <input type="text" value={data.product_type} readOnly className="form-input" />
            </div>

            <div className="form-group">
              <label>Harvest Date</label>
              <input type="text" value={data.harvest_date} readOnly className="form-input" />
            </div>

            <div className="form-group">
              <label>Farming Method</label>
              <input type="text" value={data.farming_method} readOnly className="form-input" />
            </div>

            <div className="form-group">
              <label>Certifications</label>
              <input type="text" value={data.certifications} readOnly className="form-input" />
            </div>

            <div className="form-group">
              <label>Location Coordinates</label>
              <input type="text" value={data.location_coordinates} readOnly className="form-input" />
            </div>

            <div className="form-group">
              <label>Transaction Hash</label>
              <input 
                type="text" 
                value={data.txHash === 'pending-blockchain-connection' ? 'Pending' : data.txHash} 
                readOnly 
                className="form-input" 
              />
            </div>

            <div className="form-group">
              <label>Submitted By</label>
              <input type="text" value={data.user_name || 'Unknown User'} readOnly className="form-input" />
            </div>

            <div className="form-group">
              <label>Submitted On</label>
              <input type="text" value={new Date(data.timestamp).toLocaleString()} readOnly className="form-input" />
            </div>

            {/* Batch History - Simplified */}
            {batchHistory.length > 0 && (
              <div className="batch-history-simple">
                <h3>Batch History ({batchHistory.length} entries)</h3>
                {batchHistory.map((entry, index) => (
                  <div key={entry.id || index} className="history-item-simple">
                    <div className="history-info">
                      <span className="history-role">{entry.user_role || 'Unknown Role'}</span>
                      <span className="history-date">{new Date(entry.created_at).toLocaleString()}</span>
                    </div>
                    <div className="history-details">
                      <span>{entry.data?.product_type || 'Unknown Product'} from {entry.data?.farm_name || 'Unknown Farm'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button onClick={handleDownloadQRCode} className="btn btn-primary">
                📥 Download QR Code
              </button>
              <button onClick={handleViewQRCode} className="btn btn-secondary">
                👁️ View QR Code
              </button>
              <button onClick={handleViewBlockchain} className="btn btn-outline">
                🔗 Blockchain Explorer
              </button>
              {canAddData() && (
                <button onClick={handleAddDataToBatch} className="btn btn-success">
                  + Add Data to Batch
                </button>
              )}
            </div>
            
            {/* Success message */}
            {successMessage && (
              <div className="success-message">
                {successMessage}
              </div>
            )}

            {/* Blockchain error message */}
            {blockchainError && (
              <div className="error-message">
                {blockchainError}
              </div>
            )}

            {/* Add Data Form */}
            {showAddDataForm && (
              <div className="add-data-form">
                <h3>Add New Data to Batch</h3>
                <FarmEntryForm 
                  onDataSubmit={handleDataSubmit}
                  initialBatchId={data.batch_id}
                  userRole={user.role}
                />
                <button 
                  onClick={() => setShowAddDataForm(false)} 
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            )}
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

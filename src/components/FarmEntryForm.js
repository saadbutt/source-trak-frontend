import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import QRCodeGenerator from './QRCodeGenerator';
import '../styles/FarmEntry.css';

const FarmEntryForm = ({ onDataSubmit }) => {
  const [formData, setFormData] = useState({
    farm_id: uuidv4(),
    farm_name: '',
    location_coordinates: '',
    harvest_date: '',
    product_type: '',
    batch_id: uuidv4(),
    farming_method: '',
    certifications: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showLocationHelp, setShowLocationHelp] = useState(false);

  const farmingMethods = [
    'Organic',
    'Conventional',
    'Hydroponic',
    'Greenhouse',
    'Backyard',
    'Field',
    'Aquaponics',
    'Permaculture',
    'Biodynamic',
    'Regenerative'
  ];

  const certifications = [
    'EU Organic',
    'USDA Organic',
    'Fair Trade',
    'Rainforest Alliance',
    'UTZ Certified',
    'GlobalGAP',
    'ISO 22000',
    'HACCP',
    'Kosher',
    'Halal',
    'Non-GMO Project',
    'None'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    // Always try to get location - this will trigger the permission dialog if needed
    fetchLocation();
  };

  const fetchLocation = () => {
    setIsGettingLocation(true);
    setLocationError('');
    setShowLocationHelp(false);

    // This will trigger the browser's permission dialog if needed
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Latitude:", position.coords.latitude);
        console.log("Longitude:", position.coords.longitude);
        const { latitude, longitude } = position.coords;
        const coordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        setFormData({
          ...formData,
          location_coordinates: coordinates
        });
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access was denied. Please click "Allow" when the browser asks for permission, or enable location access in your browser settings.');
            setShowLocationHelp(true);
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable. Please check your GPS settings or enter coordinates manually.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again or enter coordinates manually.');
            break;
          default:
            setLocationError('An unknown error occurred while retrieving location. Please enter coordinates manually.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000, // Increased timeout to give user time to respond to permission dialog
        maximumAge: 0 // Don't use cached location to ensure fresh permission check
      }
    );
  };

  const requestLocationPermission = () => {
    // This will trigger the browser's permission dialog
    navigator.geolocation.getCurrentPosition(
      () => {
        // Permission granted, now get the actual location
        getCurrentLocation();
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location permission denied. Please enable location access in your browser settings.');
          setShowLocationHelp(true);
        }
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate blockchain submission
    setTimeout(() => {
      const newData = {
        ...formData,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        status: 'verified'
      };
      
      setSubmittedData(newData);
      setShowQRCode(true);
      setIsSubmitting(false);
      
      if (onDataSubmit) {
        onDataSubmit(newData);
      }
    }, 2000);
  };

    const resetForm = () => {
    setFormData({
      farm_id: uuidv4(),
      farm_name: '',
      location_coordinates: '',
      harvest_date: '',
      product_type: '',
      batch_id: uuidv4(),
      farming_method: '',
      certifications: ''
    });
    setShowQRCode(false);
    setSubmittedData(null);
  };

  if (showQRCode && submittedData) {
    return (
      <div className="qr-success">
        <div className="success-header">
          <div className="success-icon">✅</div>
          <h2>Data Successfully Submitted to Blockchain!</h2>
          <p>Your farm data has been verified and added to the blockchain.</p>
        </div>
        
        <div className="submitted-data">
          <h3>Submitted Data:</h3>
          <div className="data-grid">
            <div className="data-item">
              <span className="data-label">Farm ID:</span>
              <span className="data-value">{submittedData.farm_id}</span>
            </div>
            <div className="data-item">
              <span className="data-label">Farm Name:</span>
              <span className="data-value">{submittedData.farm_name}</span>
            </div>
            <div className="data-item">
              <span className="data-label">Location Coordinates:</span>
              <span className="data-value">{submittedData.location_coordinates}</span>
            </div>
            <div className="data-item">
              <span className="data-label">Harvest Date:</span>
              <span className="data-value">{submittedData.harvest_date}</span>
            </div>
            <div className="data-item">
              <span className="data-label">Product Type:</span>
              <span className="data-value">{submittedData.product_type}</span>
            </div>
            <div className="data-item">
              <span className="data-label">Batch ID:</span>
              <span className="data-value">{submittedData.batch_id}</span>
            </div>
            <div className="data-item">
              <span className="data-label">Farming Method:</span>
              <span className="data-value">{submittedData.farming_method}</span>
            </div>
            <div className="data-item">
              <span className="data-label">Certifications:</span>
              <span className="data-value">{submittedData.certifications}</span>
            </div>
          </div>
        </div>
        
        <QRCodeGenerator data={submittedData} />
        
        <div className="blockchain-explorer">
          <h4>View on Blockchain Explorer</h4>
          <p>Your transaction has been recorded on the blockchain. You can view it using the explorer:</p>
          <a 
            href="http://167.99.222.73:8090/#/transactions" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-secondary explorer-btn"
          >
            🔗 View Transaction on Blockchain Explorer
          </a>
        </div>
        
        <div className="success-actions">
          <button onClick={resetForm} className="btn btn-primary">
            Add Another Entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="farm-entry-form">
      <div className="form-header">
        <h2>Farm Entry Data</h2>
        <p>Enter your farm product information to add it to the blockchain</p>
      </div>
      
      <form onSubmit={handleSubmit} className="entry-form">
        <div className="form-group">
          <label htmlFor="farm_id" className="form-label">Farm ID (Auto-generated)</label>
          <input
            type="text"
            id="farm_id"
            name="farm_id"
            value={formData.farm_id}
            className="form-input"
            readOnly
            style={{ backgroundColor: '#f7fafc', color: '#718096' }}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="farm_name" className="form-label">Farm Name</label>
          <input
            type="text"
            id="farm_name"
            name="farm_name"
            value={formData.farm_name}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., Green Valley Farm, Organic Acres"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="location_coordinates" className="form-label">Location Coordinates (GPS)</label>
          <div className="location-input-group">
            <input
              type="text"
              id="location_coordinates"
              name="location_coordinates"
              value={formData.location_coordinates}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., 40.7128, -74.0060"
              required
            />
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="location-btn"
            >
              {isGettingLocation ? (
                <>
                  <span className="spinner"></span>
                  Getting Location...
                </>
              ) : (
                <>
                  📍 Get Current Location
                </>
              )}
            </button>
          </div>
          {locationError && (
            <div className="location-error">
              {locationError}
              {showLocationHelp && (
                <div className="location-help">
                  <h4>Location Permission Required</h4>
                  <div className="permission-info">
                    <p>When you click "Get Current Location", your browser will show a permission dialog asking:</p>
                    <div className="permission-dialog-example">
                      <strong>"sourcetrak-frontend wants to know your location"</strong>
                      <div className="permission-options">
                        <span className="option allow">✓ Allow</span>
                        <span className="option block">✗ Block</span>
                      </div>
                    </div>
                    <p>Please click <strong>"Allow"</strong> to enable location access.</p>
                  </div>
                  <div className="browser-instructions">
                    <h5>If you don't see the permission dialog:</h5>
                    <div className="browser-item">
                      <strong>Chrome/Edge:</strong> Click the lock icon in the address bar → Site settings → Location → Allow
                    </div>
                    <div className="browser-item">
                      <strong>Firefox:</strong> Click the shield icon → Permissions → Location → Allow
                    </div>
                    <div className="browser-item">
                      <strong>Safari:</strong> Safari menu → Preferences → Websites → Location → Allow
                    </div>
                  </div>
                  <div className="help-actions">
                    <button 
                      type="button" 
                      onClick={getCurrentLocation}
                      className="btn btn-primary btn-sm"
                    >
                      Try Again
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setShowLocationHelp(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="form-group">
          <label htmlFor="harvest_date" className="form-label">Harvest Date</label>
          <input
            type="date"
            id="harvest_date"
            name="harvest_date"
            value={formData.harvest_date}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="product_type" className="form-label">Product Type</label>
          <input
            type="text"
            id="product_type"
            name="product_type"
            value={formData.product_type}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., tomatoes, chickpeas, lettuce"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="batch_id" className="form-label">Batch ID (Auto-generated)</label>
          <input
            type="text"
            id="batch_id"
            name="batch_id"
            value={formData.batch_id}
            className="form-input"
            readOnly
            style={{ backgroundColor: '#f7fafc', color: '#718096' }}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="farming_method" className="form-label">Farming Method</label>
          <select
            id="farming_method"
            name="farming_method"
            value={formData.farming_method}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Select farming method</option>
            {farmingMethods.map(method => (
              <option key={method} value={method.toLowerCase()}>
                {method}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="certifications" className="form-label">Certifications</label>
          <select
            id="certifications"
            name="certifications"
            value={formData.certifications}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Select certification</option>
            {certifications.map(cert => (
              <option key={cert} value={cert}>
                {cert}
              </option>
            ))}
          </select>
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting to Blockchain...' : 'Submit to Blockchain'}
        </button>
      </form>
    </div>
  );
};

export default FarmEntryForm;

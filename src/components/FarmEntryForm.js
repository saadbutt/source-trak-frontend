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
    certifications: '',
    farmer_signature: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');

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

    setIsGettingLocation(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
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
            setLocationError('Location access denied by user. Please enable location permissions or enter coordinates manually.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable. Please enter coordinates manually.');
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
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
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
      certifications: '',
      farmer_signature: ''
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
            <div className="data-item">
              <span className="data-label">Farmer Signature:</span>
              <span className="data-value">{submittedData.farmer_signature}</span>
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
        
        <div className="form-group">
          <label htmlFor="farmer_signature" className="form-label">Farmer Signature</label>
          <input
            type="text"
            id="farmer_signature"
            name="farmer_signature"
            value={formData.farmer_signature}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter your digital signature"
            required
          />
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

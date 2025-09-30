import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import QRCodeGenerator from './QRCodeGenerator';
import '../styles/FarmEntry.css';

const FarmEntryForm = ({ onDataSubmit, initialBatchId, userRole }) => {
  const { user } = useAuth();
  
  // Component props: initialBatchId, userRole, onDataSubmit
  
  const [formData, setFormData] = useState({
    farm_id: uuidv4(),
    farm_name: '',
    location_coordinates: '',
    harvest_date: '',
    product_type: '',
    batch_id: initialBatchId || '', // Use initialBatchId if provided
    farming_method: '',
    certifications: '',
    event_id: uuidv4()
  });
  
  // Update batch_id when initialBatchId changes
  useEffect(() => {
    if (initialBatchId && initialBatchId !== formData.batch_id) {
      setFormData(prev => ({ ...prev, batch_id: initialBatchId }));
    }
  }, [initialBatchId]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showLocationHelp, setShowLocationHelp] = useState(false);
  const [error, setError] = useState('');

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
    setError('');
    
    try {
      let batchId;
      
      // Determine batch ID based on context
      if (initialBatchId) {
        // Adding data to existing batch (from DataDetailView)
        batchId = initialBatchId;
      } else {
        // Creating new entry (from Dashboard)
        if (user && user.role === 'Farmer') {
          // Farmers can create new batches
          const batchResponse = await apiService.createBatch(user.id);
          batchId = batchResponse.batch_id;
          setFormData(prev => ({ ...prev, batch_id: batchId }));
        } else {
          // Non-farmers need to provide a batch ID for new entries
          throw new Error('Batch ID is required for new entries. Please contact a farmer to create a batch first.');
        }
      }
      
      if (!batchId) {
        throw new Error('Batch ID is required');
      }
      
      // Prepare data for submission
      const submissionData = {
        ...formData,
        batch_id: batchId
      };
      
      // Submit data to backend
      const response = await apiService.submitData(submissionData);
      
      const newData = {
        ...submissionData,
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        status: response.status || 'verified',
        txHash: response.txHash || 'pending',
        message: response.message || 'Data submitted successfully'
      };
      
      setSubmittedData(newData);
      setShowQRCode(true);
      
      if (onDataSubmit) {
        onDataSubmit(newData);
      }
    } catch (error) {
      console.error('Submission error:', error);
      setError(error.message || 'Failed to submit data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

    const resetForm = () => {
    setFormData({
      farm_id: uuidv4(),
      farm_name: '',
      location_coordinates: '',
      harvest_date: '',
      product_type: '',
      batch_id: '',
      farming_method: '',
      certifications: '',
      event_id: uuidv4()
    });
    setShowQRCode(false);
    setSubmittedData(null);
    setError('');
  };

  if (showQRCode && submittedData) {
    return (
      <div className="success-page">
        {/* Simple Header */}
        <div className="success-header-simple">
          <div className="success-icon">✅</div>
          <h1>Data Successfully Submitted!</h1>
          <p>{submittedData.message || 'Your farm data has been verified and added to the blockchain.'}</p>
        </div>

        {/* Simple Form Layout */}
        <div className="success-form">
          <div className="form-group">
            <label>Batch ID</label>
            <input type="text" value={submittedData.batch_id} readOnly className="form-input" />
          </div>

          <div className="form-group">
            <label>Farm Name</label>
            <input type="text" value={submittedData.farm_name} readOnly className="form-input" />
          </div>

          <div className="form-group">
            <label>Product Type</label>
            <input type="text" value={submittedData.product_type} readOnly className="form-input" />
          </div>

          <div className="form-group">
            <label>Harvest Date</label>
            <input type="text" value={submittedData.harvest_date} readOnly className="form-input" />
          </div>

          <div className="form-group">
            <label>Farming Method</label>
            <input type="text" value={submittedData.farming_method} readOnly className="form-input" />
          </div>

          <div className="form-group">
            <label>Certifications</label>
            <input type="text" value={submittedData.certifications} readOnly className="form-input" />
          </div>

          <div className="form-group">
            <label>Location Coordinates</label>
            <input type="text" value={submittedData.location_coordinates} readOnly className="form-input" />
          </div>

          <div className="form-group">
            <label>Transaction Hash</label>
            <input 
              type="text" 
              value={submittedData.txHash || 'Pending'} 
              readOnly 
              className="form-input" 
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="success-actions-simple">
          <button onClick={resetForm} className="btn btn-primary">
            Add Another Entry
          </button>
          <a 
            href="http://167.99.222.73:8090/#/transactions" 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            🔗 Blockchain Explorer
          </a>
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
          <label htmlFor="batch_id" className="form-label">
            Batch ID {initialBatchId ? '(Adding to existing batch)' : (user?.role === 'Farmer' ? '(Will create new batch)' : '(Requires existing batch)')}
          </label>
          <input
            type="text"
            id="batch_id"
            name="batch_id"
            value={formData.batch_id || (initialBatchId ? initialBatchId : (user?.role === 'Farmer' ? 'Will be generated on submission' : 'Contact farmer to create batch first'))}
            className="form-input"
            readOnly
            disabled
            style={{ backgroundColor: '#f7fafc', color: '#718096', cursor: 'not-allowed' }}
          />
        </div>
        
        {/* Hidden field for event_id */}
        <input
          type="hidden"
          name="event_id"
          value={formData.event_id}
        />
        
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
        
        {/* Error/Success message displayed near submit button */}
        {error && (
          <div className="error-message" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        
        <button 
          type="submit" 
          className="btn btn-primary submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting 
            ? (initialBatchId ? 'Adding to Batch...' : 'Creating New Batch...') 
            : (initialBatchId ? 'Add Data to Batch' : 'Submit to Blockchain')
          }
        </button>
      </form>
    </div>
  );
};

export default FarmEntryForm;

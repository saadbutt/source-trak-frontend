import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import QRCodeGenerator from './QRCodeGenerator';
import '../styles/DistributionEntry.css';

const DistributionEntryForm = ({ onDataSubmit, initialBatchId, userRole }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    retailer_id: uuidv4(),
    distribution_center_location: '',
    store_location: '',
    product_arrival_timestamp: '',
    inventory_id: '',
    shelf_life_remaining: '',
    batch_id: initialBatchId || '',
    display_date: '',
    product_qr_code: '',
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
  const [error, setError] = useState('');

  const shelfLifeOptions = [
    '1-2 days',
    '3-5 days',
    '1 week',
    '2 weeks',
    '1 month',
    '2-3 months',
    '6 months',
    '1 year',
    '2+ years'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validate mandatory fields
      const mandatoryFields = [
        'retailer_id',
        'store_location',
        'inventory_id',
        'shelf_life_remaining',
        'display_date',
        'product_qr_code'
      ];

      const missingFields = mandatoryFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing mandatory fields: ${missingFields.join(', ')}`);
      }

      const response = await apiService.submitTraceabilityData('Distribution/Retail', formData);
      
      if (response.success) {
        setSubmittedData(formData);
        setShowQRCode(true);
        if (onDataSubmit) {
          onDataSubmit(formData);
        }
      } else {
        throw new Error(response.message || 'Failed to submit distribution data');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while submitting the data');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showQRCode && submittedData) {
    return (
      <QRCodeGenerator data={submittedData} />
    );
  }

  return (
    <div className="distribution-entry-form">
      <div className="form-header">
        <h2>🏪 Distribution/Retail Entry</h2>
        <p>Enter distribution and retail information for your product</p>
      </div>
      
      <form onSubmit={handleSubmit} className="entry-form">
        <div className="form-group">
          <label htmlFor="retailer_id" className="form-label">Retailer ID (Auto-generated)</label>
          <input
            type="text"
            id="retailer_id"
            name="retailer_id"
            value={formData.retailer_id}
            className="form-input"
            readOnly
            style={{ backgroundColor: '#f7fafc', color: '#718096' }}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="distribution_center_location" className="form-label">Distribution Center Location <span className="optional-indicator">(Optional)</span></label>
          <input
            type="text"
            id="distribution_center_location"
            name="distribution_center_location"
            value={formData.distribution_center_location}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., Central Distribution Hub, City, State"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="store_location" className="form-label">Store Location <span className="mandatory-indicator">*</span></label>
          <input
            type="text"
            id="store_location"
            name="store_location"
            value={formData.store_location}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., Store #123, Main Street, City, State"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="product_arrival_timestamp" className="form-label">Product Arrival Timestamp <span className="optional-indicator">(Optional)</span></label>
          <input
            type="datetime-local"
            id="product_arrival_timestamp"
            name="product_arrival_timestamp"
            value={formData.product_arrival_timestamp}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="inventory_id" className="form-label">Inventory ID <span className="mandatory-indicator">*</span></label>
          <input
            type="text"
            id="inventory_id"
            name="inventory_id"
            value={formData.inventory_id}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., INV-2024-001"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="shelf_life_remaining" className="form-label">Shelf Life Remaining <span className="mandatory-indicator">*</span></label>
          <select
            id="shelf_life_remaining"
            name="shelf_life_remaining"
            value={formData.shelf_life_remaining}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Select shelf life remaining</option>
            {shelfLifeOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="batch_id" className="form-label">
            Batch ID  {initialBatchId ? '(Adding to existing batch)' : '(Optional for distribution)'}
          </label>
          <input
            type="text"
            id="batch_id"
            name="batch_id"
            value={formData.batch_id}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter batch ID if available"
            readOnly={!!initialBatchId}
            style={initialBatchId ? { backgroundColor: '#f7fafc', color: '#718096' } : {}}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="display_date" className="form-label">Display Date <span className="mandatory-indicator">*</span></label>
          <input
            type="date"
            id="display_date"
            name="display_date"
            value={formData.display_date}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="product_qr_code" className="form-label">Product QR Code <span className="mandatory-indicator">*</span></label>
          <input
            type="text"
            id="product_qr_code"
            name="product_qr_code"
            value={formData.product_qr_code}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., QR-2024-ABC123"
            required
          />
        </div>
        
        {/* Hidden field for event_id */}
        <input
          type="hidden"
          name="event_id"
          value={formData.event_id}
        />
        
        {/* Error/Success message displayed near submit button */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary submit-btn"
        >
          {isSubmitting ? (
            <>
              <span className="spinner"></span>
              {initialBatchId ? 'Adding to Batch...' : 'Submitting Distribution Data...'}
            </>
          ) : (
            initialBatchId ? 'Add Distribution Data to Batch' : 'Submit Distribution Data'
          )}
        </button>
      </form>
    </div>
  );
};

export default DistributionEntryForm;

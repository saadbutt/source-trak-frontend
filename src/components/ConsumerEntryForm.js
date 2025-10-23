import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import QRCodeGenerator from './QRCodeGenerator';
import '../styles/ConsumerEntry.css';

const ConsumerEntryForm = ({ onDataSubmit, initialBatchId, userRole }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    qrid: uuidv4(),
    product_authentication_status: '',
    scan_timestamp: '',
    scan_location: '',
    consumer_feedback: '',
    loyalty_id: '',
    sustainability_score: '',
    batch_id: initialBatchId || '',
    event_id: uuidv4()
  });
  
  // Update batch_id when initialBatchId changes
  useEffect(() => {
    if (initialBatchId && initialBatchId !== formData.batch_id) {
      setFormData(prev => ({ ...prev, batch_id: initialBatchId }));
    }
  }, [initialBatchId, formData.batch_id]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [error, setError] = useState('');

  const authenticationStatuses = [
    'Authentic',
    'Counterfeit',
    'Suspicious',
    'Unknown',
    'Pending Verification'
  ];

  const sustainabilityScores = [
    '1 - Poor',
    '2 - Below Average',
    '3 - Average',
    '4 - Good',
    '5 - Excellent'
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
        'qrid',
        'scan_timestamp',
        'consumer_feedback',
        'loyalty_id',
        'sustainability_score'
      ];

      const missingFields = mandatoryFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing mandatory fields: ${missingFields.join(', ')}`);
      }

      const response = await apiService.submitTraceabilityData('Consumer Interaction', formData);
      
      if (response.success) {
        setSubmittedData(formData);
        setShowQRCode(true);
        if (onDataSubmit) {
          onDataSubmit(formData);
        }
      } else {
        throw new Error(response.message || 'Failed to submit consumer data');
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
    <div className="consumer-entry-form">
      <div className="form-header">
        <h2>👥 Consumer Interaction Entry</h2>
        <p>Enter consumer interaction and feedback information</p>
      </div>
      
      <form onSubmit={handleSubmit} className="entry-form">
        <div className="form-group">
          <label htmlFor="qrid" className="form-label">QR ID (Auto-generated)</label>
          <input
            type="text"
            id="qrid"
            name="qrid"
            value={formData.qrid}
            className="form-input"
            readOnly
            style={{ backgroundColor: '#f7fafc', color: '#718096' }}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="product_authentication_status" className="form-label">Product Authentication Status <span className="optional-indicator">(Optional)</span></label>
          <select
            id="product_authentication_status"
            name="product_authentication_status"
            value={formData.product_authentication_status}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Select authentication status</option>
            {authenticationStatuses.map(status => (
              <option key={status} value={status.toLowerCase()}>
                {status}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="scan_timestamp" className="form-label">Scan Timestamp <span className="mandatory-indicator">*</span></label>
          <input
            type="datetime-local"
            id="scan_timestamp"
            name="scan_timestamp"
            value={formData.scan_timestamp}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="scan_location" className="form-label">Scan Location <span className="optional-indicator">(Optional)</span></label>
          <input
            type="text"
            id="scan_location"
            name="scan_location"
            value={formData.scan_location}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., Store #123, City, State"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="consumer_feedback" className="form-label">Consumer Feedback <span className="mandatory-indicator">*</span></label>
          <textarea
            id="consumer_feedback"
            name="consumer_feedback"
            value={formData.consumer_feedback}
            onChange={handleChange}
            className="form-textarea"
            placeholder="e.g., Great product quality, fresh taste, would buy again"
            rows="4"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="loyalty_id" className="form-label">Loyalty ID <span className="mandatory-indicator">*</span></label>
          <input
            type="text"
            id="loyalty_id"
            name="loyalty_id"
            value={formData.loyalty_id}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., LOY-2024-ABC123"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="sustainability_score" className="form-label">Sustainability Score <span className="mandatory-indicator">*</span></label>
          <select
            id="sustainability_score"
            name="sustainability_score"
            value={formData.sustainability_score}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Select sustainability score</option>
            {sustainabilityScores.map(score => (
              <option key={score} value={score}>
                {score}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="batch_id" className="form-label">
            Batch ID {initialBatchId ? '(Adding to existing batch)' : '(Optional for consumer interaction)'}
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
              {initialBatchId ? 'Adding to Batch...' : 'Submitting Consumer Data...'}
            </>
          ) : (
            initialBatchId ? 'Add Consumer Data to Batch' : 'Submit Consumer Data'
          )}
        </button>
      </form>
    </div>
  );
};

export default ConsumerEntryForm;

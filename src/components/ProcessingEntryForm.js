import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import QRCodeGenerator from './QRCodeGenerator';
import '../styles/ProcessingEntry.css';

const ProcessingEntryForm = ({ onDataSubmit, initialBatchId, userRole }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    processor_id: uuidv4(),
    facility_name: '',
    processing_date: '',
    product_transformation_details: '',
    packaging_type: '',
    expiration_date: '',
    lot_number: '',
    quality_check_result: '',
    processing_certifications: '',
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

  const packagingTypes = [
    'Plastic Bag',
    'Cardboard Box',
    'Glass Jar',
    'Metal Can',
    'Vacuum Sealed',
    'Modified Atmosphere',
    'Biodegradable',
    'Recyclable',
    'Bulk Container',
    'Individual Portions'
  ];

  const qualityCheckResults = [
    'Passed',
    'Failed',
    'Conditional Pass',
    'Pending Review',
    'Requires Retest'
  ];

  const processingCertifications = [
    'HACCP',
    'ISO 22000',
    'SQF',
    'BRC',
    'FSSC 22000',
    'IFS',
    'Kosher',
    'Halal',
    'Organic',
    'Non-GMO',
    'None'
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
        'processor_id',
        'processing_date',
        'packaging_type',
        'expiration_date',
        'lot_number',
        'quality_check_result',
        'processing_certifications',
        'batch_id'
      ];

      const missingFields = mandatoryFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing mandatory fields: ${missingFields.join(', ')}`);
      }

      console.log('Submitting ProcessingEntryForm data:', formData);
      const response = await apiService.submitTraceabilityData('Processing/Packaging', formData);
      
      if (response.success) {
        setSubmittedData(formData);
        setShowQRCode(true);
        if (onDataSubmit) {
          onDataSubmit(formData);
        }
      } else {
        throw new Error(response.message || 'Failed to submit processing data');
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
    <div className="processing-entry-form">
      <div className="form-header">
        <h2>🏭 Processing/Packaging Entry</h2>
        <p>Enter processing and packaging information for your product batch</p>
      </div>
      
      <form onSubmit={handleSubmit} className="entry-form">
        <div className="form-group">
          <label htmlFor="processor_id" className="form-label">Processor ID (Auto-generated)</label>
          <input
            type="text"
            id="processor_id"
            name="processor_id"
            value={formData.processor_id}
            className="form-input"
            readOnly
            style={{ backgroundColor: '#f7fafc', color: '#718096' }}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="facility_name" className="form-label">Facility Name <span className="optional-indicator">(Optional)</span></label>
          <input
            type="text"
            id="facility_name"
            name="facility_name"
            value={formData.facility_name}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., Green Valley Processing Plant"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="processing_date" className="form-label">Processing Date <span className="mandatory-indicator">*</span></label>
          <input
            type="date"
            id="processing_date"
            name="processing_date"
            value={formData.processing_date}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="product_transformation_details" className="form-label">Product Transformation Details <span className="optional-indicator">(Optional)</span></label>
          <textarea
            id="product_transformation_details"
            name="product_transformation_details"
            value={formData.product_transformation_details}
            onChange={handleChange}
            className="form-textarea"
            placeholder="e.g., Washed, sorted, and packaged into 500g portions"
            rows="3"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="packaging_type" className="form-label">Packaging Type <span className="mandatory-indicator">*</span></label>
          <select
            id="packaging_type"
            name="packaging_type"
            value={formData.packaging_type}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Select packaging type</option>
            {packagingTypes.map(type => (
              <option key={type} value={type.toLowerCase()}>
                {type}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="expiration_date" className="form-label">Expiration Date <span className="mandatory-indicator">*</span></label>
          <input
            type="date"
            id="expiration_date"
            name="expiration_date"
            value={formData.expiration_date}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="lot_number" className="form-label">Lot Number <span className="mandatory-indicator">*</span></label>
          <input
            type="text"
            id="lot_number"
            name="lot_number"
            value={formData.lot_number}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., LOT2024001"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="quality_check_result" className="form-label">Quality Check Result <span className="mandatory-indicator">*</span></label>
          <select
            id="quality_check_result"
            name="quality_check_result"
            value={formData.quality_check_result}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Select quality check result</option>
            {qualityCheckResults.map(result => (
              <option key={result} value={result.toLowerCase()}>
                {result}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="processing_certifications" className="form-label">Processing Certifications <span className="mandatory-indicator">*</span></label>
          <select
            id="processing_certifications"
            name="processing_certifications"
            value={formData.processing_certifications}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Select certification</option>
            {processingCertifications.map(cert => (
              <option key={cert} value={cert}>
                {cert}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="batch_id" className="form-label">
            Batch ID <span className="mandatory-indicator">*</span> {initialBatchId ? '(Adding to existing batch)' : '(Requires existing batch)'}
          </label>
          <input
            type="text"
            id="batch_id"
            name="batch_id"
            value={formData.batch_id}
            onChange={handleChange}
            className="form-input"
            placeholder="Enter existing batch ID"
            required
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
              {initialBatchId ? 'Adding to Batch...' : 'Submitting Processing Data...'}
            </>
          ) : (
            initialBatchId ? 'Add Processing Data to Batch' : 'Submit Processing Data'
          )}
        </button>
      </form>
    </div>
  );
};

export default ProcessingEntryForm;

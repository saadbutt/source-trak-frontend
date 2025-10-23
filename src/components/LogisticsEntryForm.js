import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import QRCodeGenerator from './QRCodeGenerator';
import '../styles/LogisticsEntry.css';

const LogisticsEntryForm = ({ onDataSubmit, initialBatchId, userRole }) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    shipment_id: uuidv4(),
    logistics_provider_id: '',
    departure_time: '',
    arrival_time: '',
    real_time_temperature_logs: '',
    humidity_logs: '',
    GPS_tracking_hash: '',
    cold_chain_breach_flags: '',
    transport_certification_status: '',
    batch_id: initialBatchId || '',
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

  const logisticsProviders = [
    'FedEx',
    'UPS',
    'DHL',
    'Amazon Logistics',
    'USPS',
    'TNT Express',
    'DB Schenker',
    'Kuehne + Nagel',
    'C.H. Robinson',
    'XPO Logistics',
    'Other'
  ];

  const transportCertifications = [
    'ISO 9001',
    'ISO 14001',
    'ISO 45001',
    'HACCP',
    'FSSC 22000',
    'BRC',
    'IFS',
    'SQF',
    'Cold Chain Certified',
    'GDP Compliant',
    'None'
  ];

  const coldChainBreachFlags = [
    'No Breach',
    'Temperature Exceeded',
    'Humidity Exceeded',
    'Delay in Transit',
    'Equipment Failure',
    'Multiple Issues',
    'Unknown'
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
        'shipment_id',
        'logistics_provider_id',
        'departure_time',
        'arrival_time',
        'batch_id'
      ];

      const missingFields = mandatoryFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing mandatory fields: ${missingFields.join(', ')}`);
      }

      const response = await apiService.submitTraceabilityData('Logistics & Cold Chain Monitoring', formData);
      
      if (response.success) {
        setSubmittedData(formData);
        setShowQRCode(true);
        if (onDataSubmit) {
          onDataSubmit(formData);
        }
      } else {
        throw new Error(response.message || 'Failed to submit logistics data');
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
    <div className="logistics-entry-form">
      <div className="form-header">
        <h2>🚚 Logistics & Cold Chain Monitoring</h2>
        <p>Enter logistics and cold chain monitoring information for your shipment</p>
      </div>
      
      <form onSubmit={handleSubmit} className="entry-form">
        <div className="form-group">
          <label htmlFor="shipment_id" className="form-label">Shipment ID (Auto-generated)</label>
          <input
            type="text"
            id="shipment_id"
            name="shipment_id"
            value={formData.shipment_id}
            className="form-input"
            readOnly
            style={{ backgroundColor: '#f7fafc', color: '#718096' }}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="logistics_provider_id" className="form-label">Logistics Provider <span className="mandatory-indicator">*</span></label>
          <select
            id="logistics_provider_id"
            name="logistics_provider_id"
            value={formData.logistics_provider_id}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Select logistics provider</option>
            {logisticsProviders.map(provider => (
              <option key={provider} value={provider.toLowerCase()}>
                {provider}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="departure_time" className="form-label">Departure Time <span className="mandatory-indicator">*</span></label>
          <input
            type="datetime-local"
            id="departure_time"
            name="departure_time"
            value={formData.departure_time}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="arrival_time" className="form-label">Arrival Time <span className="mandatory-indicator">*</span></label>
          <input
            type="datetime-local"
            id="arrival_time"
            name="arrival_time"
            value={formData.arrival_time}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="real_time_temperature_logs" className="form-label">Real-time Temperature Logs <span className="optional-indicator">(Optional)</span></label>
          <textarea
            id="real_time_temperature_logs"
            name="real_time_temperature_logs"
            value={formData.real_time_temperature_logs}
            onChange={handleChange}
            className="form-textarea"
            placeholder="e.g., 2°C at 10:00, 3°C at 11:00, 2.5°C at 12:00"
            rows="3"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="humidity_logs" className="form-label">Humidity Logs <span className="optional-indicator">(Optional)</span></label>
          <textarea
            id="humidity_logs"
            name="humidity_logs"
            value={formData.humidity_logs}
            onChange={handleChange}
            className="form-textarea"
            placeholder="e.g., 65% at 10:00, 68% at 11:00, 66% at 12:00"
            rows="3"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="GPS_tracking_hash" className="form-label">GPS Tracking Hash <span className="optional-indicator">(Optional)</span></label>
          <input
            type="text"
            id="GPS_tracking_hash"
            name="GPS_tracking_hash"
            value={formData.GPS_tracking_hash}
            onChange={handleChange}
            className="form-input"
            placeholder="e.g., GPS_HASH_ABC123XYZ"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="cold_chain_breach_flags" className="form-label">Cold Chain Breach Flags <span className="optional-indicator">(Optional)</span></label>
          <select
            id="cold_chain_breach_flags"
            name="cold_chain_breach_flags"
            value={formData.cold_chain_breach_flags}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Select breach status</option>
            {coldChainBreachFlags.map(flag => (
              <option key={flag} value={flag.toLowerCase()}>
                {flag}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="transport_certification_status" className="form-label">Transport Certification Status <span className="optional-indicator">(Optional)</span></label>
          <select
            id="transport_certification_status"
            name="transport_certification_status"
            value={formData.transport_certification_status}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Select certification status</option>
            {transportCertifications.map(cert => (
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
              {initialBatchId ? 'Adding to Batch...' : 'Submitting Logistics Data...'}
            </>
          ) : (
            initialBatchId ? 'Add Logistics Data to Batch' : 'Submit Logistics Data'
          )}
        </button>
      </form>
    </div>
  );
};

export default LogisticsEntryForm;

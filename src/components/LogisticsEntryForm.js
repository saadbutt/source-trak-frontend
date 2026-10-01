import React, { useState, useEffect } from 'react';
import { FiTruck } from 'react-icons/fi';
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

  // Cross-industry transport certifications; stored as free text.
  const transportCertifications = [
    'None',
    'ISO 9001 (Quality)',
    'ISO 14001 (Environmental)',
    'ISO 45001 (Health & Safety)',
    'ISO 28000 (Supply Chain Security)',
    'TAPA (Cargo Security)',
    'GDP (Good Distribution Practice)',
    'Temperature-Controlled Certified',
    'None'
  ];

  // Shipment condition alerts; stored as free text in cold_chain_breach_flags.
  const coldChainBreachFlags = [
    'No Issues',
    'Temperature Exceeded',
    'Humidity Exceeded',
    'Delay in Transit',
    'Damage / Shock Detected',
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
        <div className="icon-tile"><FiTruck /></div>
        <h2>Logistics & Transport</h2>
        <p>Record shipment timing and transport conditions for this batch</p>
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
          <label htmlFor="real_time_temperature_logs" className="form-label">Temperature Logs <span className="optional-indicator">(Optional)</span></label>
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
          <label htmlFor="cold_chain_breach_flags" className="form-label">Shipment Condition Alerts <span className="optional-indicator">(Optional)</span></label>
          <select
            id="cold_chain_breach_flags"
            name="cold_chain_breach_flags"
            value={formData.cold_chain_breach_flags}
            onChange={handleChange}
            className="form-select"
          >
            <option value="">Select condition status</option>
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

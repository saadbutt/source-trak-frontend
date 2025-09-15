// Data Storage Utilities for SourceTrak

export const saveFarmData = (data) => {
  try {
    const existingData = getFarmData();
    const updatedData = [data, ...existingData];
    localStorage.setItem('sourcetrak-farm-data', JSON.stringify(updatedData));
    return true;
  } catch (error) {
    console.error('Error saving farm data:', error);
    return false;
  }
};

export const getFarmData = () => {
  try {
    const data = localStorage.getItem('sourcetrak-farm-data');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error retrieving farm data:', error);
    return [];
  }
};

export const clearFarmData = () => {
  try {
    localStorage.removeItem('sourcetrak-farm-data');
    return true;
  } catch (error) {
    console.error('Error clearing farm data:', error);
    return false;
  }
};

export const generateBatchId = () => {
  return 'batch_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const validateFarmData = (data) => {
  const required = ['productType', 'harvestDate', 'farmingMethod', 'batchQuantity'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    return {
      isValid: false,
      errors: missing.map(field => `${field} is required`)
    };
  }
  
  // Validate harvest date is not in the future
  const harvestDate = new Date(data.harvestDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (harvestDate > today) {
    return {
      isValid: false,
      errors: ['Harvest date cannot be in the future']
    };
  }
  
  return { isValid: true, errors: [] };
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

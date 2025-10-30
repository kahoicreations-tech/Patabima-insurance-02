/**
 * Utility functions for insurance premium calculations
 */

/**
 * Calculate basic premium based on vehicle value and insurer base rate
 * @param {number} vehicleValue - Value of the vehicle
 * @param {number} baseRate - Base rate in percentage
 * @returns {number} - Basic premium amount
 */
export const calculateBasicPremium = (vehicleValue, baseRate) => {
  return vehicleValue * (baseRate / 100);
};

/**
 * Calculate age factor based on vehicle age
 * @param {number} yearOfManufacture - Year the vehicle was manufactured
 * @returns {number} - Age factor multiplier
 */
export const getVehicleAgeFactor = (yearOfManufacture) => {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - parseInt(yearOfManufacture || currentYear);
  
  if (vehicleAge > 10) return 1.3;
  if (vehicleAge > 5) return 1.1;
  return 1.0;
};

/**
 * Calculate engine capacity factor
 * @param {number} engineCapacity - Engine capacity in CC
 * @returns {number} - Engine capacity factor multiplier
 */
export const getEngineCapacityFactor = (engineCapacity) => {
  const engineCC = parseInt(engineCapacity || 0);
  if (engineCC > 3000) return 1.2;
  if (engineCC > 2000) return 1.1;
  return 1.0;
};

/**
 * Get minimum premium based on vehicle category
 * @param {string} vehicleCategoryId - ID of the vehicle category
 * @returns {number} - Minimum premium amount
 */
export const getMinimumPremium = (vehicleCategoryId) => {
  const minimumPremiums = {
    'private': 15000,
    'commercial': 25000,
    'psv': 35000,
    'motorcycle': 8000,
    'tuktuk': 12000,
    'special': 20000
  };
  
  return minimumPremiums[vehicleCategoryId] || 15000;
};

/**
 * Calculate statutory levies
 * @param {number} basicPremium - Basic premium amount
 * @returns {Object} - Object containing levy breakdowns
 */
export const calculateLevies = (basicPremium) => {
  return {
    policyFee: 500,
    stampDuty: 40,
    trainingLevy: basicPremium * 0.002, // 0.2% training levy
    pcf: basicPremium * 0.0025 // 0.25% PCF levy
  };
};

/**
 * Calculate total levies
 * @param {Object} levies - Object containing levy breakdowns
 * @returns {number} - Total levies amount
 */
export const calculateTotalLevies = (levies) => {
  return Object.values(levies).reduce((sum, levy) => sum + levy, 0);
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount) => {
  return `KES ${amount.toLocaleString('en-KE')}`;
};

/**
 * Generate a random policy number
 * @param {string} prefix - Prefix for the policy number
 * @returns {string} - Generated policy number
 */
export const generatePolicyNumber = (prefix = 'PB') => {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  const timestamp = new Date().getTime().toString().slice(-4);
  return `${prefix}-${randomDigits}-${timestamp}`;
};

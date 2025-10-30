export {
  formatCurrency,
  formatDate,
  validateEmail,
  validatePhoneNumber,
  formatPhoneNumber,
  capitalizeWords,
  truncateText,
  generateId,
  debounce
} from './helpers';

export { default as AWSUtils } from './awsUtils';

export {
  calculateBasicPremium,
  getVehicleAgeFactor,
  getEngineCapacityFactor,
  getMinimumPremium,
  calculateLevies,
  calculateTotalLevies,
  formatCurrency as formatInsuranceCurrency,
  generatePolicyNumber
} from './insuranceCalculations/premiumCalculator';

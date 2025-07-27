/**
 * Commercial Motor Insurance Components
 * Reusable components for all commercial motor insurance quotation flows
 * (Third Party, Comprehensive, TPFT)
 */

// Step Components
export { default as CommercialPersonalInformationStep } from './CommercialPersonalInformationStep';
export { default as CommercialVehicleDetailsStep } from './CommercialVehicleDetailsStep';
export { default as CommercialVehicleValueStep } from './CommercialVehicleValueStep';
export { default as CommercialInsurerSelectionStep } from './CommercialInsurerSelectionStep';
export { default as CommercialDocumentUploadStep } from './CommercialDocumentUploadStep';
export { default as CommercialPaymentStep } from './CommercialPaymentStep';

// UI Components
export { default as CommercialQuotationProgressBar } from './CommercialQuotationProgressBar';

// Legacy Components (for backward compatibility)
export { default as BusinessInformationForm } from './CommercialPersonalInformationStep';
export { default as CommercialPremiumCalculator } from './CommercialPremiumCalculator';

// Re-export business logic functions
export {
  calculateCommercialPremium,
  calculateCommercialThirdPartyPremium,
  calculateCommercialComprehensivePremium,
  validateCommercialVehicleEligibility
} from './CommercialPremiumCalculator';

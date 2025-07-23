/**
 * Private Motor Insurance Components
 * Reusable components for all private motor insurance quotation flows
 * (TOR, Comprehensive, Third Party, Third Party Extendible, Motorcycle)
 */

// Step Components
export { default as PersonalInformationStep } from './PersonalInformationStep';
export { default as VehicleDetailsStep } from './VehicleDetailsStep';
export { default as VehicleValueStep } from './VehicleValueStep';
export { default as InsurerSelectionStep } from './InsurerSelectionStep';
export { default as DocumentUploadStep } from './DocumentUploadStep';
export { default as PaymentStep } from './PaymentStep';

// UI Components
export { default as QuotationProgressBar } from './QuotationProgressBar';

// Legacy Components (for backward compatibility)
export { default as OwnerInformationForm } from './PersonalInformationStep';
export { default as PremiumCalculator } from './PremiumCalculator';

// Re-export business logic functions
export {
  calculateMotorPremium,
  validateVehicleEligibility,
  compareInsurerPremiums,
  calculateTORPremium,
  calculateComprehensivePremium,
  calculateThirdPartyPremium
} from './PremiumCalculator';

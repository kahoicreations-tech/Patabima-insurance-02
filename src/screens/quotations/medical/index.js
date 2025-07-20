/**
 * Medical Insurance Screens Index
 * Exports all medical insurance related screens
 */

// Original Medical Quotation Screen removed

// Enhanced Medical Insurance Screens
export { default as EnhancedMedicalCategoryScreen } from './EnhancedMedicalCategoryScreen';
export { default as EnhancedIndividualMedicalQuotation } from './EnhancedIndividualMedicalQuotation';
export { default as EnhancedCorporateMedicalQuotation } from './EnhancedCorporateMedicalQuotation';

// Default export for easier navigation reference
export default {
  EnhancedMedicalCategoryScreen,
  EnhancedIndividualMedicalQuotation,
  EnhancedCorporateMedicalQuotation
};

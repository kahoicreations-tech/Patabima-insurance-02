/**
 * Export all motor insurance related screens and components
 */

// Original Motor Screens - still needed for compatibility
export { default as MotorQuotationScreen } from './MotorQuotationScreen';
export { default as MotorCategorySelectionScreen } from './MotorCategorySelectionScreen';
export { default as MotorProductSelectionScreen } from './MotorProductSelectionScreen';
export { default as CheckInsuranceStatusScreen } from './CheckInsuranceStatusScreen';

// Enhanced Motor Screens (Current Implementation)
export { default as EnhancedMotorCategorySelectionScreen } from './EnhancedMotorCategorySelectionScreen';
export { default as EnhancedMotorProductSelectionScreen } from './EnhancedMotorProductSelectionScreen';
export { default as TORQuotationFlowScreen } from './TORQuotationFlowScreen';

// Export data
export * from './data';

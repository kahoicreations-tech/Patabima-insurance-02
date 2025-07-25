/**
 * Export all motor insurance related screens and components
 */

// Dashboard and Product Selection
export { default as MotorDashboardScreen } from './MotorDashboardScreen';
export { default as EnhancedMotorProductSelectionScreen } from './EnhancedMotorProductSelectionScreen';

// Category Landing Screens
export { default as PrivateVehicleScreen } from './private/PrivateVehicleScreen';
export { default as CommercialVehicleScreen } from './commercial/CommercialVehicleScreen';
export { default as MotorcycleScreen } from './motorcycle/MotorcycleScreen';
export { default as PSVScreen } from './psv/PSVScreen';
export { default as TukTukScreen } from './tuktuk/TukTukScreen';
export { default as SpecialClassesScreen } from './special/SpecialClassesScreen';

// Insurance Category Screens
export { default as TORQuotationFlowScreen } from './private/TORQuotationFlowScreen';
export { default as PrivateThirdPartyScreen } from './private/PrivateThirdPartyScreen';
export { default as PrivateThirdPartyExtendibleScreen } from './private/PrivateThirdPartyExtendibleScreen';
export { default as PrivateComprehensiveScreen } from './private/PrivateComprehensiveScreen';
export { default as PrivateMotorcycleScreen } from './private/PrivateMotorcycleScreen';
export { default as CommercialThirdPartyScreen } from './commercial/CommercialThirdPartyScreen';
export { default as PSVThirdPartyScreen } from './psv/PSVThirdPartyScreen';
export { default as PSVComprehensiveScreen } from './psv/PSVComprehensiveScreen';
export { default as MotorcycleThirdPartyScreen } from './motorcycle/MotorcycleThirdPartyScreen';
export { default as MotorcycleComprehensiveScreen } from './motorcycle/MotorcycleComprehensiveScreen';

// Export data and common components
export * from './data';
export * from './components';

/**
 * Insurance Components Export
 * 
 * Exports all insurance-related components and utilities:
 * - FormEngine: Enhanced form engine with template support
 * - Template System: Field templates, form generator, and screen factory
 * - Screen Creators: Individual screen creation functions
 */

// Main Form Engine
export { default as FormEngine } from './FormEngine';

// Template System
export { 
  FIELD_TEMPLATES, 
  STEP_TEMPLATES, 
  FORM_TEMPLATES,
  FIELD_TYPES,
  VEHICLE_MAKES,
  INSURANCE_PROVIDERS,
  KENYAN_COUNTIES
} from './templates/FieldTemplates';

export { 
  generateFormConfig,
  createCustomFormConfig,
  buildFields,
  resolveConditionalFields,
  getAvailableFormTypes,
  isValidFormType,
  getFieldTemplate,
  generateDefaultFormData,
  updateFormConfigWithData,
  validateFormData
} from './templates/FormGenerator';

export { 
  createInsuranceScreen,
  createAdvancedInsuranceScreen,
  ScreenCreators,
  generateMultipleScreens,
  createNavigationScreens
} from './templates/ScreenFactory';

// Re-export individual screen creators for convenience
import { ScreenCreators } from './templates/ScreenFactory';

export const createTORScreen = ScreenCreators.createTORScreen;
export const createThirdPartyScreen = ScreenCreators.createThirdPartyScreen;
export const createComprehensiveScreen = ScreenCreators.createComprehensiveScreen;
export const createCommercialThirdPartyScreen = ScreenCreators.createCommercialThirdPartyScreen;
export const createCommercialComprehensiveScreen = ScreenCreators.createCommercialComprehensiveScreen;
export const createPSVThirdPartyScreen = ScreenCreators.createPSVThirdPartyScreen;
export const createPSVComprehensiveScreen = ScreenCreators.createPSVComprehensiveScreen;
export const createMotorcycleScreen = ScreenCreators.createMotorcycleScreen;

// Legacy exports (for backwards compatibility)
export { default as GenericFormStep } from './GenericFormStep';
export * from './components';
export * from './config';
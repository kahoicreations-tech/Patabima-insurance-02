// Insurance Quotation Screens - All insurance type quotation forms
// OLD Motor screens removed - using Motor 2 Flow only
// Motor 2 is imported directly in AppNavigator from '../screens/quotations/Motor 2'

// Medical Insurance Exports - Enhanced screens imported directly in AppNavigator to avoid conflicts
// export { 
//   EnhancedMedicalCategoryScreen, 
//   EnhancedIndividualMedicalQuotation, 
//   EnhancedCorporateMedicalQuotation 
// } from './medical';
export { default as WIBAQuotationScreen } from './wiba';
export { default as TravelQuotationScreen } from './travel/TravelQuotationScreen';
export { default as PersonalAccidentQuotationScreen } from './personal-accident/PersonalAccidentQuotationScreen';
export { default as LastExpenseQuotationScreen } from './last-expense/LastExpenseQuotationScreen';
export { default as ProfessionalIndemnityQuotationScreen } from './professional-indemnity/ProfessionalIndemnityQuotationScreen';
export { default as DomesticPackageQuotationScreen } from './domestic-package/DomesticPackageQuotationScreen';

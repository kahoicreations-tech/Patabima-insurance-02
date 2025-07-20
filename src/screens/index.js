// ==========================================
// PATABIMA SCREENS - ORGANIZED EXPORTS
// ==========================================

// Main Application Screens (Core Navigation)
export * from './main';

// Authentication Screens
export * from './auth';

// Insurance Quotation Screens
export * from './quotations';

// Administrative Screens
export * from './admin';

// ==========================================
// INDIVIDUAL EXPORTS FOR BACKWARD COMPATIBILITY
// ==========================================

// Main Screens
export { 
  HomeScreen, 
  QuotationsScreenNew, 
  UpcomingScreen, 
  MyAccountScreen, 
  ClaimsScreenNew,
  RenewalScreen,
  ClaimDetailsScreen,
  ExtensionScreen,
  ClaimsSubmissionScreen 
} from './main';

// Auth Screens
export { SplashScreen, InsuranceWelcomeScreen, LoginScreen, SignupScreen, ForgotPasswordScreen } from './auth';

// Quotation Screens
export { 
  MotorQuotationScreen, 
  MotorCategorySelectionScreen,
  MotorProductSelectionScreen,
  WIBAQuotationScreen, 
  TravelQuotationScreen, 
  PersonalAccidentQuotationScreen, 
  LastExpenseQuotationScreen,
  ProfessionalIndemnityQuotationScreen,
  DomesticPackageQuotationScreen,
  QuoteComparisonScreen 
} from './quotations';

// Admin Screens
export { AdminPricingScreen, AdminPricingScreenAWS } from './admin';

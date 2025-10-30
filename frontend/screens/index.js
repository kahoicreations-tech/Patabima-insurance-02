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
// OLD Motor screens removed - using Motor 2 Flow only
export { 
  WIBAQuotationScreen, 
  TravelQuotationScreen, 
  PersonalAccidentQuotationScreen, 
  LastExpenseQuotationScreen,
  ProfessionalIndemnityQuotationScreen,
  DomesticPackageQuotationScreen
} from './quotations';

// Note: Admin screens and other unused screens moved to _archive

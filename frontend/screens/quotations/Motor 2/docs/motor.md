Motor 2 Directory Scripts - Complete Purpose Listing
📂 Root Level Scripts

1. index.js
   Purpose: Export Hub - Centralized export file for all Motor 2 components
   Function: Exports all components from the MotorInsuranceFlow subdirectories for easy importing
2. TORProductSelector.js
   Purpose: Time on Risk Product Card - Simple product selection component
   Function: Displays TOR pricing and selection button with fixed pricing model
3. ThirdPartyProductForm.js
   Purpose: Third Party Product Form - Handles third-party insurance forms
   Function: Form component for third-party coverage with basic required fields
4. ComprehensiveProductForm.js
   Purpose: Comprehensive Product Form - Complex comprehensive insurance form
   Function: Handles comprehensive coverage with sum insured and additional options
   📂 MotorInsuranceFlow/ Directory
   Main Controller
5. MotorInsuranceScreen.js
   Purpose: Main Flow Controller - Primary orchestrator for the entire Motor 2 insurance flow
   Function: Manages 5-step process (Category → Subcategory → Vehicle Details → Pricing & Underwriter → Coverage)
   Key Features: Step navigation, state management, API coordination, merged pricing+underwriter step
   📂 CategorySelection/ Subdirectory
6. MotorCategoryGrid.js
   Purpose: Category Selection Grid - Visual grid for motor insurance categories
   Function: Displays 6 main categories (Private, Commercial, PSV, Motorcycle, TukTuk, Special) with visual feedback
7. MotorSubcategoryList.js
   Purpose: Subcategory Selection List - Dynamic subcategory selection based on chosen category
   Function: Shows coverage types (TOR, Third Party, Comprehensive, etc.) filtered by category
   📂 VehicleDetails/ Subdirectory
8. DynamicVehicleForm.js
   Purpose: Vehicle Information Form - Dynamic form for vehicle details collection
   Function: Adapts fields based on selected product (reg number, make, model, year, etc.)
   Features: Category-specific fields (tonnage for commercial, passengers for PSV)
   📂 PricingInputs/ Subdirectory
9. DynamicPricingForm.js
   Purpose: Pricing Input Controller - Handles pricing-related form inputs and calculations
   Function: Dynamic form generation, real-time premium calculation, date selection
   Features: Debounced API calls, premium breakdown display, simplified date picker
10. CommercialTonnageSelector.js
    Purpose: Commercial Vehicle Tonnage Selector - Specialized tonnage selection for commercial vehicles
    Function: Provides tonnage brackets (Upto 3 Tons → Over 20 Tons) with pricing implications
11. PSVFeaturesSelector.js
    Purpose: PSV Features Selector - Public Service Vehicle specific features
    Function: Handles passenger capacity, route types, and PSV-specific insurance options
    📂 PremiumCalculation/ Subdirectory
12. PremiumCalculationDisplay.js
    Purpose: Premium Breakdown Display - Shows detailed premium calculations
    Function: Displays base premium, levies, taxes, and total premium with breakdown
13. UnderwriterComparisonView.js
    Purpose: Provider Comparison Cards - Simple underwriter comparison view
    Function: Shows pricing from multiple providers with Net/Gross options in Figma-style cards
    Features: Simple card design, no complex breakdowns, provider selection
14. PremiumBreakdownCard.js
    Purpose: Individual Premium Card - Single premium breakdown card component
    Function: Reusable card component for displaying individual premium calculations
    📂 UnderwriterComparison/ Subdirectory
15. UnderwriterComparisonView.js (Duplicate/Alternative)
    Purpose: Alternative Underwriter Comparison - Secondary implementation of provider comparison
    Function: Alternative version of the underwriter comparison (possibly legacy)
    📂 AdditionalCoverage/ Subdirectory
16. AdditionalCoverageSelector.js
    Purpose: Additional Coverage Options - Optional coverage add-ons selection
    Function: Handles additional benefits like windscreen, theft, fire extensions
    📂 ClientDetails/ Subdirectory
17. EnhancedClientForm.js
    Purpose: Client Information Form - Enhanced client details collection
    Function: Comprehensive client form with validation, contact details, and policy holder information
    📂 Navigation/ Subdirectory
18. MotorInsuranceProgress.js
    Purpose: Progress Indicator - Visual progress bar for the insurance flow
    Function: Shows current step, completed steps, and navigation progress through the 5-step process
19. MotorInsuranceNavigation.js
    Purpose: Navigation Controls - Next/Previous buttons and navigation logic
    Function: Handles step validation, navigation controls, and flow progression
    🔧 Backup/Fix Files
20. MotorInsuranceScreen.js.fix
    Purpose: Backup/Fix File - Backup or fix version of the main screen
    Function: Contains previous or alternative implementation of MotorInsuranceScreen
    📊 Summary by Functionality
    Category Scripts Primary Function
    Flow Control MotorInsuranceScreen.js Main orchestrator
    Category Selection MotorCategoryGrid.js, MotorSubcategoryList.js Category/subcategory selection
    Data Collection DynamicVehicleForm.js, DynamicPricingForm.js, EnhancedClientForm.js Form inputs
    Specialized Inputs CommercialTonnageSelector.js, PSVFeaturesSelector.js Category-specific inputs
    Pricing & Comparison PremiumCalculationDisplay.js, UnderwriterComparisonView.js, PremiumBreakdownCard.js Premium calculations and provider comparison
    Navigation & Progress MotorInsuranceProgress.js, MotorInsuranceNavigation.js Flow navigation
    Product Selectors TORProductSelector.js, ThirdPartyProductForm.js, ComprehensiveProductForm.js Product-specific forms
    Additional Features AdditionalCoverageSelector.js Optional coverage
    Export Management index.js Component exports

# PataBima App - Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

PataBima is a comprehensive React Native Expo application for insurance sales agents in Kenya. The app enables agents to generate quotations, compare underwriter pricing, process payments, and manage policies across multiple insurance categories with sophisticated pricing calculations. The system handles 60+ motor insurance products with real-time premium calculations, mandatory regulatory levies, and dynamic form generation.

## Technology Stack

- **Frontend**: React Native with Expo SDK 53
- **Navigation**: React Navigation v6 (Bottom Tabs + Native Stack)
- **Backend**: Django REST API with PostgreSQL database
- **State Management**: React Context API with reducers for complex state
- **UI Components**: React Native built-in components with custom styling
- **API Communication**: Centralized service layer with DjangoAPIService
- **Payment Integration**: M-PESA, DPO Pay, and other Kenya payment gateways
- **Real-time Calculations**: Dynamic premium calculation engine
- **Data Validation**: Form validation with TypeScript interfaces

## App Features

Based on the comprehensive implementation and wireframes:

### 1. **Dashboard/Home Screen**

- Welcome section with agent greeting and profile
- Summary cards showing Sales, Production, Commission with white card styling
- Insurance categories horizontal slider/carousel (Vehicle, Medical, WIBA, Last Expense)
- Active campaigns horizontal slider with indicators and red CTA buttons
- Upcoming summary section with renewals/extensions count and preview card
- Claims section with search functionality and pill toggles (Pending/Processed)

### 2. **Motor Insurance System (Core Feature)**

- **60+ Motor Insurance Products** across 6 main categories:

  - Private (7 products) - TOR, Third-Party, Comprehensive, Time on Risk
  - Commercial (15 products) - Tonnage-based pricing, Fleet options
  - PSV (15 products) - Passenger capacity-based, PLL options
  - Motorcycle (6 products) - Engine capacity-based
  - TukTuk (6 products) - Capacity-based pricing
  - Special Classes (11 products) - Agricultural, institutional, etc.

- **Dynamic Pricing Engine**:

  - Fixed pricing for TOR/Third-Party products
  - Bracket-based pricing for Comprehensive products (sum insured ranges)
  - Commercial tonnage scale pricing (Upto 3 Tons - Over 20 Tons)
  - Real-time premium calculations with mandatory levies
  - Multi-underwriter comparison

- **Mandatory Regulatory Levies** (Applied to ALL products):

  - Insurance Training Levy (ITL): 0.25% of premium
  - Policyholders Compensation Fund (PCF): 0.25% of premium
  - Stamp Duty: KSh 40 per policy (fixed amount)

- **Progressive Form Flow**:
  - Category Selection → Subcategory Selection → Vehicle Details → Pricing Inputs → Underwriter Comparison → Client Details → Payment → Policy Generation

### 3. **Quotations Management**

- List and manage insurance quotations with detailed policy information
- Real-time premium calculations and underwriter comparisons
- Quote status tracking and follow-up management
- PDF generation and sharing capabilities

### 4. **Upcoming Renewals & Extensions**

- Full detailed view of policy renewals and extensions
- Automated reminder system for agents
- Renewal processing with updated pricing
- Extension management with prorated calculations

#### Motor 2 Policy Lifecycle Management

**Policy States and Transitions:**

1. **Draft** → **Active** (On successful payment)
   - Initial state after quote creation
   - Transitions to Active when payment is confirmed
   - Policy number generated (e.g., POL-2025-XXXXXX)
   - Cover start date set to payment date or future date
   - Cover end date calculated (typically 12 months from start)

2. **Active** → **Renewal Due** (30-90 days before expiry)
   - Active policies approaching expiry become eligible for renewal
   - System calculates renewal window: 90 days before expiry (early bird), 30 days (standard)
   - Renewal reminder notifications sent to agents
   - Original policy remains active until expiry date
   - Renewal creates a NEW quote/policy with:
     - Updated pricing (current year rates)
     - Same vehicle details (unless agent updates)
     - New cover period (12 months from renewal date)
     - Reference to original policy number

3. **Active** → **Expired** (On cover end date)
   - Policy automatically transitions to Expired status
   - No longer provides coverage
   - May be eligible for extension (see below)

4. **Expired** → **Extendable** (Grace period for specific cover types)
   - **Extension Eligibility Rules:**
     - **Third-Party Only**: Can be extended within 90 days of expiry
     - **Time on Risk (TOR)**: Can be extended within 60 days of expiry
     - **Comprehensive**: NOT extendable, must renew or create new policy
   - Extension inherits original policy terms
   - Prorated pricing for remaining period (not full year)
   - Grace period penalties may apply (late fee)
   - Original policy number preserved with extension suffix (e.g., POL-2025-123456-EXT1)

5. **Renewed** → **New Active Policy** (Separate lifecycle)
   - Renewal generates completely new policy with new policy number
   - New 12-month coverage period
   - Updated premium based on current rates
   - Link to previous policy for history tracking

**Business Rules:**

- **Renewal Window**: 90 days before expiry (agents can initiate early renewal)
- **Extension Window**: 
  - Third-Party: 90 days post-expiry
  - TOR: 60 days post-expiry
  - Comprehensive: 0 days (not extendable)
- **Pricing for Renewals**: Always use current year pricing (may differ from original)
- **Pricing for Extensions**: Prorated based on remaining days, plus late fee if applicable
- **Late Fees**: 
  - 0-30 days post-expiry: 5% of prorated premium
  - 31-60 days: 10% of prorated premium
  - 61-90 days: 15% of prorated premium
- **Vehicle Details**: Agent can update during renewal (mileage, modifications, etc.)
- **Client Details**: Must be verified/updated during renewal process
- **Payment Required**: Both renewals and extensions require payment before activation

**UI/UX Patterns:**

- **Upcoming Screen - Renewals Tab**:
  - Show active policies with expiry within 90 days
  - Display days until expiry prominently
  - "Renew Now" CTA button (primary action)
  - Badge showing renewal eligibility (Early Bird, Standard, Urgent <30 days)
  
- **Upcoming Screen - Extensions Tab**:
  - Show expired policies eligible for extension
  - Display days since expiry and remaining grace period
  - "Extend Policy" CTA button (warning color if near grace end)
  - Clear indication of cover type and extension eligibility
  - Warning if grace period ending soon (<7 days)

- **Renewal Flow**:
  1. Agent clicks "Renew Now" on policy card
  2. System prefills Motor 2 form with existing policy data
  3. Agent reviews/updates vehicle and client details
  4. System calculates new premium (current rates)
  5. Agent compares underwriters (if applicable)
  6. Agent proceeds to payment
  7. New policy created on successful payment

- **Extension Flow**:
  1. Agent clicks "Extend Policy" on expired policy card
  2. System shows extension eligibility confirmation
  3. Agent selects extension period (1-12 months, max to grace end)
  4. System calculates prorated premium + late fee
  5. Agent proceeds to payment
  6. Original policy extended with new end date

**Data Model Requirements:**

- **Policy Model Fields**:
  - `status` (draft, active, expired, extended, cancelled)
  - `cover_start` (date)
  - `cover_end` (date)
  - `renewal_due_date` (computed: cover_end - 30 days)
  - `is_renewable` (boolean, computed)
  - `is_extendable` (boolean, based on cover_type)
  - `extension_grace_end` (computed based on cover_type)
  - `parent_policy_id` (reference to renewed/extended policy)
  - `renewal_count` (integer, tracks renewal chain)
  - `extension_count` (integer, tracks extension chain)

- **Quotation/Policy Relationship**:
  - Quote transitions to Policy on payment
  - Policy inherits all quote details
  - Policy gets policy_number assigned
  - Policy tracks lifecycle independently

**API Endpoints Required:**

- `GET /api/motor2/policies/renewals/` - List active policies due for renewal
- `GET /api/motor2/policies/extensions/` - List expired extendable policies
- `POST /api/motor2/policies/{id}/renew/` - Initiate renewal (returns new quote)
- `POST /api/motor2/policies/{id}/extend/` - Initiate extension (returns new quote)
- `GET /api/motor2/policies/{id}/renewal-eligibility/` - Check if policy can be renewed
- `GET /api/motor2/policies/{id}/extension-eligibility/` - Check extension rules

**Notifications & Reminders:**

- **90 days before expiry**: "Early Renewal Available" notification
- **30 days before expiry**: "Policy Renewal Due Soon" reminder
- **7 days before expiry**: "Urgent: Policy Expiring Soon" alert
- **On expiry date**: "Policy Expired - Extension Available" (if eligible)
- **7 days before grace end**: "Extension Grace Period Ending" urgent alert

### 5. **My Account & Agent Management**

- Agent profile with sales agent code and credentials
- Earnings tracking and commission calculations
- Performance analytics and activity tracking
- Sales targets and achievement monitoring

## Design Implementation

- **Brand Colors**: PataBima official colors (#D5222B red, #646767 gray)
- **Typography**: Poppins font family throughout the app
- **Layout**: Scrollable design with card-based UI components
- **UI Style**: Modern cards with rounded corners, shadows, and proper spacing
- **Interactive Elements**: Horizontal sliders, pill toggles, search functionality
- **Navigation**: Bottom tab navigation with proper padding to avoid device navigation overlap

## Development Guidelines

### Core Principles

- Use functional components with React hooks for all new components
- Follow React Native best practices for performance and user experience
- Implement responsive design for different screen sizes and orientations
- Use TypeScript for better code quality, maintainability, and type safety
- Follow Expo development workflow and best practices
- Structure components in a modular, reusable way
- Implement proper error handling and loading states throughout the app
- Use proper navigation patterns and deep linking support

### Motor Insurance Development Guidelines

- **Dynamic Forms**: Create reusable form components that adapt based on product requirements
- **Real-time Calculations**: Implement debounced premium calculations as users input data
- **State Management**: Use Context API with reducers for complex motor insurance flows
- **Validation**: Implement progressive validation with clear error messaging
- **Caching**: Cache pricing data and underwriter information for better performance
- **Offline Support**: Handle offline scenarios gracefully with data persistence

### API Integration Guidelines

- **Centralized Service**: Use DjangoAPIService singleton for all API communications
- **Error Handling**: Implement consistent error handling across all API calls
- **Loading States**: Show appropriate loading indicators during API requests
- **Data Transformation**: Transform API responses to match frontend requirements
- **Retry Logic**: Implement automatic retry for failed requests where appropriate

## Code Structure

- `/src/components` - Reusable UI components
- `/src/screens` - Screen components for each tab/page
- `/src/navigation` - Navigation configuration
- `/src/services` - API calls and business logic
- `/src/utils` - Helper functions and utilities
- `/src/constants` - App constants and configurations
- `/src/types` - TypeScript type definitions
- `/src/contexts` - React Context providers for state management
- `/src/hooks` - Custom React hooks
- `/assets` - Images, fonts, and other static resources

## Styling Guidelines

- Use StyleSheet.create() for component styles
- Implement consistent color scheme using PataBima brand colors
- Use Poppins font family throughout the app
- Use flexbox for layouts with proper spacing
- Follow material design principles for Android and iOS guidelines
- Ensure accessibility compliance with proper contrast ratios
- Implement responsive design for different screen densities
- Use consistent padding and margins based on design system

## Database Schema Guidelines

- **Motor Insurance Products**: Structured table with category, subcategory, pricing model
- **Pricing Tables**: Separate tables for bracket-based, tonnage-based, and fixed pricing
- **Mandatory Levies**: Standardized calculation across all products (ITL, PCF, Stamp Duty)
- **Underwriter Management**: Support for multiple underwriters with product-specific pricing
- **Policy Management**: Comprehensive policy lifecycle tracking with renewals and claims

## Performance Guidelines

- **Lazy Loading**: Implement lazy loading for screens and components
- **Image Optimization**: Use optimized image formats and proper caching
- **API Optimization**: Implement request caching and background sync
- **Memory Management**: Proper cleanup of subscriptions and listeners
- **Bundle Size**: Monitor and optimize bundle size for faster app startup

## AWS Integration Notes

- Use AWS S3 for document storage and policy document management
- Implement AWS Textract for document processing and data extraction
- Use AWS hosting services for the insurance-app backend deployment

## Security Guidelines

- Implement secure authentication with JWT tokens
- Use HTTPS for all API communications
- Validate all user inputs on both frontend and backend
- Implement proper session management
- Use secure storage for sensitive data
- Follow OWASP mobile security guidelines

## Testing Guidelines

- Write unit tests for critical business logic
- Implement integration tests for API endpoints
- Use React Native Testing Library for component tests
- Test premium calculations with various scenarios
- Validate form submissions and error handling
- Test offline functionality and data synchronization

## Deployment Guidelines

- Use EAS Build for production builds
- Implement proper CI/CD pipeline
- Test on multiple devices and OS versions
- Monitor app performance and crash reports
- Implement proper versioning and rollback strategies
- Follow app store guidelines for iOS and Android

# PataBima App - Copilot Instructions

Act as a senior full-stack developer expert in React Native, Django, and AWS.
Give direct, production-level explanations with flawless codes and best pattern.

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

PataBima is a comprehensive React Native Expo application for insurance sales agents in Kenya. The app enables agents to generate quotations, compare underwriter pricing, process payments, and manage policies across multiple insurance categories with sophisticated pricing calculations. The system handles 60+ motor insurance products with real-time premium calculations, mandatory regulatory levies, and dynamic form generation.

## Technology Stack

- **Frontend**: React Native 0.79.6 with Expo SDK 53.0.23 (STABLE - Do NOT upgrade to SDK 54 without approval)
- **React**: 19.0.0
- **Navigation**: React Navigation v7 (Bottom Tabs + Native Stack)
- **Backend**: Django REST API with PostgreSQL database
- **State Management**: React Context API with reducers for complex state
- **UI Components**: React Native built-in components with custom styling
- **API Communication**: Centralized service layer with DjangoAPIService
- **Payment Integration**: M-PESA, DPO Pay, and other Kenya payment gateways
- **Real-time Calculations**: Dynamic premium calculation engine
- **Data Validation**: Form validation with TypeScript interfaces
- **Caching**: Two-tier cache (Memory Map + AsyncStorage) with TTL

### SDK Version Policy

**IMPORTANT**: This project uses **Expo SDK 53.0.23** and should remain on this version for stability. SDK 54 upgrade requires:

- Full regression testing of 60+ motor insurance products
- Revalidation of custom React Native patches (FlatList.js, ScrollView.js)
- Payment flow testing (M-PESA, DPO Pay)
- Approval from lead developer and product owner

See `SDK_COMPARISON_ANALYSIS.md` for detailed upgrade analysis. Next SDK review: Q1 2026.

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

## How The System Actually Works: Complete Technical Walkthrough

### Architecture Overview

PataBima follows a **service-oriented architecture** with clear separation between:

- **Presentation Layer**: React Native components and screens
- **State Management Layer**: Context API providers with reducers
- **Service Layer**: Centralized API clients and business logic
- **Caching Layer**: Two-tier cache (memory + AsyncStorage) with TTL
- **Backend Layer**: Django REST API with PostgreSQL

### Complete Request Flow: User Action → Backend → Response → UI Update

#### Example: Agent Creates Third-Party Motor Insurance Quote

**STEP 1: User Opens Motor Insurance Flow**

```
User Action: Taps "Motor Insurance" card on Dashboard
↓
Frontend Navigation:
  - App.js → Bottom Tab Navigator → QuotationsStack
  - QuotationsStack → MotorInsuranceContainer.js
↓
Component Mount:
  - MotorInsuranceContainer wraps entire flow
  - MotorInsuranceProvider (Context) initializes state
  - CategorySelectionStep.js renders (Step 1 of 8)
```

**STEP 2: Load Motor Categories from Backend**

```
Component Effect:
  CategorySelectionStep.js → useEffect() on mount
  ↓
Service Call:
  motorPricingService.getCategories()
  ↓
Cache Check (Two-Tier):
  SimpleCache.get('MOTOR_CATEGORIES')
  → Check MEMORY Map first (instant)
  → If miss, check AsyncStorage (persistent)
  → If miss, proceed to API call
  ↓
API Request (if cache miss):
  DjangoAPIService.makeRequest('/api/motor2/categories/')
  ↓
Django Backend Processing:
  1. URL Router: urls.py → MotorCategoryViewSet
  2. View: views.py → list() method
  3. Database Query: MotorCategory.objects.filter(is_active=True)
  4. Serialization: MotorCategorySerializer.serialize(queryset)
  5. Response: JSON with 6 categories (PRIVATE, COMMERCIAL, PSV, etc.)
  ↓
Response Journey Back:
  Django → DjangoAPIService → motorPricingService
  ↓
Cache Write:
  SimpleCache.set('MOTOR_CATEGORIES', response, 7_DAYS_TTL)
  → Write to MEMORY Map (instant access)
  → Write to AsyncStorage (persistent)
  ↓
State Update:
  motorPricingService returns data
  → CategorySelectionStep setState(categories)
  → React re-renders UI with category cards
  ↓
UI Display:
  6 category cards render (Private, Commercial, PSV, Motorcycle, TukTuk, Special)
  User sees: "🚗 Private", "🚚 Commercial", etc.
```

**STEP 3: User Selects "Private" Category**

```
User Action: Taps "Private" card
↓
Event Handler:
  onCategorySelect('PRIVATE')
  ↓
Service Call:
  motorPricingService.getSubcategoriesByCategory('PRIVATE')
  ↓
API Request:
  DjangoAPIService.makeRequest('/api/motor2/subcategories/?category=PRIVATE')
  ↓
Django Backend:
  1. MotorSubcategoryViewSet.list(category='PRIVATE')
  2. Query: MotorSubcategory.objects.filter(category='PRIVATE', is_active=True)
  3. Returns: [
       {subcategory_code: 'PRIVATE_THIRD_PARTY', pricing_model: 'FIXED', ...},
       {subcategory_code: 'PRIVATE_COMPREHENSIVE', pricing_model: 'BRACKET', ...},
       {subcategory_code: 'PRIVATE_TOR', pricing_model: 'FIXED', ...}
     ]
  ↓
Context State Update:
  MotorInsuranceContext.dispatch({
    type: 'SET_CATEGORY_SELECTION',
    payload: { category: 'PRIVATE', subcategories: [...] }
  })
  ↓
Navigation:
  Subcategory selection modal/screen appears
  User sees: "Third Party", "Comprehensive", "Time on Risk"
```

**STEP 4: User Selects "Third Party" Subcategory**

```
User Action: Taps "Third Party" option
↓
Context Update:
  dispatch({
    type: 'SET_SUBCATEGORY',
    payload: {
      subcategory_code: 'PRIVATE_THIRD_PARTY',
      pricing_model: 'FIXED',
      coverage_type: 'THIRD_PARTY'
    }
  })
  ↓
Navigation:
  MotorContainer navigates to PolicyDetailsStep (Step 3)
  PolicyDetailsStep.js mounts
  ↓
Component Renders:
  <DynamicVehicleForm
    selectedProduct={PRIVATE_THIRD_PARTY}
    onUnderwriterSelection={handleUnderwriterSelection}
  />
```

**STEP 5: DynamicVehicleForm Auto-Loads Underwriters (Third Party)**

```
Component Mount Effect:
  DynamicVehicleForm.js → useEffect() detects Third Party
  ↓
Pricing Check:
  isPricingDependent('THIRD_PARTY') → returns FALSE
  (Third Party has fixed pricing, doesn't depend on vehicle details)
  ↓
Auto-Load Trigger:
  triggerUnderwriterComparison() called immediately
  ↓
Service Call:
  motorPricingService.compareUnderwritersBySubcategory(
    'PRIVATE_THIRD_PARTY',
    { cover_start_date: '2025-11-06' }
  )
  ↓
Cache Check:
  cacheKey = makeKey(['UW_SUBCAT', 'PRIVATE_THIRD_PARTY', 0, 0, 0])
  SimpleCache.get(cacheKey) → Check memory + AsyncStorage (12h TTL)
  ↓
API Request (if cache miss):
  DjangoAPIService.makeRequest('/api/motor2/pricing/compare-by-subcategory/', {
    subcategory_code: 'PRIVATE_THIRD_PARTY',
    cover_start_date: '2025-11-06'
  })
  ↓
Django Backend Processing:
  1. UnderwriterComparisonView.compare_by_subcategory()
  2. Query: UnderwriterProduct.objects.filter(
       subcategory='PRIVATE_THIRD_PARTY',
       is_active=True
     )
  3. For each underwriter (Madison, PATABIMA, Jubilee, UAP, APA, Britam, CIC):
     - Get base_premium from pricing table
     - Third Party fixed: KSh 2,975 (Madison/PATABIMA/Jubilee) or 3,500 (UAP/APA) or 3,920 (Britam/CIC)
  4. Return: [
       {underwriter_code: 'MADISON', base_premium: 2975, ...},
       {underwriter_code: 'PTA', base_premium: 2975, ...},
       // ... 5 more underwriters
     ]
  ↓
Frontend Enhancement (Apply Mandatory Levies):
  For each comparison:
    base_premium = 2975
    itl = 2975 * 0.0025 = 7.44 (Insurance Training Levy)
    pcf = 2975 * 0.0025 = 7.44 (Policyholders Compensation Fund)
    stamp_duty = 40 (Fixed)
    total_premium = 2975 + 7.44 + 7.44 + 40 = 3029.88
  ↓
Sort by Price:
  comparisons.sort((a, b) => a.total_premium - b.total_premium)
  Result: Madison (3029.88), PATABIMA (3029.88), Jubilee (3029.88), UAP (3557.50), ...
  ↓
Cache Write:
  SimpleCache.set(cacheKey, enhancedComparisons, 12_HOURS_TTL)
  ↓
State Update:
  setUnderwriterComparisons(enhancedComparisons)
  hasComparisonsRef.current = true
  lastComparisonsRef.current = enhancedComparisons
  ↓
UI Rendering (FlatList with Memoization):
  <FlatList
    data={enhancedComparisons}
    renderItem={({ item }) => <UnderwriterCard comparison={item} />}
    keyExtractor={(item) => item.id}
  />
  ↓
User Sees:
  7 underwriter cards displaying:
  - Madison Insurance: KSh 3,029.88
  - PATABIMA INC: KSh 3,029.88
  - (with breakdown showing base, ITL, PCF, stamp duty)
```

**STEP 6: User Selects Madison Insurance**

```
User Action: Taps Madison Insurance card
↓
Touch Handler (with requestAnimationFrame for smooth UI):
  onPress={() => {
    underwriterSelectedRef.current = true; // Immediate flag (no re-render)

    requestAnimationFrame(() => {
      setSelectedUnderwriter(madisonData);
      handleInputChange('underwriter', 'Madison Insurance');
      onUnderwriterSelection(madisonData); // Callback to parent
    });
  }}
  ↓
Ref Update (Instant):
  underwriterSelectedRef.current = true
  → Prevents further auto-comparisons
  → Prevents infinite loops
  ↓
State Update (Next Frame):
  selectedUnderwriter = {
    id: 'aa85d49e-06a2-40ec-9a22-e09b453f8066',
    name: 'Madison Insurance',
    code: 'MADISON',
    total_premium: 3029.88,
    base_premium: 2975,
    breakdown: { itl: 7.44, pcf: 7.44, stamp_duty: 40 }
  }
  ↓
Context Update (via callback):
  PolicyDetailsStep.handleUnderwriterSelection(madisonData)
  ↓
  MotorInsuranceContext.dispatch({
    type: 'UPDATE_VEHICLE_DETAILS',
    payload: {
      underwriter: 'Madison Insurance',
      selectedUnderwriter: madisonData // Full object
    }
  })
  ↓
UI Update:
  UnderwriterCard re-renders with selected styling
  Checkmark (✓) appears on Madison card
  Other cards remain unselected
```

**STEP 7: User Fills Vehicle Details & Proceeds**

```
User Actions:
  1. Selects "Vehicle Registration" type
  2. Enters "KDA 123A" in registration field
  3. Selects cover start date: "11/12/2025"
  ↓
Form Handling (Debounced):
  handleInputChange('registrationNumber', 'KDA 123A')
  → Updates formData state
  → Debounced notification (400ms delay) to parent
  → lastNotifiedDataRef prevents duplicate notifications
  ↓
Parent Notification (After Debounce):
  onDataChange({
    registrationNumber: 'KDA 123A',
    cover_start_date: '2025-11-12',
    identificationType: 'Vehicle Registration',
    financialInterest: 'Yes'
    // underwriter excluded (handled separately)
  })
  ↓
Context Merge:
  MotorInsuranceContext merges vehicle data
  Preserves selectedUnderwriter object
  ↓
User Taps "Next":
  Validation runs:
    - Check required fields present
    - Check underwriter selected (Madison ✓)
    - All valid → proceed
  ↓
Navigation:
  MotorContainer.nextStep()
  → Navigate to KYCStep (Step 4)
```

**STEP 8: Complete Flow Through Remaining Steps**

```
KYC Step (4):
  User uploads ID documents
  → AWS S3 upload via presigned URLs
  → Textract OCR extracts data
  → Auto-fills client details
  ↓
Document Upload Step (5):
  User uploads logbook/receipt
  → S3 upload
  → DMVIC integration checks vehicle details
  ↓
Client Details Step (6):
  User confirms/edits:
    - ID Number
    - Phone Number
    - Email
    - Physical Address
  → Context updates client details
  ↓
Payment Step (7):
  Display summary:
    - Madison Insurance
    - KSh 3,029.88
    - Vehicle: KDA 123A
  ↓
  User selects M-PESA payment
  → Backend creates payment intent
  → M-PESA STK Push sent to phone
  → User enters PIN on phone
  → Backend receives callback
  → Payment confirmed
  ↓
Final Submission Step (8):
  Context contains complete data:
    {
      category: 'PRIVATE',
      subcategory: 'PRIVATE_THIRD_PARTY',
      vehicleDetails: { registration: 'KDA 123A', ... },
      selectedUnderwriter: { name: 'Madison Insurance', code: 'MADISON', ... },
      clientDetails: { id_number: '12345678', ... },
      paymentDetails: { method: 'MPESA', transaction_id: 'ABC123', ... }
    }
  ↓
  Submission Service Call:
    motorQuotationService.submitQuote(completeData)
    ↓
  API Request:
    POST /api/motor2/quotations/
    Body: { ...completeData }
    ↓
  Django Backend Processing:
    1. QuotationViewSet.create()
    2. Validate all required fields
    3. Create database records:
       - Quotation (quote_number, status='DRAFT')
       - QuotationVehicle (registration, ...)
       - QuotationClient (id_number, ...)
       - QuotationUnderwriter (Madison Insurance)
       - QuotationPayment (transaction_id, amount)
    4. Update quotation status to 'PENDING_PAYMENT'
    5. Trigger policy generation if payment confirmed
    6. Generate PDF quote document
    7. Return: {
         quote_number: 'QT-2025-001234',
         status: 'ACTIVE',
         policy_number: 'POL-2025-001234', // If payment confirmed
         pdf_url: 'https://s3.../quote_POL-2025-001234.pdf'
       }
    ↓
  Frontend Success:
    - Navigate to SuccessScreen
    - Display quote number
    - Show download PDF button
    - Send email/SMS to client
    - Update quotations list in context
```

### Backend Architecture Deep Dive

#### Django Project Structure

```
insurance-app/
├── manage.py
├── insurance-app/
│   ├── settings.py          # Django settings, DB config
│   ├── urls.py              # Root URL router
│   └── wsgi.py              # WSGI entry point
├── app/                     # Main application
│   ├── models/              # Database models
│   │   ├── motor.py         # MotorCategory, MotorSubcategory, MotorProduct
│   │   ├── underwriter.py   # Underwriter, UnderwriterProduct, Pricing
│   │   ├── quotation.py     # Quotation, QuotationVehicle, QuotationClient
│   │   └── policy.py        # Policy, PolicyRenewal, PolicyExtension
│   ├── serializers/         # DRF serializers (model → JSON)
│   ├── views/               # API view logic
│   │   ├── motor_views.py   # Category/subcategory endpoints
│   │   ├── pricing_views.py # Underwriter comparison logic
│   │   └── quotation_views.py # Quote CRUD operations
│   ├── services/            # Business logic
│   │   ├── pricing_engine.py    # Calculate premiums
│   │   ├── dmvic_service.py     # Vehicle verification
│   │   └── payment_service.py   # M-PESA integration
│   ├── urls.py              # App URL routes
│   └── migrations/          # Database migrations
└── requirements.txt
```

#### Request Handling Flow in Django

**Example: GET /api/motor2/categories/**

```
1. Request arrives at Django:
   URL: http://10.0.2.2:8000/api/motor2/categories/
   Method: GET
   Headers: { Authorization: 'Bearer eyJ...' }

2. URL Routing (insurance-app/urls.py):
   urlpatterns = [
     path('api/', include('app.urls')),
   ]
   → Routes to app/urls.py

3. App URL Routing (app/urls.py):
   router = DefaultRouter()
   router.register(r'motor2/categories', MotorCategoryViewSet)
   → Routes to MotorCategoryViewSet

4. ViewSet (app/views/motor_views.py):
   class MotorCategoryViewSet(viewsets.ReadOnlyModelViewSet):
       queryset = MotorCategory.objects.filter(is_active=True)
       serializer_class = MotorCategorySerializer
       permission_classes = [IsAuthenticated]

       def list(self, request):
           # 1. Check authentication (JWT token)
           # 2. Query database
           categories = self.get_queryset().order_by('sort_order')

           # 3. Serialize to JSON
           serializer = self.get_serializer(categories, many=True)

           # 4. Return response
           return Response({
               'categories': serializer.data,
               'total_count': categories.count()
           })

5. Database Query (PostgreSQL):
   SELECT * FROM app_motorcategory
   WHERE is_active = TRUE
   ORDER BY sort_order;

   Returns:
   - PRIVATE (sort_order=1)
   - COMMERCIAL (sort_order=2)
   - PSV (sort_order=3)
   - MOTORCYCLE (sort_order=4)
   - TUKTUK (sort_order=5)
   - SPECIAL (sort_order=6)

6. Serialization (app/serializers/motor_serializers.py):
   class MotorCategorySerializer(serializers.ModelSerializer):
       class Meta:
           model = MotorCategory
           fields = [
               'id', 'code', 'name', 'description', 'icon',
               'field_requirements', 'is_active', 'sort_order'
           ]

   Converts model instances to JSON:
   {
     "id": "02a099fd-e88b-4b61-8f64-0e3eb7ee173f",
     "code": "PRIVATE",
     "name": "Private",
     "description": "Personal vehicles for private use",
     "icon": "🚗",
     "field_requirements": {
       "core_fields": ["registration", "cover_date"]
     },
     "is_active": true,
     "sort_order": 1
   }

7. Response Journey:
   ViewSet → Django Middleware → WSGI Server → Network → React Native App
```

#### Complex Backend Operation: Underwriter Price Comparison

**POST /api/motor2/pricing/compare-by-subcategory/**

```
Request Body:
{
  "subcategory_code": "PRIVATE_THIRD_PARTY",
  "cover_start_date": "2025-11-06",
  "sum_insured": null,  // Not needed for Third Party
  "tonnage": null,
  "capacity": null
}

Django Processing Flow:

1. View Entry (app/views/pricing_views.py):
   class UnderwriterComparisonView(APIView):
       def post(self, request):
           subcategory_code = request.data['subcategory_code']
           cover_date = request.data['cover_start_date']

           # Call pricing engine service
           comparisons = PricingEngine.compare_underwriters(
               subcategory_code,
               request.data
           )

           return Response({'comparisons': comparisons})

2. Pricing Engine Service (app/services/pricing_engine.py):
   class PricingEngine:
       @staticmethod
       def compare_underwriters(subcategory_code, form_data):
           # Step 1: Get subcategory details
           subcategory = MotorSubcategory.objects.get(
               subcategory_code=subcategory_code
           )

           # Step 2: Find all active underwriter products
           underwriter_products = UnderwriterProduct.objects.filter(
               subcategory=subcategory,
               is_active=True,
               underwriter__is_active=True
           ).select_related('underwriter', 'pricing')

           # Step 3: Calculate price for each underwriter
           results = []
           for uw_product in underwriter_products:
               premium = PricingEngine._calculate_premium(
                   uw_product,
                   subcategory.pricing_model,
                   form_data
               )

               results.append({
                   'underwriter_code': uw_product.underwriter.code,
                   'underwriter_name': uw_product.underwriter.name,
                   'result': {
                       'base_premium': premium,
                       'pricing_model': subcategory.pricing_model
                   }
               })

           return results

3. Premium Calculation Logic:
   @staticmethod
   def _calculate_premium(uw_product, pricing_model, form_data):
       if pricing_model == 'FIXED':
           # Third Party / TOR
           pricing = uw_product.pricing  # ForeignKey to PricingTable
           return pricing.fixed_premium  # e.g., 2975

       elif pricing_model == 'BRACKET':
           # Comprehensive - sum insured brackets
           sum_insured = form_data.get('sum_insured', 0)
           bracket = PricingBracket.objects.filter(
               pricing=uw_product.pricing,
               min_value__lte=sum_insured,
               max_value__gte=sum_insured
           ).first()

           if bracket:
               # Calculate percentage or fixed
               if bracket.rate_type == 'PERCENTAGE':
                   return sum_insured * (bracket.rate / 100)
               else:
                   return bracket.rate

       elif pricing_model == 'TONNAGE':
           # Commercial - tonnage scale
           tonnage = form_data.get('tonnage', 0)
           scale = TonnageScale.objects.filter(
               pricing=uw_product.pricing,
               min_tons__lte=tonnage,
               max_tons__gte=tonnage
           ).first()

           return scale.premium if scale else 0

4. Database Queries Executed:
   -- Get subcategory
   SELECT * FROM app_motorsubcategory
   WHERE subcategory_code = 'PRIVATE_THIRD_PARTY';

   -- Get all underwriter products with pricing
   SELECT
     uw_product.id,
     uw.code AS underwriter_code,
     uw.name AS underwriter_name,
     pricing.fixed_premium
   FROM app_underwriterproduct uw_product
   JOIN app_underwriter uw ON uw_product.underwriter_id = uw.id
   JOIN app_pricingtable pricing ON uw_product.pricing_id = pricing.id
   WHERE uw_product.subcategory_id = '...'
     AND uw_product.is_active = TRUE
     AND uw.is_active = TRUE;

   Results:
   - Madison: 2975
   - PATABIMA: 2975
   - Jubilee: 2975
   - UAP: 3500
   - APA: 3500
   - Britam: 3920
   - CIC: 3920

5. Response Formation:
   {
     "comparisons": [
       {
         "underwriter_code": "MADISON",
         "underwriter_name": "Madison Insurance",
         "result": {
           "base_premium": 2975,
           "pricing_model": "FIXED"
         }
       },
       // ... 6 more
     ]
   }

6. Return to Frontend:
   Django → Network → DjangoAPIService → motorPricingService
   → Frontend applies levies → Displays to user
```

### State Management Implementation

The app uses **React Context API with reducers** for complex state management (not Redux). Key patterns:

#### Motor Insurance Context Pattern - Complete Lifecycle

**Context File Structure:**

```javascript
// frontend/contexts/MotorInsuranceContext.js

// 1. INITIAL STATE DEFINITION
const initialState = {
  // Category Selection (Step 1-2)
  selectedCategory: null, // e.g., { code: 'PRIVATE', name: 'Private', ... }
  selectedSubcategory: null, // e.g., { code: 'PRIVATE_THIRD_PARTY', ... }

  // Form Data (Step 3-6)
  vehicleDetails: {}, // { registration: 'KDA 123A', cover_start_date: '2025-11-06', ... }
  pricingInputs: {}, // { sum_insured: 500000, tonnage: 5, ... }
  subcategoryFormData: {}, // Isolated storage: { 'PRIVATE_THIRD_PARTY': {...}, 'PRIVATE_COMPREHENSIVE': {...} }

  // Underwriter Selection
  availableUnderwriters: [], // List of all active underwriters
  pricingComparison: [], // Comparison results from backend
  selectedUnderwriter: null, // { name: 'Madison', code: 'MADISON', total_premium: 3029.88 }
  calculatedPremium: null, // Current premium calculation

  // Client & Payment
  clientDetails: {}, // { id_number: '12345678', phone: '0712345678', ... }
  kycDocuments: [], // Uploaded ID, passport, etc.
  uploadedDocuments: [], // Logbook, receipt, etc.
  paymentDetails: null, // { method: 'MPESA', transaction_id: 'ABC123', ... }

  // Flow Control
  currentStep: 0, // 0-7 (8 steps total)
  completedSteps: [], // [0, 1, 2] - tracks which steps are done
  validationErrors: {}, // { registrationNumber: 'Required field', ... }

  // Add-ons & Options
  selectedAddons: [], // Optional coverages selected

  // History for undo/redo
  past: [], // Previous states for undo
  future: [], // Forward states for redo
};

// 2. REDUCER FUNCTION - Handles All State Updates
function motorInsuranceReducer(state, action) {
  switch (action.type) {
    // Category/Subcategory Selection
    case "SET_CATEGORY_SELECTION":
      // When user selects a category, save current form data before switching
      const currentFormKey = state.selectedSubcategory?.subcategory_code;
      const updatedSubcategoryData = currentFormKey
        ? {
            ...state.subcategoryFormData,
            [currentFormKey]: state.vehicleDetails, // Save current data
          }
        : state.subcategoryFormData;

      return saveForHistory(state, {
        ...state,
        selectedCategory: action.payload.category,
        selectedSubcategory: action.payload.subcategory,
        subcategoryFormData: updatedSubcategoryData,
        // Restore saved data for new subcategory (if exists)
        vehicleDetails:
          updatedSubcategoryData[
            action.payload.subcategory?.subcategory_code
          ] || {},
        currentStep: 2, // Move to Policy Details step
      });

    // Vehicle Details Update
    case "UPDATE_VEHICLE_DETAILS":
      // Critical: Preserve selectedUnderwriter as full object, not just string
      const newDetails = action.payload;

      // If underwriter is coming as string but we have an object, preserve object
      const preservedUnderwriter =
        typeof newDetails.underwriter === "string" && state.selectedUnderwriter
          ? state.selectedUnderwriter
          : newDetails.selectedUnderwriter || newDetails.underwriter;

      return {
        ...state,
        vehicleDetails: {
          ...state.vehicleDetails,
          ...newDetails,
          selectedUnderwriter: preservedUnderwriter, // Always preserve object
        },
        selectedUnderwriter: preservedUnderwriter,
      };

    // Underwriter Selection (from comparison)
    case "SELECT_UNDERWRITER":
      return {
        ...state,
        selectedUnderwriter: action.payload, // Full object with pricing
        vehicleDetails: {
          ...state.vehicleDetails,
          underwriter: action.payload.name,
          selectedUnderwriter: action.payload,
        },
        calculatedPremium: action.payload.total_premium,
      };

    // Client Details
    case "UPDATE_CLIENT_DETAILS":
      return {
        ...state,
        clientDetails: {
          ...state.clientDetails,
          ...action.payload,
        },
      };

    // Document Upload
    case "ADD_KYC_DOCUMENT":
      return {
        ...state,
        kycDocuments: [...state.kycDocuments, action.payload],
      };

    case "ADD_UPLOADED_DOCUMENT":
      return {
        ...state,
        uploadedDocuments: [...state.uploadedDocuments, action.payload],
      };

    // Payment
    case "SET_PAYMENT_DETAILS":
      return {
        ...state,
        paymentDetails: action.payload,
      };

    // Step Navigation
    case "SET_CURRENT_STEP":
      const newStep = action.payload;
      const isCompleted = newStep > state.currentStep;

      return {
        ...state,
        currentStep: newStep,
        completedSteps: isCompleted
          ? [...new Set([...state.completedSteps, state.currentStep])]
          : state.completedSteps,
      };

    // Validation
    case "SET_VALIDATION_ERRORS":
      return {
        ...state,
        validationErrors: action.payload,
      };

    // Reset Flow
    case "RESET_FLOW":
      return initialState;

    default:
      return state;
  }
}

// 3. CONTEXT PROVIDER - Wraps the App
export const MotorInsuranceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(motorInsuranceReducer, initialState);

  // Memoized action creators (prevent re-renders)
  const actions = useMemo(
    () => ({
      setCategorySelection: useCallback((category, subcategory) => {
        dispatch({
          type: "SET_CATEGORY_SELECTION",
          payload: { category, subcategory },
        });
      }, []),

      updateVehicleDetails: useCallback((details) => {
        dispatch({
          type: "UPDATE_VEHICLE_DETAILS",
          payload: details,
        });
      }, []),

      selectUnderwriter: useCallback((underwriter) => {
        dispatch({
          type: "SELECT_UNDERWRITER",
          payload: underwriter,
        });
      }, []),

      updateClientDetails: useCallback((details) => {
        dispatch({
          type: "UPDATE_CLIENT_DETAILS",
          payload: details,
        });
      }, []),

      setCurrentStep: useCallback((step) => {
        dispatch({
          type: "SET_CURRENT_STEP",
          payload: step,
        });
      }, []),

      resetFlow: useCallback(() => {
        dispatch({ type: "RESET_FLOW" });
      }, []),
    }),
    []
  );

  // Context value combines state and actions
  const value = useMemo(
    () => ({
      ...state,
      ...actions,
    }),
    [state, actions]
  );

  return (
    <MotorInsuranceContext.Provider value={value}>
      {children}
    </MotorInsuranceContext.Provider>
  );
};

// 4. USAGE IN COMPONENTS
function PolicyDetailsStep() {
  const {
    selectedSubcategory,
    vehicleDetails,
    selectedUnderwriter,
    updateVehicleDetails,
    selectUnderwriter,
  } = useMotorInsurance(); // Custom hook

  const handleUnderwriterSelection = (underwriter) => {
    console.log("[PolicyDetails] Underwriter selected:", underwriter.name);

    // Update context with full object
    selectUnderwriter(underwriter);

    // Also update vehicle details (dual write for compatibility)
    updateVehicleDetails({
      underwriter: underwriter.name,
      selectedUnderwriter: underwriter,
    });
  };

  return (
    <DynamicVehicleForm
      selectedProduct={selectedSubcategory}
      initialData={vehicleDetails}
      onUnderwriterSelection={handleUnderwriterSelection}
      onDataChange={updateVehicleDetails}
    />
  );
}
```

**Critical Implementation Details:**

1. **Per-subcategory Form Data Isolation**:

   - When user switches between Third Party ↔ Comprehensive, their form data is saved
   - Prevents data bleeding between different insurance types
   - Each subcategory gets its own isolated storage in `subcategoryFormData`

2. **History Management** (Undo/Redo):

   - Uses `past` and `future` arrays for navigation history
   - `saveForHistory()` helper pushes current state to past before update
   - Enables undo/redo functionality for complex flows

3. **Memoized Actions**:

   - All action creators wrapped in `useCallback`
   - Prevents unnecessary re-renders when passed as props
   - Actions don't change identity between renders

4. **Refs for Performance-Critical Flags**:
   - `underwriterSelectedRef`, `hasComparisonsRef` in components
   - Use `useRef` instead of `useState` for flags that trigger logic but don't need to cause re-renders
   - Prevents infinite loops in effects

### API Client Architecture

#### DjangoAPIService Singleton Pattern

```javascript
// frontend/services/DjangoAPIService.js
class DjangoAPIService {
  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.token = null;
    this.refreshToken = null;
    this._authLocked = false; // Freeze calls on auth failure
    this._inflight = new Map(); // Deduplicate identical requests
    this._queuedRequests = []; // Queue during token refresh
  }

  async makeRequest(endpoint, options = {}) {
    // 1. Check auth lock
    if (this._authLocked && !options._allowWhenLocked) {
      throw new Error("Authentication locked");
    }

    // 2. Auto-load token from storage if missing
    if (!this.token && !this._authLocked) {
      const token = await SecureTokenStorage.getAccessToken();
      if (token) this.token = token;
    }

    // 3. Build request with auth header
    const headers = {
      "Content-Type": "application/json",
      Authorization: this.token ? `Bearer ${this.token}` : undefined,
    };

    // 4. Network-aware retry (try alternative hosts on failure)
    try {
      const response = await fetch(url, { method, headers, body });

      // 5. Handle 401 with token refresh
      if (response.status === 401) {
        await this.refreshAccessToken();
        return this.makeRequest(endpoint, { ...options, _retry: true });
      }

      return await response.json();
    } catch (error) {
      // 6. Auto-switch between localhost/emulator/LAN on network errors
      if (retryCount === 0) {
        const nextBase = this.findAlternativeHost();
        if (nextBase) {
          this.updateBaseUrl(nextBase);
          return this.makeRequest(endpoint, { ...options, _retryCount: 1 });
        }
      }
      throw error;
    }
  }

  async tryEndpoints(endpoints, options) {
    // Resilient endpoint probing - tries multiple candidates
    for (const ep of endpoints) {
      try {
        return await this.makeRequest(ep, {
          ...options,
          _suppressErrorLog: true,
        });
      } catch (e) {
        if (e.message.includes("401") && options._breakOn401) throw e;
        continue; // Try next candidate
      }
    }
    throw new Error("No candidate endpoints succeeded");
  }
}
```

**Key Patterns:**

- **Singleton instance**: One global service shared across app
- **Auto token management**: Loads token from storage, auto-refreshes on 401
- **Request deduplication**: `_inflight` Map prevents duplicate simultaneous requests
- **Network resilience**: Auto-switches between localhost/emulator/LAN hosts
- **Endpoint discovery**: `tryEndpoints()` probes multiple API versions/paths
- **Auth lock mechanism**: Freezes protected calls after hard auth failure

### Caching Strategy

#### Two-Tier SimpleCache Implementation

```javascript
// frontend/services/SimpleCache.js
const MEMORY = new Map(); // Fast in-memory tier
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24h

async function getCache(key) {
  // 1. Check memory first (fast)
  const mem = MEMORY.get(PREFIX + key);
  if (mem && mem.expiresAt > Date.now()) {
    return mem.value;
  }

  // 2. Check AsyncStorage (persistent)
  const raw = await AsyncStorage.getItem(PREFIX + key);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed.expiresAt > Date.now()) {
      // Repopulate memory cache
      MEMORY.set(PREFIX + key, {
        value: parsed.value,
        expiresAt: parsed.expiresAt,
      });
      return parsed.value;
    }
  }
  return null;
}

async function setCache(key, value, ttlMs = DEFAULT_TTL_MS) {
  const expiresAt = Date.now() + ttlMs;
  const entry = { value, expiresAt };

  // Write to both tiers
  MEMORY.set(PREFIX + key, entry);
  await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
}

function makeKey(parts) {
  // Create stable cache keys from dynamic data
  return parts
    .filter((p) => p != null && p !== "")
    .map(String)
    .join("|");
}
```

**Cache Key Design Pattern:**

```javascript
// Example: Motor pricing comparison cache key
const cacheKey = makeKey([
  "UW_SUBCAT",
  subcategoryCode,
  Math.floor(sumInsured / 50000) * 50000, // Bucket to 50k increments
  tonnage || 0,
  capacity || 0,
]);
```

**TTL Settings by Data Type:**

- Motor categories/subcategories: **7 days** (MotorCategoryCache)
- Pricing comparisons: **12 hours** (pricing changes frequently)
- Underwriter lists: **6 hours** (availability changes)
- User profile: **5 minutes** (AppDataContext)
- Quotations: **2 minutes** (frequent updates)

**Bucketing Strategy:**

- **Sum Insured**: Rounded to nearest 50k to reduce cache misses
- **Tonnage/Capacity**: Exact values (limited range)
- **Dates**: Stored as ISO strings for consistency

### Motor Insurance Pricing Flow

#### Real-time Premium Calculation Pipeline

```javascript
// frontend/services/MotorInsurancePricingService.js

// 1. Transform form inputs to backend format
const payload = transformPricingRequest(coverType, inputs);
// Extracts: category, subcategory, sum_insured, vehicle_year, tonnage, etc.

// 2. Generate cache key with bucketing
const cacheKey = makeKey([
  "UW_SUBCAT",
  subcategoryCode,
  Math.floor(sumInsured / 50000) * 50000,
  tonnage || 0,
  capacity || 0,
]);

// 3. Check cache (12h TTL)
if (!options.forceRefresh) {
  const cached = await SimpleCache.get(cacheKey);
  if (cached) return cached;
}

// 4. Call backend comparison API
const res = await djangoAPI.compareMotorPricing(payload);

// 5. Enhance backend response with computed levies
const enhanced = res.comparisons.map((comp) => {
  const pricing = normalizePricingResponse(comp.result);
  const levies = computeLevies(pricing.base_premium);

  return {
    underwriter_code: comp.underwriter_code,
    underwriter_name: comp.underwriter_name,
    base_premium: pricing.base_premium,
    total_premium: pricing.base_premium + levies.totalLevies,
    breakdown: {
      base: pricing.base_premium,
      itl: levies.itl,
      pcf: levies.pcf,
      stamp_duty: levies.stampDuty,
    },
  };
});

// 6. Sort by price (lowest first)
enhanced.sort((a, b) => a.total_premium - b.total_premium);

// 7. Cache result (12h)
await SimpleCache.set(cacheKey, enhanced, 12 * 60 * 60 * 1000);

return enhanced;
```

#### Levy Calculation (Applied to ALL Products)

```javascript
// frontend/utils/pricingCalculations.js
const LEVY_RATES = {
  ITL: 0.0025, // 0.25% Insurance Training Levy
  PCF: 0.0025, // 0.25% Policyholders Compensation Fund
  STAMP_DUTY: 40, // KSh 40 fixed stamp duty
};

function computeLevies(premium) {
  const itl = round2(premium * LEVY_RATES.ITL);
  const pcf = round2(premium * LEVY_RATES.PCF);
  const stampDuty = LEVY_RATES.STAMP_DUTY;

  return {
    itl,
    pcf,
    stampDuty,
    totalLevies: round2(itl + pcf + stampDuty),
  };
}
```

**Critical Implementation Notes:**

- Levies are **always calculated on frontend** to ensure consistency
- Backend returns `base_premium`, frontend adds levies to get `total_premium`
- `round2()` function ensures 2 decimal precision for currency
- Stamp duty is **fixed KSh 40** regardless of premium amount

### Form Handling Patterns

#### Dynamic Form with Refs-Based State Gating

```javascript
// frontend/screens/Motor 2/VehicleDetails/DynamicVehicleForm.js

const DynamicVehicleForm = ({ selectedProduct, onChange }) => {
  const [formData, setFormData] = useState(initialData);

  // Critical: Use refs to prevent re-render loops
  const underwriterSelectedRef = useRef(false);
  const hasComparisonsRef = useRef(false);
  const comparisonTriggerRef = useRef(null);
  const comparisonTimeoutRef = useRef(null);

  // Debounced auto-comparison (1 second delay)
  const handleFieldChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onChange(newData);

    // Clear existing timeout
    if (comparisonTimeoutRef.current) {
      clearTimeout(comparisonTimeoutRef.current);
    }

    // Only trigger comparison if pricing-critical fields changed
    const comparisonKey = makeComparisonKey(newData);
    if (comparisonKey !== lastComparisonData) {
      comparisonTimeoutRef.current = setTimeout(() => {
        triggerUnderwriterComparison(newData);
      }, 1000); // 1 second debounce
    }
  };

  // Comparison key: only pricing-critical fields
  const makeComparisonKey = (data) => {
    return JSON.stringify({
      sum_insured: data.sum_insured,
      tonnage: data.tonnage,
      capacity: data.passengerCapacity,
      year: data.year,
    });
  };

  // MemoizedTextInput to prevent keyboard dismissal
  const MemoizedTextInput = useMemo(() => {
    return ({ field, label, ...props }) => (
      <TextInput
        value={formData[field] || ""}
        onChangeText={(val) => handleFieldChange(field, val)}
        placeholder={label}
        {...props}
      />
    );
  }, [formData]);

  return (
    <ScrollView>
      {fields.map((field) => (
        <MemoizedTextInput
          key={field.key}
          field={field.key}
          label={field.label}
        />
      ))}
    </ScrollView>
  );
};
```

**Key Patterns:**

- **Refs for flags**: `underwriterSelectedRef`, `hasComparisonsRef` avoid state re-renders
- **Debounced comparison**: 1 second delay before triggering backend call
- **Comparison key design**: Only include pricing-critical fields (not cosmetic fields like color)
- **MemoizedTextInput**: Prevents keyboard dismissal on parent re-renders
- **Field locking**: TOR/Third-Party with logbook data locks fields with `isAutoFilled` flag

### Performance Optimizations

#### Implemented Patterns

1. **Request Deduplication**:

   ```javascript
   // DjangoAPIService._inflight Map
   const key = `${method}:${url}:${bodyHash}`;
   if (this._inflight.has(key)) {
     return this._inflight.get(key); // Return existing promise
   }
   ```

2. **Lazy Loading**:

   - Motor categories loaded on-demand, cached for 7 days
   - Subcategories pre-fetched in background
   - Underwriter lists fetched per category, cached 6h

3. **Memoization**:

   - `useMemo` for expensive computations (premium calculations, vehicle data transformations)
   - `useCallback` for all context actions
   - `React.memo` for list item components

4. **Cache TTL Tuning**:

   - Static data (categories): 7 days
   - Semi-static (underwriters): 6 hours
   - Dynamic (pricing): 12 hours (background refresh)
   - User data: 5 minutes

5. **Bundle Size Optimization**:
   - Conditional imports with `require()` for heavy libraries
   - Lazy screen loading with React Navigation
   - Image optimization with `expo-optimize`

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

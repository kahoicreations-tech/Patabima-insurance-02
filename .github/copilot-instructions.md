# PataBima App - Copilot Instructions

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

## How The System Actually Works

### Architecture Overview

PataBima follows a **service-oriented architecture** with clear separation between:

- **Presentation Layer**: React Native components and screens
- **State Management Layer**: Context API providers with reducers
- **Service Layer**: Centralized API clients and business logic
- **Caching Layer**: Two-tier cache (memory + AsyncStorage) with TTL
- **Backend Layer**: Django REST API with PostgreSQL

### State Management Implementation

The app uses **React Context API with reducers** for complex state management (not Redux). Key patterns:

#### Motor Insurance Context Pattern

```javascript
// frontend/contexts/MotorInsuranceContext.js
const initialState = {
  selectedCategory: null,
  selectedSubcategory: null,
  vehicleDetails: {},
  pricingInputs: {},
  subcategoryFormData: {}, // Per-subcategory isolation
  availableUnderwriters: [],
  pricingComparison: [],
  calculatedPremium: null,
  currentStep: 0,
  selectedAddons: [],
  // History for undo/redo
  past: [],
  future: [],
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_CATEGORY_SELECTION":
      // Save current form data before switching
      // Restore saved data for new subcategory
      return saveForHistory(state, newState);
    case "UPDATE_VEHICLE_DETAILS":
      // Merge updates, preserve selectedUnderwriter object
      return {
        ...state,
        vehicleDetails: { ...state.vehicleDetails, ...action.payload },
      };
    // ... other actions
  }
}
```

**Key Implementation Details:**

- **Per-subcategory form data isolation**: When switching between subcategories, form data is saved and restored to prevent data bleeding
- **History management**: Uses `past` and `future` arrays for undo/redo functionality
- **Memoized actions**: All action functions use `useCallback` to prevent unnecessary re-renders
- **Refs for performance**: Critical flags use `useRef` instead of state to avoid triggering re-renders (e.g., `underwriterSelectedRef`, `hasComparisonsRef`)

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

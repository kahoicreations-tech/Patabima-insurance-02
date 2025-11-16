# PataBima Frontend Architecture - Development Guide

## Overview
This document explains how the PataBima insurance application frontend was architected, the reasoning behind folder structures, and step-by-step implementation approaches for building a modern React Native insurance platform.

## Table of Contents
1. [Project Architecture Philosophy](#project-architecture-philosophy)
2. [Folder Structure Analysis](#folder-structure-analysis)
3. [Authentication System Design](#authentication-system-design)
4. [Main Application Flow](#main-application-flow)
5. [State Management Strategy](#state-management-strategy)
6. [Navigation Implementation](#navigation-implementation)
7. [Screen Organization](#screen-organization)
8. [Service Layer Architecture](#service-layer-architecture)
9. [Component Design Principles](#component-design-principles)
10. [Implementation Guidelines](#implementation-guidelines)

## Project Architecture Philosophy

### Core Design Principles
1. **Modular Architecture**: Each feature/domain has its own folder with clear boundaries
2. **Context-Driven State**: React Context API for complex state, avoiding Redux overhead
3. **Service-Oriented**: Centralized API services with consistent error handling
4. **Progressive Enhancement**: Features work independently, failing gracefully
5. **Insurance-Specific Patterns**: Domain modeling reflects real insurance operations

### Technology Stack Decisions
```javascript
// Core Stack
React Native: 0.79.6      // Latest stable for performance
Expo SDK: 53.0.23         // Managed workflow for insurance compliance
React Navigation v7       // Navigation with insurance flow patterns
React Context API         // State management for insurance data
Django REST API          // Backend for insurance business logic
```

## Folder Structure Analysis

### Root Structure Explanation
```
frontend/
├── App.js                    # Entry point with provider hierarchy
├── assets/                   # Static resources (fonts, images, icons)
├── components/              # Reusable UI components
├── constants/               # App-wide constants
├── contexts/                # Global state management
├── hooks/                   # Custom React hooks
├── navigation/              # Navigation configuration
├── screens/                 # Screen components organized by domain
├── services/                # API communication layer
├── shared/                  # Shared utilities and helpers
├── theme/                   # Design system and styling
├── types/                   # TypeScript type definitions
└── utils/                   # Pure utility functions
```

### Why This Structure?

#### 1. Domain-Driven Screen Organization
```
screens/
├── auth/                    # Authentication flow
├── main/                    # Main dashboard and core features
├── quotations/              # Insurance quotation workflows
├── admin/                   # Administrative features
├── receipts/                # Policy documents and receipts
└── testing/                 # Development and testing screens
```

**Reasoning**: Insurance applications have distinct business domains. Each domain has specific user flows, state requirements, and business rules.

#### 2. Context-Based State Management
```
contexts/
├── AuthContext.js           # User authentication state
├── AppDataContext.js        # Application-wide data cache
├── MotorInsuranceContext.js # Motor insurance workflow state
└── AWSContextDev.js         # AWS integration for development
```

**Reasoning**: Insurance workflows are complex and stateful. Context API provides:
- Type safety for insurance data structures
- Centralized state for multi-step workflows
- Clean separation of concerns
- Performance optimization for insurance calculations

## Authentication System Design

### Authentication Flow Architecture

```javascript
// Provider Hierarchy in App.js
<AuthProvider>                    // Authentication state
  <AWSProviderDev>               // Document storage/processing
    <MotorInsuranceProvider>     // Insurance workflow state
      <AppDataProvider>          // Data caching and fetching
        <AppNavigator />         // Navigation based on auth state
      </AppDataProvider>
    </MotorInsuranceProvider>
  </AWSProviderDev>
</AuthProvider>
```

### Implementation Steps for Authentication

#### Step 1: Create AuthContext.js
```javascript
// Key authentication patterns for insurance apps:

// 1. JWT Token Management
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [user, setUser] = useState(null);
const [isLoading, setIsLoading] = useState(true);

// 2. Secure Token Storage
import SecureTokenStorage from '../services/SecureTokenStorage';

// 3. Session Management
useEffect(() => {
  checkAuthStatus();
  setupSessionMonitoring();
}, []);

// 4. Automatic Token Refresh
djangoAPI.setOnSessionExpired(async () => {
  await handleSilentLogout();
});
```

#### Step 2: Authentication Screens Structure
```
screens/auth/
├── SplashScreen.js          # Initial loading screen
├── InsuranceWelcomeScreen.js # Welcome with insurance branding
├── LoginScreen.js           # Phone number + OTP login
├── SignupScreen.js          # Agent registration
└── ForgotPasswordScreen.js  # Password recovery
```

**Insurance-Specific Patterns**:
- Phone-based authentication (common in Kenya)
- OTP verification for security
- Agent code validation
- Insurance license verification

## Main Application Flow

### Dashboard Architecture (HomeScreen.js)

The main dashboard follows insurance industry patterns:

```javascript
// Insurance Dashboard Components:
1. Welcome Section        // Agent greeting and profile
2. Summary Cards          // Sales, Commission, Production metrics
3. Insurance Categories   // Motor, Medical, WIBA, Last Expense
4. Active Campaigns       // Current promotions and targets
5. Upcoming Renewals      // Policy renewal notifications
6. Claims Section         // Claims processing status
```

### Implementation Strategy for Main Screens

#### Step 1: Create Screen Structure
```
screens/main/
├── HomeScreen.js            # Main dashboard
├── QuotationsScreenNew.js   # Quote management
├── UpcomingScreen.js        # Renewals and extensions
├── MyAccountScreen.js       # Agent profile and settings
├── ClaimsScreenNew.js       # Claims management
├── RenewalScreen.js         # Policy renewal flow
├── ExtensionScreen.js       # Policy extension flow
└── ClaimsSubmissionScreen.js # New claim submission
```

#### Step 2: State Management Pattern
```javascript
// AppDataContext.js - Centralized data management
const AppDataProvider = ({ children }) => {
  // Insurance-specific state
  const [legacyQuotes, setLegacyQuotes] = useState([]);
  const [motorPolicies, setMotorPolicies] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [extensions, setExtensions] = useState([]);
  const [claims, setClaims] = useState([]);
  const [commissionSummary, setCommissionSummary] = useState(null);
  
  // TTL-based caching for insurance data
  const TTL = {
    user: 5 * 60 * 1000,           // 5 minutes
    quotes: 2 * 60 * 1000,         // 2 minutes
    motorPolicies: 2 * 60 * 1000,  // 2 minutes
    renewals: 3 * 60 * 1000,       // 3 minutes
    extensions: 3 * 60 * 1000,     // 3 minutes
    claims: 3 * 60 * 1000,         // 3 minutes
    commissions: 5 * 60 * 1000,    // 5 minutes
  };
};
```

## State Management Strategy

### Context API Implementation for Insurance

#### 1. AuthContext - User Authentication
```javascript
// Handles:
- JWT token management
- User session state
- Agent profile data
- Automatic token refresh
- Session expiration handling
```

#### 2. MotorInsuranceContext - Complex Workflow State
```javascript
// Motor Insurance workflow state management:
const initialState = {
  // Step-by-step workflow
  currentStep: 0,
  completedSteps: [],
  
  // Category and product selection
  selectedCategory: null,      // Private, Commercial, PSV, etc.
  selectedSubcategory: null,   // Third Party, Comprehensive, etc.
  
  // Vehicle details
  vehicleDetails: {},          // Registration, year, etc.
  
  // Underwriter comparison
  availableUnderwriters: [],
  pricingComparison: [],
  selectedUnderwriter: null,
  
  // Client information
  clientDetails: {},
  kycDocuments: [],
  
  // Payment and final submission
  paymentDetails: null,
};
```

#### 3. AppDataContext - Data Caching and Fetching
```javascript
// Centralized data management with TTL caching:
const fetchUser = useCallback(async (force = false) => {
  if (!force && isFresh('user') && user) return user;
  try {
    const data = await usersAPI.getCurrentUser();
    setUser(data);
    markFresh('user');
    return data;
  } catch (e) {
    setErrors((prev) => ({ ...prev, user: e }));
    return null;
  }
}, [isFresh, markFresh, user]);
```

## Navigation Implementation

### Navigation Architecture
```javascript
// AppNavigator.js - Main navigation controller
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          // Authenticated screens
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          // Motor insurance flow
          <Stack.Screen name="MotorInsurance" component={MotorInsuranceContainer} />
          // Other quotation screens
          // Receipt screens
          // Admin screens
        ) : (
          // Authentication screens
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

### Tab Navigation for Insurance Dashboard
```javascript
// MainTabNavigator.js
const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#D5222B',    // PataBima brand color
        tabBarInactiveTintColor: '#646767',  // Gray for inactive
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E7EB',
          paddingBottom: 8,                  // Safe area padding
          height: 65,
        },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Quotations" component={QuotationsScreenNew} />
      <Tab.Screen name="Upcoming" component={UpcomingScreen} />
      <Tab.Screen name="Claims" component={ClaimsScreenNew} />
      <Tab.Screen name="Account" component={MyAccountScreen} />
    </Tab.Navigator>
  );
}
```

## Screen Organization

### Insurance Quotation Screens Structure
```
screens/quotations/
├── Motor 2/                 # Complete motor insurance workflow
│   ├── MotorInsuranceFlow/ # Step-by-step motor insurance
│   ├── VehicleDetails/     # Vehicle information forms
│   ├── UnderwriterComparison/ # Price comparison
│   └── Success/            # Success and receipt screens
├── medical/                 # Medical insurance quotations
├── wiba/                   # WIBA (Workmen's compensation)
├── travel/                 # Travel insurance
├── last-expense/           # Last expense insurance
└── professional-indemnity/ # Professional indemnity
```

### Implementation Pattern for New Insurance Types

#### Step 1: Create Insurance Type Folder
```bash
mkdir screens/quotations/marine-insurance
cd screens/quotations/marine-insurance
```

#### Step 2: Create Core Screens
```javascript
// MarineCategoryScreen.js
export default function MarineCategoryScreen() {
  return (
    <View>
      <Text>Marine Insurance Categories</Text>
      {/* Vessel Type Selection */}
      {/* Coverage Type Selection */}
    </View>
  );
}

// MarineQuotationScreen.js - Main quotation form
// MarinePricingScreen.js - Underwriter comparison
// MarineSuccessScreen.js - Quote confirmation
```

#### Step 3: Add to Navigation
```javascript
// In AppNavigator.js
import { MarineCategoryScreen, MarineQuotationScreen } from '../screens/quotations/marine-insurance';

// Add to stack navigator
<Stack.Screen name="MarineCategory" component={MarineCategoryScreen} />
<Stack.Screen name="MarineQuotation" component={MarineQuotationScreen} />
```

## Service Layer Architecture

### API Service Structure
```
services/
├── DjangoAPIService.js      # Main API client with authentication
├── users.js                 # User management operations
├── commissions.js           # Commission calculations
├── campaigns.js             # Marketing campaigns
├── SecureTokenStorage.js    # Secure token management
├── StoragePurge.js          # Data cleanup utilities
└── apiConfig.js             # API configuration
```

### Service Implementation Pattern

#### Step 1: Create Service Module
```javascript
// services/motorInsurance.js
import djangoAPI from './DjangoAPIService';

class MotorInsuranceService {
  // Get motor categories
  async getCategories() {
    try {
      const response = await djangoAPI.makeRequest('/api/v1/motor/categories');
      return response.categories || [];
    } catch (error) {
      console.error('[MotorInsurance] Categories error:', error);
      throw error;
    }
  }

  // Compare underwriter pricing
  async compareUnderwriters(subcategoryCode, formData) {
    try {
      const response = await djangoAPI.makeRequest('/api/v1/motor/compare-pricing', {
        method: 'POST',
        body: {
          subcategory_code: subcategoryCode,
          ...formData
        }
      });
      return response.comparisons || [];
    } catch (error) {
      console.error('[MotorInsurance] Pricing comparison error:', error);
      throw error;
    }
  }

  // Submit quotation
  async submitQuotation(quotationData) {
    try {
      const response = await djangoAPI.makeRequest('/api/v1/motor/quotations', {
        method: 'POST',
        body: quotationData
      });
      return response;
    } catch (error) {
      console.error('[MotorInsurance] Submission error:', error);
      throw error;
    }
  }
}

export default new MotorInsuranceService();
```

## Component Design Principles

### Reusable Component Structure
```
components/
├── ui/                      # Basic UI components
│   ├── Button.js           # Styled buttons
│   ├── Input.js            # Form inputs
│   ├── Card.js             # Content cards
│   └── Modal.js            # Modals and overlays
├── forms/                   # Form-specific components
│   ├── VehicleForm.js      # Vehicle details form
│   ├── ClientForm.js       # Client information form
│   └── PaymentForm.js      # Payment details form
└── insurance/               # Insurance-specific components
    ├── PremiumCard.js      # Premium display component
    ├── UnderwriterCard.js  # Underwriter comparison card
    └── PolicyCard.js       # Policy summary card
```

### Component Implementation Guidelines

#### 1. Insurance-Specific Components
```javascript
// components/insurance/PremiumCard.js
export default function PremiumCard({ premium, breakdown, underwriter }) {
  return (
    <Card style={styles.premiumCard}>
      <Text style={styles.underwriterName}>{underwriter}</Text>
      <Text style={styles.totalPremium}>KSh {premium.toLocaleString()}</Text>
      
      <View style={styles.breakdown}>
        <Text>Base Premium: KSh {breakdown.base.toLocaleString()}</Text>
        <Text>ITL (0.25%): KSh {breakdown.itl.toLocaleString()}</Text>
        <Text>PCF (0.25%): KSh {breakdown.pcf.toLocaleString()}</Text>
        <Text>Stamp Duty: KSh 40</Text>
      </View>
    </Card>
  );
}
```

#### 2. Form Component Pattern
```javascript
// components/forms/VehicleForm.js
export default function VehicleForm({ onDataChange, initialData = {} }) {
  const [formData, setFormData] = useState(initialData);
  
  const handleInputChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    onDataChange(newData);
  };
  
  return (
    <View style={styles.form}>
      <Input
        label="Vehicle Registration"
        value={formData.registration}
        onChangeText={(value) => handleInputChange('registration', value)}
        placeholder="e.g., KCA 123A"
      />
      {/* More form fields */}
    </View>
  );
}
```

## Implementation Guidelines

### Starting a New Insurance Feature

#### Step 1: Plan the Domain
```
1. Identify insurance type (e.g., Marine, Crop, Life)
2. Define coverage categories
3. Map underwriter products
4. Design pricing calculation rules
5. Plan document requirements
```

#### Step 2: Create Backend Models
```python
# In Django backend
class MarineCategory(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField()
    is_active = models.BooleanField(default=True)

class MarineProduct(models.Model):
    category = models.ForeignKey(MarineCategory)
    vessel_type = models.CharField(max_length=100)
    coverage_type = models.CharField(max_length=100)
    pricing_model = models.CharField(max_length=50)
```

#### Step 3: Create Frontend Structure
```bash
# Create folder structure
mkdir -p screens/quotations/marine
mkdir -p components/marine
mkdir -p services/marine

# Create initial files
touch screens/quotations/marine/MarineCategoryScreen.js
touch screens/quotations/marine/MarineQuotationScreen.js
touch components/marine/VesselDetailsForm.js
touch services/marine/marineInsurance.js
```

#### Step 4: Implement Context if Needed
```javascript
// contexts/MarineInsuranceContext.js
const MarineInsuranceContext = createContext();

export const MarineInsuranceProvider = ({ children }) => {
  const [selectedVesselType, setSelectedVesselType] = useState(null);
  const [vesselDetails, setVesselDetails] = useState({});
  const [coverageSelection, setCoverageSelection] = useState({});
  
  // Context implementation
};
```

#### Step 5: Add Navigation Routes
```javascript
// In AppNavigator.js
<Stack.Screen 
  name="MarineCategory" 
  component={MarineCategoryScreen}
  options={{ title: 'Marine Insurance' }}
/>
```

### Best Practices for Insurance Apps

#### 1. Data Validation
```javascript
// Always validate insurance data
const validateVehicleRegistration = (registration) => {
  const kenyanRegex = /^[A-Z]{3}\s?\d{3}[A-Z]$/;
  return kenyanRegex.test(registration);
};

const validateIDNumber = (idNumber) => {
  return idNumber && idNumber.length >= 7 && idNumber.length <= 8;
};
```

#### 2. Error Handling
```javascript
// Insurance-specific error handling
try {
  const pricing = await motorInsuranceService.compareUnderwriters(data);
} catch (error) {
  if (error.code === 'INVALID_VEHICLE') {
    showAlert('Invalid Vehicle', 'Please check vehicle registration details');
  } else if (error.code === 'NO_UNDERWRITERS') {
    showAlert('No Coverage', 'No underwriters available for this vehicle type');
  } else {
    showAlert('System Error', 'Please try again later');
  }
}
```

#### 3. Performance Optimization
```javascript
// Cache insurance data with appropriate TTL
const useInsuranceData = (type) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const cached = await getCachedData(type);
        if (cached && !isExpired(cached)) {
          setData(cached.data);
        } else {
          const fresh = await fetchInsuranceData(type);
          await setCachedData(type, fresh);
          setData(fresh);
        }
      } catch (error) {
        console.error(`Failed to fetch ${type} data:`, error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [type]);
  
  return { data, loading };
};
```

### Security Considerations for Insurance Apps

#### 1. Sensitive Data Handling
```javascript
// Use SecureTokenStorage for sensitive insurance data
import SecureTokenStorage from '../services/SecureTokenStorage';

// Store client sensitive information securely
await SecureTokenStorage.setItem('client_id_number', idNumber);
await SecureTokenStorage.setItem('policy_details', JSON.stringify(policyData));
```

#### 2. API Security
```javascript
// Always use authenticated requests for insurance operations
const response = await djangoAPI.makeRequest('/api/v1/motor/submit-quotation', {
  method: 'POST',
  body: quotationData,
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### 3. Data Encryption
```javascript
// Encrypt sensitive client data before storage
import CryptoJS from 'crypto-js';

const encryptSensitiveData = (data, secretKey) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
};

const decryptSensitiveData = (encryptedData, secretKey) => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};
```

## Conclusion

This architecture provides a solid foundation for building insurance applications with:

1. **Scalable folder structure** that grows with business domains
2. **Robust state management** for complex insurance workflows
3. **Secure authentication** suitable for financial applications
4. **Modular services** for different insurance types
5. **Reusable components** for consistent UI/UX
6. **Performance optimization** for mobile insurance agents
7. **Security best practices** for sensitive insurance data

The PataBima frontend demonstrates how to build a production-ready insurance platform that can handle complex business rules, multiple insurance products, and secure financial transactions while maintaining excellent user experience for insurance agents in the field.
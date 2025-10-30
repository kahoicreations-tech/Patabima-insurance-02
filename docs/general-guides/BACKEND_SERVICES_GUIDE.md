# PataBima Backend Services Structure

## 🏗️ **Backend Services Architecture**

This document outlines the complete backend services structure created for the PataBima React Native Expo application.

### 📁 **Directory Structure**

```
src/services/
├── api/                    # API service layers
│   ├── auth.js            # Authentication services
│   ├── quotations.js      # Quotation management
│   ├── policies.js        # Policy management
│   ├── claims.js          # Claims processing
│   ├── users.js           # User/Agent services
│   └── index.js           # API exports
├── config/                # Configuration files
│   ├── apiConfig.js       # API endpoints & configuration
│   ├── awsConfig.js       # AWS services configuration
│   └── index.js           # Config exports
├── utils/                 # Utility services
│   ├── apiClient.js       # HTTP client with interceptors
│   ├── storage.js         # AsyncStorage utilities
│   ├── validation.js      # Data validation helpers
│   └── index.js           # Utils exports
└── index.js               # Main services export
```

### 🔧 **Core Components**

#### **1. API Client (`apiClient.js`)**
- **Axios-based HTTP client** with request/response interceptors
- **Automatic token management** and refresh
- **Network connectivity checks**
- **Error handling and logging**
- **File upload/download support**
- **Request timeout and retry logic**

#### **2. Authentication Service (`auth.js`)**
- User login/logout/registration
- Token refresh and management
- Password reset functionality
- Account verification
- Secure auth data storage

#### **3. Quotations Service (`quotations.js`)**
- Create quotations for all insurance types
- Motor, Medical, WIBA, Travel, etc.
- Quotation management (CRUD operations)
- Convert quotations to policies
- Statistics and reporting

#### **4. Policies Service (`policies.js`)**
- Policy management and tracking
- Renewal and extension processing
- Document management
- Premium calculations
- Policy status monitoring

#### **5. Claims Service (`claims.js`)**
- Claims submission and tracking
- Document upload and management
- Status updates and timeline
- Comments and communication
- Claims statistics

#### **6. Users Service (`users.js`)**
- User profile management
- Dashboard data
- Commission tracking
- Sales statistics
- Performance metrics

### 🛠️ **Utility Services**

#### **Storage Service (`storage.js`)**
- **AsyncStorage wrapper** with JSON support
- **Caching with expiration**
- **Batch operations**
- **Storage size monitoring**
- **Data sanitization**

#### **Validation Service (`validation.js`)**
- **Form validation** for all insurance types
- **Kenya-specific validations** (phone, ID, vehicle reg)
- **Data sanitization**
- **Password strength validation**
- **File type and size validation**

### ⚙️ **Configuration**

#### **API Configuration (`apiConfig.js`)**
- **Environment-based endpoints**
- **Complete API endpoint mapping**
- **HTTP methods and headers**
- **Request timeout settings**

#### **AWS Configuration (`awsConfig.js`)**
- **Amplify configuration**
- **Cognito authentication setup**
- **S3 storage configuration**
- **Lambda function references**
- **DynamoDB table mapping**

### 🌍 **Environment Setup**

#### **Development (`.env.development`)**
- Development API endpoints
- Sandbox payment gateways
- Debug mode enabled
- Development AWS resources

#### **Production (`.env.production`)**
- Production API endpoints
- Live payment gateways
- Debug mode disabled
- Production AWS resources

### 📋 **Required Dependencies**

Add these dependencies to your `package.json`:

```bash
npm install @react-native-async-storage/async-storage
npm install axios
npm install @react-native-community/netinfo
npm install react-query  # Optional: For data fetching and caching
```

### 🚀 **Usage Examples**

#### **Authentication**
```javascript
import { authService } from '../services';

// Login
const loginResult = await authService.login({
  email: 'agent@patabima.com',
  password: 'password123'
});

// Check auth status
const isAuthenticated = await authService.isAuthenticated();
```

#### **Create Quotation**
```javascript
import { quotationsService } from '../services';

// Create motor quotation
const quotation = await quotationsService.createMotorQuotation({
  vehicleType: 'private',
  coverageType: 'comprehensive',
  vehicleRegistration: 'KCD 123A',
  // ... other data
});
```

#### **Submit Claim**
```javascript
import { claimsService } from '../services';

// Submit new claim
const claim = await claimsService.submitClaim({
  policyId: 'POL-001234',
  claimType: 'vehicle_accident',
  description: 'Front bumper damage',
  // ... other data
});
```

#### **Data Validation**
```javascript
import { validationService } from '../services';

// Validate motor insurance data
const validation = validationService.validateMotorInsurance(formData);
if (!validation.isValid) {
  console.log('Errors:', validation.errors);
}
```

### 🔒 **Security Features**

- **JWT token management** with automatic refresh
- **Request/response encryption** support
- **Input validation and sanitization**
- **Network security checks**
- **Secure storage implementation**

### 📊 **Monitoring & Analytics**

- **API request/response logging**
- **Error tracking and reporting**
- **Performance metrics**
- **Usage analytics**
- **Storage usage monitoring**

### 🎯 **Next Steps**

1. **Install dependencies** listed above
2. **Configure environment variables** with actual values
3. **Set up AWS services** (Cognito, API Gateway, S3, etc.)
4. **Test API connections** with development endpoints
5. **Integrate services** into existing screens and components
6. **Implement error handling** throughout the app
7. **Add loading states** for better UX
8. **Set up monitoring** and analytics

### 📝 **Notes**

- All services are **singleton instances** for consistency
- **TypeScript support** ready (add `.ts` extensions)
- **Offline capability** can be added with react-query
- **Push notifications** integration ready
- **File upload/download** support included

This backend structure provides a **production-ready foundation** for the PataBima mobile application with scalable architecture and comprehensive error handling.

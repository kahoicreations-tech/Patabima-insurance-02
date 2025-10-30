# Enhanced TOR Services Integration Guide

## Overview
Successfully integrated your powerful `services/backendApi.js` with the existing PataBima TOR flow, providing enhanced functionality including DMVIC verification, document uploads, and payment processing.

## What's Been Added

### 1. Enhanced TOR Service Layer (`frontend/services/EnhancedTORService.js`)
- **Comprehensive API Integration**: Bridges your backend services with Django API
- **Fallback Strategy**: Tries backend service first, falls back to Django API if needed
- **Enhanced Features**:
  - Vehicle verification with caching
  - Document uploads with progress tracking
  - Payment processing with transaction tracking
  - Certificate issuance and download
  - Dashboard overview integration

### 2. Enhanced Context Provider (`frontend/contexts/EnhancedTORContext.js`)
- **State Management**: Manages vehicle, quote, document, and payment states
- **Error Handling**: Comprehensive error handling with user feedback
- **Progress Tracking**: Real-time progress for uploads and payments
- **Cache Management**: Intelligent caching for vehicle verification

### 3. Enhanced TOR Screens

#### TORPolicyDetailsScreen
- **Enhanced DMVIC Integration**: Uses robust vehicle verification with caching
- **Better Loading States**: Visual feedback for verification and quote generation
- **Error Handling**: Clear error messages for failed operations

#### TORKYCUploadScreen
- **File Picker Integration**: Uses Expo DocumentPicker for file selection
- **Progress Tracking**: Real-time upload progress with status indicators
- **Validation**: Ensures all required documents are uploaded before proceeding

#### TORPaymentScreen
- **Enhanced Payment Flow**: Integrates backend payment processing
- **Status Tracking**: Real-time payment status with visual indicators
- **Transaction Management**: Proper transaction reference handling

## Integration Steps

### 1. Install Required Dependencies
```bash
cd "c:\Users\USER\Desktop\PATABIMA\PATABIMA FRONT\PATA BIMA AGENCY - Copy"
npm install expo-document-picker
```

### 2. Copy Services to Your Project
Copy your `services/services/backendApi.js` to:
```
frontend/services/backendApi.js
```

### 3. Add Context Provider to App
Update your `App.js` or main navigator to include the EnhancedTORProvider:

```javascript
import { EnhancedTORProvider } from './frontend/contexts/EnhancedTORContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AWSProviderDev>
          <EnhancedTORProvider>
            <AppNavigator />
          </EnhancedTORProvider>
        </AWSProviderDev>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

### 4. Update Backend API Service Path
In `frontend/services/EnhancedTORService.js`, update the import path:
```javascript
import * as backendApi from './backendApi'; // Adjust path as needed
```

### 5. Backend Configuration
Ensure your backend service is running with the following endpoints:

#### TOR Endpoints
- `POST /api/insurance/tor/quote/` - Generate quote
- `POST /api/insurance/tor/documents/` - Upload documents
- `POST /api/insurance/payment/` - Process payment
- `GET /api/insurance/receipt/{policyId}/` - Get receipt

#### DMVIC Endpoints
- `POST /api/dmvic/service/verify_vehicle/` - Verify vehicle
- `GET /api/dmvic/health/` - Health check

#### Insurance Endpoints
- `GET /api/insurance/providers/` - Get underwriters
- `POST /api/insurance/policies/` - Create policy
- `POST /api/insurance/policies/{policyId}/issue_certificate/` - Issue certificate

## Enhanced Features Available

### 1. Vehicle Verification
```javascript
const { verifyVehicle, vehicleState } = useEnhancedTOR();

// Enhanced verification with caching
const result = await verifyVehicle({
  vehicle_registration: 'KCA123A',
  vehicle_make: 'Toyota',
  vehicle_model: 'Corolla',
  vehicle_year: 2020
});

// Access loading state and errors
console.log(vehicleState.loading); // true/false
console.log(vehicleState.error); // error message if any
```

### 2. Document Upload
```javascript
const { uploadDocument, documentState } = useEnhancedTOR();

// Upload with progress tracking
const formData = new FormData();
formData.append('document', file);
formData.append('document_type', 'national_id');

const result = await uploadDocument('national_id', formData);

// Check upload status
const status = documentState.uploads['national_id'];
console.log(status.status); // 'uploading', 'success', 'error'
console.log(status.progress); // 0-100
```

### 3. Payment Processing
```javascript
const { processPayment, paymentState } = useEnhancedTOR();

// Process payment with tracking
const result = await processPayment({
  amount: 15000,
  method: 'MPESA',
  phone: '0700000000',
  policy_id: 'policy123'
});

// Access payment state
console.log(paymentState.status); // 'idle', 'pending', 'success', 'error'
console.log(paymentState.reference); // transaction reference
```

## Error Handling

All enhanced services include comprehensive error handling:

```javascript
const { success, data, error } = await verifyVehicle(vehicleData);
if (success) {
  // Handle success
  console.log('Verification successful:', data);
} else {
  // Handle error
  console.error('Verification failed:', error);
}
```

## Fallback Strategy

The enhanced services use a smart fallback strategy:
1. **Primary**: Try your backend service first
2. **Fallback**: If backend fails, use existing Django API
3. **Error Handling**: Show appropriate error messages to users

## Performance Features

### Caching
- Vehicle verification results are cached locally
- Prevents duplicate API calls for the same vehicle
- Cache can be cleared using `clearCache()` method

### Progress Tracking
- Real-time progress for document uploads
- Visual loading indicators for all operations
- Status tracking for payments and submissions

## Testing the Integration

1. **Start Backend Services**:
   ```bash
   cd "c:\Users\USER\Desktop\services\backend"
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Set Environment Variables**:
   ```bash
   $env:EXPO_PUBLIC_API_URL='http://YOUR_IP:8000'
   npm start
   ```

3. **Test TOR Flow**:
   - Policy Details: Vehicle verification should show enhanced loading
   - KYC Upload: File picker should work with progress tracking
   - Payment: Enhanced payment flow with status tracking

## 401 Authorization Fix

The "Unauthorized: /api/v1/public_app/insurance/get_quotations" error indicates:

1. **Missing Token**: Ensure user is logged in and token is stored
2. **Token Format**: Check if token format matches backend expectations
3. **Endpoint Permissions**: Verify endpoint allows the current user role

### Quick Fix:
```javascript
// In your enhanced service
async getAuthToken() {
  // Check multiple token sources
  const sources = ['auth_token', 'accessToken', 'user'];
  for (const source of sources) {
    const stored = await AsyncStorage.getItem(source);
    if (stored) {
      // Return appropriate token format
      return source === 'user' ? JSON.parse(stored)?.tokens?.access : stored;
    }
  }
  return null;
}
```

## Next Steps

1. **Test Each Flow**: Test policy details, KYC upload, and payment
2. **Monitor Logs**: Check console for enhanced service logs
3. **Backend Health**: Test backend endpoints directly
4. **Error Handling**: Verify fallback behavior works correctly
5. **UI Polish**: Customize loading and error states as needed

The enhanced TOR services are now ready and will provide a much more robust and user-friendly experience!
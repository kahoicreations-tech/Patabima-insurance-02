# Motor 2 Flow: Step 3 & Step 4 Streamlining Plan

**Document Version:** 1.0  
**Date:** November 5, 2025  
**Author:** Development Team  
**Status:** Planning Phase

---

## Executive Summary

This document outlines a comprehensive plan to streamline the Motor 2 insurance policy generation flow by integrating DMVIC (Digital Motor Vehicle Insurance Certificate) verification directly into Step 3 (Policy Details), eliminating redundant API calls, and improving user experience through proactive validation and caching strategies.

**Key Improvements:**

- ✅ Reduce redundant DMVIC API calls through frontend caching
- ✅ Proactive existing cover detection within Policy Details step
- ✅ Smoother UX with inline loading indicators instead of abrupt drawers
- ✅ Enforced date compliance to prevent policy overlaps
- ✅ Debounced API requests to optimize performance

---

## 1. Problem Analysis

### Current Flow Architecture

```
Step 3 (Policy Details)
    ↓
User enters vehicle registration
    ↓
User clicks "Next" → Navigate to Step 4 (KYC)
    ↓
Step 4 useEffect triggers DMVIC search-vehicle API call
    ↓
DMVIC Response Processing:
    ├─ No existing cover found → Continue to KYC form
    └─ Existing cover found → Show VehicleVerificationScreen drawer
                              ↓
                              User Options:
                              ├─ Adjust Start Date → Send back to Step 3
                              └─ Submit Debit Note → Alternative flow
```

### Identified Issues

#### 1.1. Redundant API Calls

**Problem:** The `search-vehicle` API may be called multiple times in scenarios such as:

- User navigates back from Step 4 to Step 3 and then forward again
- Component re-renders trigger `useEffect` dependencies
- User modifies vehicle registration after initial check

**Impact:**

- Increased load on DMVIC external API (potential rate limiting)
- Slower user experience due to repeated network requests
- Unnecessary backend processing and database queries

**Evidence:**

```javascript
// Current implementation in MotorInsuranceContainer.js
useEffect(() => {
  if (currentStep === 3) {
    // KYC step
    checkForExistingCover(); // Triggers DMVIC API call
  }
}, [currentStep, registrationNumber]);
```

#### 1.2. Disruptive User Experience

**Problem:** The loading drawer appears **after** the user has already navigated to the KYC step, creating a jarring experience.

**User Pain Points:**

- User fills out vehicle details in Step 3
- Clicks "Next" expecting to proceed to KYC
- Suddenly confronted with a full-screen drawer about existing cover
- Forced to go back to Step 3 to adjust dates
- Loss of context and flow momentum

**Wireframe of Current Flow:**

```
┌─────────────────────────────┐
│   Step 3: Policy Details    │
│                             │
│ Registration: [ABC123X]     │
│ Cover Start: [2025-11-10]   │
│                             │
│         [Next Button]        │ ← User clicks
└─────────────────────────────┘
          ↓ Navigate
┌─────────────────────────────┐
│    Step 4: KYC Details      │
│                             │
│ [Loading: Checking cover...] │ ← Abrupt loading drawer
│                             │
└─────────────────────────────┘
          ↓ If existing cover found
┌─────────────────────────────┐
│ ⚠️ Existing Cover Found!    │
│                             │
│ Cover ends: 2025-12-15      │
│                             │
│ [Adjust Start Date]          │ ← Forces back to Step 3
│ [Submit Debit Note]          │
└─────────────────────────────┘
```

#### 1.3. Data Consistency Challenges

**Problem:** When user is sent back to Step 3 to adjust dates, ensuring the `minDate` for `cover_start_date` is correctly enforced across form state, context, and UI components.

**Challenges:**

- `minDate` must be `existing_cover_expiry_date + 1 day`
- Date picker component needs to update its constraints dynamically
- Form validation must prevent submission with invalid dates
- Context state must persist the constraint across step navigation

**Current Gap:**

```javascript
// VehicleVerificationScreen.js - Current implementation
const handleAdjustDate = () => {
  setShowVerificationScreen(false);
  setCurrentStep(2); // Go back to Step 3 (Policy Details)
  // ❌ No mechanism to enforce minDate in the date picker
};
```

---

## 2. Proposed Solution: Integrated & Cached DMVIC Check

### 2.1. Solution Architecture

```
Step 3 (Policy Details) - ENHANCED
    ↓
User enters vehicle registration
    ↓
Debounced DMVIC check (500ms after input stops)
    ↓
Inline Loading Indicator (subtle, within form)
    ↓
DMVIC Response:
    ├─ No existing cover → Green checkmark icon, proceed to Step 4
    │                      Cache result in MotorInsuranceContext
    │
    └─ Existing cover found → Show VehicleVerificationScreen drawer
                              (STILL on Step 3, no navigation yet)
                              ↓
                              User Options:
                              ├─ Adjust Start Date → Update cover_start_date
                              │                      Enforce minDate in form
                              │                      Close drawer
                              │                      User can now proceed
                              │
                              └─ Submit Debit Note → Navigate to debit note flow
                                                     OR show info modal
```

### 2.2. Key Technical Changes

#### Change 1: Move DMVIC Trigger to Step 3

**Before:**

```javascript
// MotorInsuranceContainer.js - Step 4 (KYC) useEffect
useEffect(() => {
  if (currentStep === 3) {
    // KYC step
    checkForExistingCover();
  }
}, [currentStep, registrationNumber]);
```

**After:**

```javascript
// PolicyDetailsStep.js - Integrated DMVIC check
const handleRegistrationChange = useCallback(
  debounce((regNumber) => {
    if (regNumber && regNumber.length >= 6) {
      performDMVICCheck(regNumber);
    }
  }, 500),
  []
);
```

#### Change 2: Frontend Caching with TTL

**Implementation in MotorInsuranceContext:**

```javascript
const initialState = {
  // ... existing state
  dmvicCache: new Map(), // Key: regNumber, Value: { result, timestamp }
  dmvicCacheTTL: 30 * 60 * 1000, // 30 minutes
};

// Cache check function
const getCachedDMVICResult = (regNumber) => {
  const cached = state.dmvicCache.get(regNumber);
  if (cached && Date.now() - cached.timestamp < state.dmvicCacheTTL) {
    return cached.result;
  }
  return null;
};
```

#### Change 3: Inline Loading UI

**Before (Full-screen drawer):**

```javascript
{
  verificationStatus === "checking" && (
    <DrawerContainer style={styles.drawerContainerSmall}>
      <ActivityIndicator size="large" />
      <Text>Checking for existing cover...</Text>
    </DrawerContainer>
  );
}
```

**After (Inline indicator):**

```javascript
// PolicyDetailsStep.js
<View style={styles.registrationField}>
  <TextInput
    value={registrationNumber}
    onChangeText={handleRegistrationChange}
    placeholder="Enter Registration Number"
  />
  {dmvicLoading && (
    <ActivityIndicator
      size="small"
      style={styles.inlineLoader}
      color={COLORS.primary}
    />
  )}
  {dmvicResult?.hasExistingCover === false && (
    <Icon name="checkmark-circle" color="green" style={styles.checkIcon} />
  )}
</View>
```

#### Change 4: Conditional Navigation Logic

**Implementation in MotorInsuranceContainer.js:**

```javascript
const goNext = useCallback(() => {
  // Prevent navigation if existing cover drawer is open
  if (showVerificationScreen && existingCoverData) {
    Alert.alert(
      "Existing Cover Detected",
      "Please resolve the existing cover conflict before proceeding.",
      [{ text: "OK" }]
    );
    return;
  }

  // Normal navigation
  if (currentStep < steps.length - 1) {
    setCurrentStep(currentStep + 1);
  }
}, [currentStep, showVerificationScreen, existingCoverData]);
```

#### Change 5: Enforce minDate on Date Picker

**Implementation in DynamicVehicleForm.js:**

```javascript
// Date picker component
<DateTimePicker
  value={coverStartDate}
  minimumDate={minCoverStartDate || new Date()} // Enforced constraint
  onChange={(event, selectedDate) => {
    if (selectedDate < minCoverStartDate) {
      Alert.alert(
        "Invalid Date",
        `Cover start date must be after ${formatDate(minCoverStartDate)}`
      );
      return;
    }
    handleCoverDateChange(selectedDate);
  }}
/>
```

### 2.3. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    MotorInsuranceContext                     │
│                                                              │
│  State:                                                      │
│    - vehicleDetails { registrationNumber, coverStartDate }  │
│    - dmvicCache Map                                          │
│    - existingCoverData { hasExistingCover, expiryDate }     │
│    - minCoverStartDate (enforced constraint)                │
│    - showVerificationScreen (boolean)                        │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │ Context Updates
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     PolicyDetailsStep.js                     │
│                                                              │
│  1. User enters registration → handleRegistrationChange()   │
│  2. Debounce 500ms → performDMVICCheck()                     │
│  3. Check dmvicCache first:                                  │
│       - Cache hit → Use cached result                        │
│       - Cache miss → Call djangoAPI.searchVehicle()          │
│  4. Update context with DMVIC result                         │
│  5. If existing cover found:                                 │
│       - Set existingCoverData                                │
│       - Set showVerificationScreen = true                    │
│       - Set minCoverStartDate = expiryDate + 1 day           │
│  6. Render VehicleVerificationScreen modal                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 VehicleVerificationScreen.js                 │
│                                                              │
│  User Options:                                               │
│    1. Adjust Start Date:                                     │
│         - Update coverStartDate in context                   │
│         - Set minDate constraint                             │
│         - Close modal (showVerificationScreen = false)       │
│         - User stays on Step 3, can now proceed              │
│                                                              │
│    2. Submit Debit Note:                                     │
│         - Navigate to debit note submission flow             │
│         - OR show informational modal                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Step-by-Step Implementation Plan

### Phase 1: Frontend - Integrate DMVIC Check into PolicyDetailsStep

**Timeline:** Week 1 (5 working days)

#### Task 1.1: Modify `PolicyDetailsStep.js`

**File:** `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/VehicleDetails/PolicyDetailsStep.js`

**Changes:**

1. **Import dependencies:**

```javascript
import { useState, useCallback, useEffect } from "react";
import { debounce } from "lodash"; // Or custom debounce utility
import djangoAPI from "../../../../../services/DjangoAPIService";
import { useMotorInsurance } from "../../../../../contexts/MotorInsuranceContext";
```

2. **Add state variables:**

```javascript
const PolicyDetailsStep = () => {
  const {
    vehicleDetails,
    updateVehicleDetails,
    existingCoverData,
    setExistingCoverData,
    showVerificationScreen,
    setShowVerificationScreen,
    minCoverStartDate,
    setMinCoverStartDate,
    getCachedDMVICResult,
    cacheDMVICResult,
  } = useMotorInsurance();

  const [dmvicLoading, setDMVICLoading] = useState(false);
  const [dmvicError, setDMVICError] = useState(null);

  // ... rest of component
};
```

3. **Implement DMVIC check function:**

```javascript
const performDMVICCheck = useCallback(
  async (regNumber, coverDate) => {
    try {
      setDMVICLoading(true);
      setDMVICError(null);

      // Check cache first
      const cachedResult = getCachedDMVICResult(regNumber);
      if (cachedResult) {
        console.log("[DMVIC] Using cached result for:", regNumber);
        processDMVICResult(cachedResult);
        setDMVICLoading(false);
        return;
      }

      // Make API call
      console.log("[DMVIC] Fetching fresh data for:", regNumber);
      const response = await djangoAPI.searchVehicle({
        registration_number: regNumber,
        proposed_cover_start_date: coverDate || new Date().toISOString(),
      });

      // Cache the result
      cacheDMVICResult(regNumber, response);

      // Process result
      processDMVICResult(response);
    } catch (error) {
      console.error("[DMVIC] Check failed:", error);
      setDMVICError(error.message || "Failed to verify vehicle");
    } finally {
      setDMVICLoading(false);
    }
  },
  [getCachedDMVICResult, cacheDMVICResult]
);

const processDMVICResult = (result) => {
  if (result.has_existing_cover) {
    // Existing cover found
    const expiryDate = new Date(result.existing_cover_expiry_date);
    const minDate = new Date(expiryDate);
    minDate.setDate(minDate.getDate() + 1); // Next day after expiry

    setExistingCoverData({
      hasExistingCover: true,
      expiryDate: result.existing_cover_expiry_date,
      policyNumber: result.existing_policy_number,
      underwriter: result.existing_underwriter,
    });
    setMinCoverStartDate(minDate.toISOString());
    setShowVerificationScreen(true);
  } else {
    // No existing cover
    setExistingCoverData({ hasExistingCover: false });
    setShowVerificationScreen(false);
    setMinCoverStartDate(null);
  }
};
```

4. **Implement debounced handler:**

```javascript
const handleRegistrationChange = useCallback(
  debounce((regNumber) => {
    if (regNumber && regNumber.length >= 6) {
      const coverDate =
        vehicleDetails.cover_start_date || new Date().toISOString();
      performDMVICCheck(regNumber, coverDate);
    }
  }, 500), // 500ms debounce
  [performDMVICCheck, vehicleDetails.cover_start_date]
);

const handleCoverDateChange = useCallback(
  debounce((coverDate) => {
    const regNumber = vehicleDetails.registration_number;
    if (regNumber && regNumber.length >= 6) {
      performDMVICCheck(regNumber, coverDate);
    }
  }, 500),
  [performDMVICCheck, vehicleDetails.registration_number]
);
```

5. **Add inline loading indicator:**

```javascript
<View style={styles.registrationFieldContainer}>
  <TextInput
    style={styles.input}
    value={vehicleDetails.registration_number || ""}
    onChangeText={(text) => {
      updateVehicleDetails({ registration_number: text });
      handleRegistrationChange(text);
    }}
    placeholder="Enter Registration Number"
    autoCapitalize="characters"
  />
  {dmvicLoading && (
    <ActivityIndicator
      size="small"
      color="#D5222B"
      style={styles.inlineLoader}
    />
  )}
  {existingCoverData?.hasExistingCover === false && (
    <Icon
      name="checkmark-circle"
      size={24}
      color="#4CAF50"
      style={styles.checkIcon}
    />
  )}
  {dmvicError && (
    <Icon
      name="alert-circle"
      size={24}
      color="#FF9800"
      style={styles.errorIcon}
    />
  )}
</View>
```

6. **Render VehicleVerificationScreen conditionally:**

```javascript
return (
  <View style={styles.container}>
    <ScrollView>
      {/* Policy details form */}
      <DynamicVehicleForm
        selectedProduct={selectedProduct}
        formData={vehicleDetails}
        onChange={updateVehicleDetails}
        onRegistrationChange={handleRegistrationChange}
        onCoverDateChange={handleCoverDateChange}
        minCoverStartDate={minCoverStartDate}
      />
    </ScrollView>

    {/* Existing cover verification modal */}
    {showVerificationScreen && existingCoverData?.hasExistingCover && (
      <VehicleVerificationScreen
        existingCoverData={existingCoverData}
        onClose={() => setShowVerificationScreen(false)}
        onAdjustDate={() => {
          // Date already updated via minCoverStartDate
          setShowVerificationScreen(false);
        }}
        onSubmitDebitNote={() => {
          // Handle debit note submission
          console.log("[DMVIC] Debit note submission requested");
          Alert.alert(
            "Debit Note Submission",
            "This feature will allow you to submit a debit note to the existing underwriter.",
            [{ text: "OK" }]
          );
        }}
      />
    )}
  </View>
);
```

**Acceptance Criteria:**

- ✅ DMVIC check triggers automatically when registration number is entered (min 6 chars)
- ✅ Inline loading indicator appears during API call
- ✅ Checkmark icon appears when no existing cover found
- ✅ VehicleVerificationScreen modal appears when existing cover found
- ✅ No navigation occurs until existing cover is resolved

---

#### Task 1.2: Modify `DynamicVehicleForm.js`

**File:** `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/VehicleDetails/DynamicVehicleForm.js`

**Changes:**

1. **Add new props:**

```javascript
const DynamicVehicleForm = ({
  selectedProduct,
  formData,
  onChange,
  onRegistrationChange, // NEW
  onCoverDateChange, // NEW
  minCoverStartDate, // NEW
}) => {
  // ... component logic
};
```

2. **Update registration field handler:**

```javascript
const renderRegistrationField = () => (
  <View style={styles.fieldContainer}>
    <Text style={styles.label}>Vehicle Registration Number *</Text>
    <TextInput
      style={styles.input}
      value={formData.registration_number || ""}
      onChangeText={(text) => {
        const upperText = text.toUpperCase();
        onChange({ ...formData, registration_number: upperText });

        // Trigger DMVIC check via callback
        if (onRegistrationChange) {
          onRegistrationChange(upperText);
        }
      }}
      placeholder="e.g., KAA123X"
      autoCapitalize="characters"
    />
  </View>
);
```

3. **Update cover start date picker with minDate:**

```javascript
const renderCoverStartDateField = () => {
  const minimumDate = minCoverStartDate
    ? new Date(minCoverStartDate)
    : new Date();

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>Cover Start Date *</Text>
      <DateTimePicker
        value={
          formData.cover_start_date
            ? new Date(formData.cover_start_date)
            : new Date()
        }
        mode="date"
        display="default"
        minimumDate={minimumDate}
        onChange={(event, selectedDate) => {
          if (event.type === "set" && selectedDate) {
            // Validate against minDate
            if (
              minCoverStartDate &&
              selectedDate < new Date(minCoverStartDate)
            ) {
              Alert.alert(
                "Invalid Date",
                `Cover start date must be on or after ${formatDate(
                  minCoverStartDate
                )} due to existing cover.`,
                [{ text: "OK" }]
              );
              return;
            }

            const isoDate = selectedDate.toISOString();
            onChange({ ...formData, cover_start_date: isoDate });

            // Trigger DMVIC check via callback
            if (onCoverDateChange) {
              onCoverDateChange(isoDate);
            }
          }
        }}
      />
      {minCoverStartDate && (
        <Text style={styles.helperText}>
          ⚠️ Minimum date: {formatDate(minCoverStartDate)} (existing cover
          expires{" "}
          {formatDate(
            new Date(minCoverStartDate).setDate(
              new Date(minCoverStartDate).getDate() - 1
            )
          )}
          )
        </Text>
      )}
    </View>
  );
};
```

**Acceptance Criteria:**

- ✅ Registration field triggers `onRegistrationChange` callback
- ✅ Cover date picker triggers `onCoverDateChange` callback
- ✅ Date picker enforces `minCoverStartDate` constraint
- ✅ Helper text displays when `minCoverStartDate` is set
- ✅ Alert shown if user attempts to select date before minimum

---

#### Task 1.3: Modify `MotorInsuranceContainer.js`

**File:** `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceContainer.js`

**Changes:**

1. **Remove Step 4 (KYC) DMVIC check:**

```javascript
// REMOVE THIS USEEFFECT:
useEffect(() => {
  if (currentStep === 3) {
    // KYC step
    checkForExistingCover();
  }
}, [currentStep, registrationNumber]);
```

2. **Update `goNext` function with navigation guard:**

```javascript
const goNext = useCallback(() => {
  // Guard: Prevent navigation if existing cover drawer is open
  if (showVerificationScreen && existingCoverData?.hasExistingCover) {
    Alert.alert(
      "Existing Cover Detected",
      "Please resolve the existing cover conflict (adjust date or submit debit note) before proceeding to the next step.",
      [
        {
          text: "OK",
          onPress: () => {
            // Optional: Scroll to verification drawer
            console.log("[Navigation] Blocked: Existing cover not resolved");
          },
        },
      ]
    );
    return;
  }

  // Normal navigation
  if (currentStep < steps.length - 1) {
    setCurrentStep(currentStep + 1);
    console.log(`[Navigation] Moving to step ${currentStep + 1}`);
  }
}, [currentStep, showVerificationScreen, existingCoverData, steps.length]);
```

3. **Simplify drawer logic (no more loading drawer for DMVIC):**

```javascript
// REMOVE drawer for DMVIC loading - now inline in PolicyDetailsStep
// Keep only drawers for underwriter comparison, payment processing, etc.

{verificationStatus === 'checking' && (
  // ❌ REMOVE THIS - moved to inline indicator in PolicyDetailsStep
)}
```

**Acceptance Criteria:**

- ✅ Step 4 (KYC) no longer triggers DMVIC check
- ✅ Navigation blocked if existing cover modal is open
- ✅ Alert shown to user explaining why navigation is blocked
- ✅ Drawer logic simplified (no DMVIC loading drawer)

---

### Phase 2: Backend - Optimize DMVIC Endpoint

**Timeline:** Week 1 (2 working days, parallel with frontend)

#### Task 2.1: Review and Enhance `POST /api/insurance/dmvic/search-vehicle/`

**File:** `insurance-app/app/views/dmvic_views.py`

**Current Implementation Review:**

According to `DMVIC_BACKEND_VERIFICATION.md`, the endpoint already implements:

- ✅ 24-hour caching of DMVIC search results
- ✅ Validation of registration number format
- ✅ Integration with external DMVIC API
- ✅ Error handling for network failures

**Enhancements Needed:**

1. **Add response metadata for frontend caching:**

```python
# dmvic_views.py
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def search_vehicle(request):
    # ... existing validation logic

    # Check database cache first (24h TTL)
    cache_entry = DMVICVehicleSearch.objects.filter(
        registration_number=registration_number,
        created_at__gte=timezone.now() - timedelta(hours=24)
    ).order_by('-created_at').first()

    if cache_entry:
        logger.info(f"[DMVIC] Cache hit for {registration_number}")
        return Response({
            'success': True,
            'cached': True,  # NEW: Inform frontend this is cached
            'cache_timestamp': cache_entry.created_at.isoformat(),  # NEW
            'has_existing_cover': cache_entry.has_existing_cover,
            'existing_cover_expiry_date': cache_entry.existing_cover_expiry_date,
            'existing_policy_number': cache_entry.existing_policy_number,
            'existing_underwriter': cache_entry.existing_underwriter,
        })

    # ... make external DMVIC API call
    # ... save to database

    return Response({
        'success': True,
        'cached': False,  # NEW: Fresh API result
        'cache_timestamp': timezone.now().isoformat(),  # NEW
        # ... rest of response
    })
```

2. **Add endpoint health check:**

```python
# dmvic_views.py
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dmvic_health_check(request):
    """Check DMVIC API connectivity and cache status."""
    try:
        # Test DMVIC API connectivity
        dmvic_service = DMVICService()
        status = dmvic_service.health_check()

        # Get cache statistics
        cache_count = DMVICVehicleSearch.objects.filter(
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).count()

        return Response({
            'dmvic_api_status': status,
            'cache_entries_24h': cache_count,
            'cache_ttl_hours': 24,
        })
    except Exception as e:
        return Response({
            'error': str(e),
            'dmvic_api_status': 'unavailable',
        }, status=503)
```

3. **Add URL pattern:**

```python
# dmvic_urls.py
urlpatterns = [
    path('search-vehicle/', views.search_vehicle, name='dmvic-search-vehicle'),
    path('health/', views.dmvic_health_check, name='dmvic-health'),  # NEW
    # ... other endpoints
]
```

**Acceptance Criteria:**

- ✅ Response includes `cached` and `cache_timestamp` fields
- ✅ Health check endpoint returns API connectivity status
- ✅ Backend logs distinguish between cache hits and fresh API calls
- ✅ 24-hour cache TTL confirmed and documented

---

### Phase 3: Frontend - Enforce minDate and Refine UX

**Timeline:** Week 2 (3 working days)

#### Task 3.1: Enhance `VehicleVerificationScreen.js`

**File:** `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/VehicleVerificationScreen.js`

**Changes:**

1. **Update "Adjust Start Date" handler:**

```javascript
const VehicleVerificationScreen = ({
  existingCoverData,
  onClose,
  onAdjustDate,
  onSubmitDebitNote,
}) => {
  const { updateVehicleDetails, setMinCoverStartDate } = useMotorInsurance();

  const handleAdjustDate = () => {
    const expiryDate = new Date(existingCoverData.expiryDate);
    const minDate = new Date(expiryDate);
    minDate.setDate(minDate.getDate() + 1); // Next day after expiry

    // Update cover_start_date in context
    updateVehicleDetails({
      cover_start_date: minDate.toISOString(),
    });

    // Set minDate constraint
    setMinCoverStartDate(minDate.toISOString());

    // Close modal
    onClose();

    // Show confirmation
    Alert.alert(
      "Date Updated",
      `Cover start date has been set to ${formatDate(
        minDate
      )} (day after existing cover expires).`,
      [{ text: "OK" }]
    );
  };

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Icon name="warning" size={48} color="#FF9800" />
            <Text style={styles.title}>Existing Cover Detected</Text>
          </View>

          {/* Existing cover details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.label}>Policy Number:</Text>
            <Text style={styles.value}>{existingCoverData.policyNumber}</Text>

            <Text style={styles.label}>Underwriter:</Text>
            <Text style={styles.value}>{existingCoverData.underwriter}</Text>

            <Text style={styles.label}>Cover Expires On:</Text>
            <Text style={styles.value}>
              {formatDate(existingCoverData.expiryDate)}
            </Text>
          </View>

          {/* Explanation */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ⚠️ According to DMVIC regulations, you cannot issue a new policy
              while existing cover is active.
            </Text>
            <Text style={styles.infoText}>Please choose an option below:</Text>
          </View>

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleAdjustDate}
            >
              <Icon name="calendar" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Adjust Start Date</Text>
              <Text style={styles.buttonSubtext}>
                (Set to{" "}
                {formatDate(
                  new Date(
                    new Date(existingCoverData.expiryDate).setDate(
                      new Date(existingCoverData.expiryDate).getDate() + 1
                    )
                  )
                )}
                )
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {
                onClose();
                onSubmitDebitNote();
              }}
            >
              <Icon name="document-text" size={20} color="#646767" />
              <Text style={[styles.buttonText, styles.secondaryText]}>
                Submit Debit Note
              </Text>
              <Text style={[styles.buttonSubtext, styles.secondaryText]}>
                (Transfer from existing underwriter)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#646767" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
```

**Acceptance Criteria:**

- ✅ "Adjust Start Date" button updates `cover_start_date` to expiry + 1 day
- ✅ `minCoverStartDate` constraint set in context
- ✅ Modal closes after adjustment
- ✅ Confirmation alert shown to user
- ✅ UI clearly explains DMVIC regulations

---

#### Task 3.2: Update `MotorInsuranceContext.js`

**File:** `frontend/contexts/MotorInsuranceContext.js`

**Changes:**

1. **Add DMVIC cache state and actions:**

```javascript
const initialState = {
  // ... existing state
  dmvicCache: new Map(), // { regNumber: { result, timestamp } }
  dmvicCacheTTL: 30 * 60 * 1000, // 30 minutes
  minCoverStartDate: null, // ISO string or null
  existingCoverData: null, // { hasExistingCover, expiryDate, policyNumber, underwriter }
  showVerificationScreen: false,
};

function reducer(state, action) {
  switch (action.type) {
    // ... existing cases

    case "SET_EXISTING_COVER_DATA":
      return {
        ...state,
        existingCoverData: action.payload,
      };

    case "SET_MIN_COVER_START_DATE":
      return {
        ...state,
        minCoverStartDate: action.payload,
      };

    case "SET_SHOW_VERIFICATION_SCREEN":
      return {
        ...state,
        showVerificationScreen: action.payload,
      };

    case "CACHE_DMVIC_RESULT":
      const newCache = new Map(state.dmvicCache);
      newCache.set(action.payload.regNumber, {
        result: action.payload.result,
        timestamp: Date.now(),
      });
      return {
        ...state,
        dmvicCache: newCache,
      };

    case "CLEAR_DMVIC_CACHE":
      return {
        ...state,
        dmvicCache: new Map(),
      };

    default:
      return state;
  }
}
```

2. **Add context actions:**

```javascript
const value = {
  // ... existing values

  // DMVIC-related state
  existingCoverData: state.existingCoverData,
  minCoverStartDate: state.minCoverStartDate,
  showVerificationScreen: state.showVerificationScreen,

  // DMVIC actions
  setExistingCoverData: useCallback((data) => {
    dispatch({ type: "SET_EXISTING_COVER_DATA", payload: data });
  }, []),

  setMinCoverStartDate: useCallback((date) => {
    dispatch({ type: "SET_MIN_COVER_START_DATE", payload: date });
  }, []),

  setShowVerificationScreen: useCallback((show) => {
    dispatch({ type: "SET_SHOW_VERIFICATION_SCREEN", payload: show });
  }, []),

  getCachedDMVICResult: useCallback(
    (regNumber) => {
      const cached = state.dmvicCache.get(regNumber);
      if (cached && Date.now() - cached.timestamp < state.dmvicCacheTTL) {
        return cached.result;
      }
      return null;
    },
    [state.dmvicCache, state.dmvicCacheTTL]
  ),

  cacheDMVICResult: useCallback((regNumber, result) => {
    dispatch({
      type: "CACHE_DMVIC_RESULT",
      payload: { regNumber, result },
    });
  }, []),

  clearDMVICCache: useCallback(() => {
    dispatch({ type: "CLEAR_DMVIC_CACHE" });
  }, []),
};
```

**Acceptance Criteria:**

- ✅ Context stores DMVIC cache with TTL
- ✅ `getCachedDMVICResult` checks TTL before returning
- ✅ `minCoverStartDate` accessible across all components
- ✅ All actions properly memoized with `useCallback`

---

#### Task 3.3: Add Styling for Inline Indicators

**File:** `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/VehicleDetails/PolicyDetailsStep.js`

**Add styles:**

```javascript
const styles = StyleSheet.create({
  // ... existing styles

  registrationFieldContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: "Poppins-Regular",
  },
  inlineLoader: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  checkIcon: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  errorIcon: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  helperText: {
    fontSize: 12,
    color: "#FF9800",
    fontFamily: "Poppins-Regular",
    marginTop: 4,
  },
});
```

**Acceptance Criteria:**

- ✅ Inline loader appears inside input field (right side)
- ✅ Checkmark icon appears when no existing cover
- ✅ Error icon appears on API failure
- ✅ Helper text styled with warning color

---

### Phase 4: Testing & Validation

**Timeline:** Week 2 (2 working days)

#### Task 4.1: Unit Testing

**Create test file:** `frontend/__tests__/MotorInsurance/PolicyDetailsStep.test.js`

**Test cases:**

```javascript
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import PolicyDetailsStep from "../../screens/quotations/Motor 2/MotorInsuranceFlow/VehicleDetails/PolicyDetailsStep";
import { MotorInsuranceProvider } from "../../contexts/MotorInsuranceContext";
import djangoAPI from "../../services/DjangoAPIService";

jest.mock("../../services/DjangoAPIService");

describe("PolicyDetailsStep - DMVIC Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should trigger DMVIC check after registration input debounce", async () => {
    djangoAPI.searchVehicle.mockResolvedValue({
      has_existing_cover: false,
    });

    const { getByPlaceholderText } = render(
      <MotorInsuranceProvider>
        <PolicyDetailsStep />
      </MotorInsuranceProvider>
    );

    const input = getByPlaceholderText("Enter Registration Number");
    fireEvent.changeText(input, "KAA123X");

    // Wait for debounce (500ms)
    await waitFor(
      () => {
        expect(djangoAPI.searchVehicle).toHaveBeenCalledWith({
          registration_number: "KAA123X",
          proposed_cover_start_date: expect.any(String),
        });
      },
      { timeout: 1000 }
    );
  });

  it("should show verification modal when existing cover found", async () => {
    djangoAPI.searchVehicle.mockResolvedValue({
      has_existing_cover: true,
      existing_cover_expiry_date: "2025-12-15",
      existing_policy_number: "POL-2025-001",
      existing_underwriter: "Test Insurance Co.",
    });

    const { getByPlaceholderText, getByText } = render(
      <MotorInsuranceProvider>
        <PolicyDetailsStep />
      </MotorInsuranceProvider>
    );

    const input = getByPlaceholderText("Enter Registration Number");
    fireEvent.changeText(input, "KAA123X");

    await waitFor(() => {
      expect(getByText("Existing Cover Detected")).toBeTruthy();
    });
  });

  it("should use cached result on second check", async () => {
    const mockResult = { has_existing_cover: false };
    djangoAPI.searchVehicle.mockResolvedValue(mockResult);

    const { getByPlaceholderText, rerender } = render(
      <MotorInsuranceProvider>
        <PolicyDetailsStep />
      </MotorInsuranceProvider>
    );

    // First check
    const input = getByPlaceholderText("Enter Registration Number");
    fireEvent.changeText(input, "KAA123X");

    await waitFor(() => {
      expect(djangoAPI.searchVehicle).toHaveBeenCalledTimes(1);
    });

    // Clear mock
    djangoAPI.searchVehicle.mockClear();

    // Second check (should use cache)
    fireEvent.changeText(input, "KAA456Y");
    fireEvent.changeText(input, "KAA123X"); // Same reg number

    await waitFor(
      () => {
        // Should NOT call API again (cache hit)
        expect(djangoAPI.searchVehicle).not.toHaveBeenCalled();
      },
      { timeout: 1000 }
    );
  });

  it("should enforce minDate when existing cover found", async () => {
    // Test implementation for date enforcement
    // ... similar pattern
  });
});
```

**Acceptance Criteria:**

- ✅ All test cases pass
- ✅ Code coverage > 80% for modified files
- ✅ Edge cases covered (network errors, empty responses, etc.)

---

#### Task 4.2: Integration Testing

**Test scenarios:**

1. **Happy Path - No Existing Cover:**

   - Enter registration number → Inline loader appears → Checkmark appears → Proceed to KYC

2. **Existing Cover - Adjust Date:**

   - Enter registration → Modal appears → Click "Adjust Start Date" → Date updated → Modal closes → Proceed to KYC

3. **Existing Cover - Debit Note:**

   - Enter registration → Modal appears → Click "Submit Debit Note" → Navigate to debit note flow

4. **Cache Validation:**

   - Enter registration → API called → Navigate back → Enter same registration → Cache used (no API call)

5. **Date Enforcement:**

   - Existing cover expires 2025-12-15 → Attempt to select 2025-12-10 → Alert shown → Select 2025-12-16 → Accepted

6. **Network Error Handling:**
   - Enter registration → API fails → Error icon appears → Retry button works

**Acceptance Criteria:**

- ✅ All integration scenarios pass on Android emulator
- ✅ All integration scenarios pass on iOS simulator
- ✅ Network error handling verified with mock API failures

---

#### Task 4.3: Performance Testing

**Metrics to measure:**

1. **API Call Reduction:**

   - Baseline: Count API calls in current implementation (expected: 2-3 per form fill)
   - Target: Max 1 API call per unique registration number

2. **Debounce Effectiveness:**

   - Measure API calls while user types "KAA123X" rapidly
   - Expected: Only 1 call after 500ms of typing pause

3. **Cache Hit Rate:**

   - Test with 10 unique registration numbers
   - Navigate back/forth 5 times each
   - Expected cache hit rate: >80%

4. **Time to First Interaction:**
   - Measure time from registration input to DMVIC result
   - Target: <2 seconds (including debounce)

**Tools:**

- React DevTools Profiler
- Network tab in Chrome DevTools (React Native Debugger)
- Custom logging with `console.time/console.timeEnd`

**Acceptance Criteria:**

- ✅ API call reduction: >50% compared to baseline
- ✅ Cache hit rate: >80%
- ✅ Time to first interaction: <2 seconds

---

## 4. Expected Outcomes

### 4.1. User Experience Improvements

| Aspect                       | Before                                   | After                               | Improvement                |
| ---------------------------- | ---------------------------------------- | ----------------------------------- | -------------------------- |
| **Navigation Flow**          | Step 3 → Step 4 → Modal → Back to Step 3 | Step 3 → Resolve in Step 3 → Step 4 | 50% fewer navigation steps |
| **Loading Feedback**         | Full-screen drawer (abrupt)              | Inline indicator (subtle)           | Less disruptive            |
| **Existing Cover Detection** | After navigating to Step 4               | Immediately in Step 3               | Proactive validation       |
| **Date Adjustment**          | Manual, no enforcement                   | Auto-updated with minDate           | Error-proof                |
| **API Calls**                | 2-3+ per form fill                       | 1 per unique registration           | 60-70% reduction           |

### 4.2. Technical Improvements

1. **Caching Strategy:**

   - Frontend: 30-minute TTL in MotorInsuranceContext
   - Backend: 24-hour TTL in PostgreSQL
   - Estimated API call reduction: **70%**

2. **Code Maintainability:**

   - Centralized DMVIC logic in `PolicyDetailsStep.js`
   - Clear separation of concerns (API service, context, UI components)
   - Reduced complexity in `MotorInsuranceContainer.js`

3. **Performance Metrics:**
   - Debouncing reduces API calls during typing by **90%**
   - Cache hit rate expected: **85%** for typical user sessions
   - Page load time improvement: **-40%** (no Step 4 API wait)

### 4.3. Compliance & Data Integrity

1. **DMVIC Regulation Compliance:**

   - ✅ Proactive detection of existing cover
   - ✅ Enforced minDate prevents policy overlaps
   - ✅ Clear user guidance on debit note process

2. **Data Validation:**
   - ✅ Registration number validated before API call (min 6 chars)
   - ✅ Cover start date constrained by existing policy expiry
   - ✅ DMVIC response cached to ensure consistency

---

## 5. Rollback Plan

### Trigger Conditions

Rollback if any of the following occur:

1. **Critical Bug:** DMVIC check blocks legitimate policy creation
2. **Performance Degradation:** API response time >5 seconds (95th percentile)
3. **Cache Corruption:** Stale data causes policy validation failures
4. **User Complaints:** >10% of agents report issues in first week

### Rollback Steps

1. **Immediate Mitigation:**

   ```bash
   # Revert frontend changes
   git revert <commit-hash-phase1>
   git revert <commit-hash-phase2>
   git revert <commit-hash-phase3>

   # Rebuild and deploy
   npm run build
   expo publish --release-channel production
   ```

2. **Backend Rollback (if needed):**

   ```bash
   # Revert backend changes
   git revert <commit-hash-backend>

   # Run migrations backward
   python manage.py migrate app <previous-migration-number>

   # Restart services
   sudo systemctl restart gunicorn
   ```

3. **Clear Frontend Cache:**

   ```javascript
   // Emergency cache clear
   AsyncStorage.removeItem("dmvic_cache");
   ```

4. **Communication:**
   - Notify all agents via in-app banner: "DMVIC verification temporarily disabled. Proceed as normal."
   - Email support team with rollback status and timeline for fix.

---

## 6. Monitoring & Success Metrics

### Key Performance Indicators (KPIs)

| Metric                      | Baseline       | Target     | Measurement Method                                  |
| --------------------------- | -------------- | ---------- | --------------------------------------------------- |
| **API Call Reduction**      | 100% (current) | 30%        | Backend API logs (count POST /dmvic/search-vehicle) |
| **Cache Hit Rate**          | 0%             | 85%        | Frontend logging (cache hits / total checks)        |
| **Time to Complete Step 3** | 45 seconds     | 30 seconds | User analytics (step start → step complete)         |
| **DMVIC Error Rate**        | 5%             | <2%        | Backend error logs (400/500 responses)              |
| **User Satisfaction**       | N/A            | >4.5/5     | Agent feedback survey (post-release)                |

### Monitoring Dashboard

**Frontend Metrics (React Native Analytics):**

```javascript
// Log DMVIC check events
Analytics.logEvent("dmvic_check_initiated", {
  registration_number: regNumber,
  cached: isCached,
});

Analytics.logEvent("dmvic_check_completed", {
  registration_number: regNumber,
  has_existing_cover: result.has_existing_cover,
  response_time_ms: responseTime,
});
```

**Backend Metrics (Django Logging):**

```python
# app/views/dmvic_views.py
logger.info(f"[DMVIC] Search request: {registration_number}, cached={is_cached}")
logger.info(f"[DMVIC] Response time: {response_time_ms}ms")

# Track in application metrics
metrics.increment('dmvic.search_requests.total')
metrics.increment(f'dmvic.search_requests.{"cached" if is_cached else "fresh"}')
```

**CloudWatch Alarms (AWS):**

- API response time >3 seconds (95th percentile) for 5 minutes → Alert dev team
- Error rate >5% for 10 minutes → Alert dev team
- DMVIC API downtime detected → Fallback to manual verification

---

## 7. Future Enhancements

### Phase 2 Improvements (Post-Release)

1. **Predictive Caching:**

   - Pre-fetch DMVIC data for agents' recent quotations
   - Use machine learning to predict which registrations will be queried next

2. **Offline Mode:**

   - Store last 50 DMVIC checks in AsyncStorage
   - Allow agents to work offline, sync when online

3. **Bulk DMVIC Checks:**

   - Agent uploads CSV of registration numbers
   - Backend processes batch DMVIC checks overnight
   - Results cached for 7 days

4. **Advanced Date Suggestion:**

   - If existing cover expires in >30 days, suggest renewal instead of new policy
   - Show comparison: "Renew existing policy" vs. "Create new policy"

5. **Debit Note Automation:**
   - Integrate with underwriter APIs for automated debit note submission
   - Track debit note status in real-time
   - Auto-update policy start date when debit note approved

---

## 8. Appendix

### A. API Endpoint Specification

**Endpoint:** `POST /api/insurance/dmvic/search-vehicle/`

**Request:**

```json
{
  "registration_number": "KAA123X",
  "proposed_cover_start_date": "2025-11-10T00:00:00Z"
}
```

**Response (No Existing Cover):**

```json
{
  "success": true,
  "cached": false,
  "cache_timestamp": "2025-11-05T10:30:00Z",
  "has_existing_cover": false,
  "message": "No existing cover found for vehicle KAA123X"
}
```

**Response (Existing Cover Found):**

```json
{
  "success": true,
  "cached": true,
  "cache_timestamp": "2025-11-05T09:15:00Z",
  "has_existing_cover": true,
  "existing_cover_expiry_date": "2025-12-15",
  "existing_policy_number": "POL-2025-001",
  "existing_underwriter": "Jubilee Insurance",
  "days_until_expiry": 40,
  "message": "Existing cover found. New policy start date must be after 2025-12-15."
}
```

**Error Response:**

```json
{
  "success": false,
  "error": "DMVIC API unavailable",
  "error_code": "DMVIC_API_DOWN",
  "fallback_message": "Please verify manually or try again later."
}
```

### B. Cache TTL Configuration

| Cache Layer                          | TTL        | Rationale                                                   |
| ------------------------------------ | ---------- | ----------------------------------------------------------- |
| **Frontend (MotorInsuranceContext)** | 30 minutes | Session-based, prevents redundant calls during form editing |
| **Backend (PostgreSQL)**             | 24 hours   | DMVIC data changes infrequently, reduces external API load  |
| **DMVIC External API**               | N/A        | Real-time data, no caching on their side                    |

### C. Debounce Configuration

```javascript
// Recommended debounce delays
const DEBOUNCE_CONFIG = {
  registrationInput: 500, // 500ms - Balance responsiveness and API load
  coverDateInput: 500, // 500ms - Same as registration
  nameInput: 300, // 300ms - No API call, just form validation
};
```

### D. Related Documentation

- `DMVIC_BACKEND_IMPLEMENTATION_COMPLETE.md` - Backend DMVIC integration details
- `DMVIC_BACKEND_VERIFICATION.md` - DMVIC endpoint testing and validation
- `PataBima_Motor2_Flow_Simulation_and_Improvements.md` - Overall Motor 2 flow analysis
- `frontend/contexts/MotorInsuranceContext.js` - State management implementation
- `frontend/screens/Motor 2/VehicleDetails/PolicyDetailsStep.js` - Primary implementation file

---

## 9. Sign-Off & Approval

| Role                | Name                           | Approval Date      | Signature          |
| ------------------- | ------------------------------ | ------------------ | ------------------ |
| **Product Owner**   | **\*\*\*\***\_\_\_**\*\*\*\*** | \***\*\_\_\_\*\*** | \***\*\_\_\_\*\*** |
| **Lead Developer**  | **\*\*\*\***\_\_\_**\*\*\*\*** | \***\*\_\_\_\*\*** | \***\*\_\_\_\*\*** |
| **QA Lead**         | **\*\*\*\***\_\_\_**\*\*\*\*** | \***\*\_\_\_\*\*** | \***\*\_\_\_\*\*** |
| **DevOps Engineer** | **\*\*\*\***\_\_\_**\*\*\*\*** | \***\*\_\_\_\*\*** | \***\*\_\_\_\*\*** |

---

**Document Status:** Draft for Review  
**Next Review Date:** After Phase 1 completion  
**Last Updated:** November 5, 2025

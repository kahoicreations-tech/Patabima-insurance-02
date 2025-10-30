# Motor 2 Insurance Flow - Flawless Implementation Guide

**Project**: PataBima Insurance App  
**Module**: Motor 2 Insurance Flow  
**Date**: October 13, 2025  
**Version**: 2.0 - Comprehensive Enhancement

---

## 📋 Table of Contents

1. [Overview & Objectives](#overview--objectives)
2. [Critical Requirements & Business Rules](#critical-requirements--business-rules)
3. [Architecture & Design Patterns](#architecture--design-patterns)
4. [Implementation Phases](#implementation-phases)
5. [Detailed Component Specifications](#detailed-component-specifications)
6. [Testing & Validation](#testing--validation)
7. [Deployment Checklist](#deployment-checklist)

---

## 🎯 Overview & Objectives

### Goal
Transform Motor 2 insurance flow into a production-ready, enterprise-grade system with:
- **Zero API waste** through intelligent caching
- **Zero data loss** with auto-save persistence
- **Flawless UX** with smart form handling
- **100% validation coverage** for all business rules
- **Professional UI/UX** matching industry standards

### Success Metrics
- 90% reduction in category/subcategory API calls
- 70% reduction in form re-renders
- < 2 second form loading time
- 100% field validation coverage
- Zero user data loss incidents

---

## 🔐 Critical Requirements & Business Rules

### 1. Vehicle Details Field Population Logic

#### **TOR (Time on Risk) Products**
```yaml
Fields Required:
  - financialInterest: User input (Yes/No)
  - identificationType: User input (Vehicle Registration/Chassis Number)
  - registrationNumber: Auto-populated from logbook OR user input
  - cover_start_date: User input (default: today)
  - make: Auto-populated from logbook (NOT user editable)
  - model: Auto-populated from logbook (NOT user editable)
  - year: Auto-populated from logbook (NOT user editable)
  
Business Rules:
  - Vehicle details (make/model/year) MUST be populated from logbook document
  - If logbook not uploaded, show placeholder text: "Upload logbook to auto-fill"
  - Fields should be read-only once populated from document
  - User can manually override ONLY if document extraction fails
  - Show "✓ Auto-filled from logbook" indicator when populated
```

#### **Third Party Products**
```yaml
Fields Required:
  - financialInterest: User input (Yes/No)
  - identificationType: User input (Vehicle Registration/Chassis Number)
  - registrationNumber: Auto-populated from logbook OR user input
  - cover_start_date: User input (default: today)
  - make: Auto-populated from logbook (NOT user editable)
  - model: Auto-populated from logbook (NOT user editable)
  - year: Auto-populated from logbook (NOT user editable)
  
Business Rules:
  - Same as TOR - vehicle details MUST come from logbook
  - Consistent behavior between TOR and Third Party
  - No sum_insured field for Third Party
```

#### **Comprehensive Products**
```yaml
Fields Required:
  - financialInterest: User input (Yes/No)
  - identificationType: User input (Vehicle Registration/Chassis Number)
  - registrationNumber: Auto-populated from logbook OR user input
  - cover_start_date: User input (default: today)
  - make: User input (manual entry)
  - model: User input (manual entry)
  - year: User input (manual entry)
  - sum_insured: User input (required)
  - windscreen_value: User input (optional)
  - radio_cassette_value: User input (optional)
  - vehicle_accessories_value: User input (optional)
  
Business Rules:
  - Vehicle details CAN be auto-filled from logbook as suggestion
  - User MUST manually confirm or edit all vehicle details
  - User can override logbook data for comprehensive coverage
  - Sum insured is independent of logbook data
  - All fields fully editable
```

### 2. Document Extraction & Auto-Fill Priority

```yaml
Extraction Priority:
  1. Logbook (Primary source for vehicle details)
     - registrationNumber → vehicleDetails.registrationNumber
     - make → vehicleDetails.make
     - model → vehicleDetails.model
     - year → vehicleDetails.year
     - chassisNumber → vehicleDetails.chassisNumber
     - engineNumber → vehicleDetails.engineNumber
     
  2. ID Copy (Client identification)
     - idNumber → clientDetails.idNumber
     - fullName → clientDetails.fullName
     - Split name into firstName/lastName
     
  3. KRA PIN Certificate (Tax identification)
     - kraPin → clientDetails.kraPin
     - name → clientDetails.fullName (fallback)

Field Locking Rules:
  - TOR/Third Party: Lock make/model/year after logbook extraction
  - Comprehensive: Pre-fill but keep editable
  - Show visual indicator: "🔒 Auto-filled from logbook" or "✏️ Editable"
```

### 3. Underwriter Comparison & Filtering

#### **Price Filtering**
```yaml
Filter Options:
  - Sort by Price: Lowest to Highest (default)
  - Sort by Price: Highest to Lowest
  - Sort by Underwriter Name (A-Z)
  
Display Requirements:
  - Show base premium prominently
  - Show total premium (with levies)
  - Show savings vs highest option
  - Highlight recommended underwriter
```

#### **Net vs Gross Premium Display**
```yaml
Admin Configuration:
  - Admin sets per underwriter: display_mode = "NET" or "GROSS"
  - NET: Show base premium only (before levies)
  - GROSS: Show total premium (after levies)
  
Backend Model Addition:
  class InsuranceProvider(models.Model):
      # Existing fields...
      display_mode = models.CharField(
          max_length=10,
          choices=[('NET', 'Net Premium'), ('GROSS', 'Gross Premium')],
          default='GROSS',
          help_text='How to display premiums for this underwriter'
      )
      
Display Logic:
  if underwriter.display_mode == 'NET':
      show: "KSh 10,000 (Net)" + small text: "+ levies"
  else:
      show: "KSh 10,505 (Total)" + small text: "incl. levies"
```

### 4. TOR Product Positioning

```yaml
Sorting Rules:
  Backend (MotorSubcategoryViewSet):
    - TOR products: position = 1
    - Third Party: position = 2
    - Third Party Extendible: position = 3
    - Comprehensive: position = 4
    - Others: position = 5
    
  Frontend (MotorInsuranceScreen):
    - Apply same sorting on fallback data
    - Ensure consistent ordering in all category lists
    
Display Order (Example - Private Category):
  1. ✓ TOR For Private (FIXED pricing)
  2. Private Third-Party (THIRD_PARTY)
  3. Private Third-Party Extendible (THIRD_PARTY)
  4. Private Motorcycle Third-Party (THIRD_PARTY)
  5. Private Comprehensive (COMPREHENSIVE)
```

---

## 🏗️ Architecture & Design Patterns

### State Management Architecture

```
MotorInsuranceContext (Root)
├── CategoryCache (Singleton Service)
│   ├── AsyncStorage persistence
│   ├── 7-day TTL
│   └── Background refresh
├── FormState (Reducer Pattern)
│   ├── vehicleDetails
│   ├── pricingData
│   ├── clientDetails
│   ├── selectedUnderwriter
│   └── documents
├── ValidationEngine
│   ├── Field-level validation
│   ├── Step-level validation
│   └── Form-level validation
└── DraftManager
    ├── Auto-save every 2 seconds
    ├── Draft recovery
    └── Multi-draft support
```

### Data Flow

```
Document Upload → S3 → Lambda/Textract → Backend Canonicalization
                                              ↓
                                        Form Auto-Fill
                                              ↓
┌─────────────────────────────────────────────────────────────┐
│ TOR/Third Party: Lock fields (make/model/year)              │
│ Comprehensive: Pre-fill but keep editable                   │
└─────────────────────────────────────────────────────────────┘
                                              ↓
                                    Underwriter Comparison
                                              ↓
                                    Display NET or GROSS
                                              ↓
                                    User Selection → Payment
```

---

## 📦 Implementation Phases

### Phase 1: Foundation (Week 1 - Days 1-3)

#### Day 1: Category Caching System
**File**: `frontend/services/MotorCategoryCache.js`

```javascript
/**
 * Implementation Requirements:
 * 1. AsyncStorage for persistence
 * 2. 7-day TTL (604800000 ms)
 * 3. Background refresh on app startup
 * 4. Pre-fetch all subcategories for all categories
 * 5. Singleton pattern
 * 
 * Success Criteria:
 * - Categories load instantly on second launch
 * - API calls reduced by 90%
 * - Cache auto-refreshes when stale
 */

class MotorCategoryCache {
  constructor() {
    this.categories = null;
    this.subcategories = {};
    this.initialized = false;
    this.CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
  }

  // Methods to implement:
  // - async initialize()
  // - async loadFromStorage()
  // - async saveToStorage()
  // - async refreshCache()
  // - async getCategories(forceRefresh = false)
  // - async getSubcategories(categoryName, forceRefresh = false)
  // - async clearCache()
}
```

**Testing**:
```javascript
// Test 1: First load should fetch from API
// Test 2: Second load should use cache
// Test 3: Cache should refresh after 7 days
// Test 4: Force refresh should work
```

#### Day 2: State Management Context
**File**: `frontend/contexts/MotorInsuranceContext.js`

```javascript
/**
 * Implementation Requirements:
 * 1. Use useReducer for complex state
 * 2. Separate actions for each state update
 * 3. Memoized action callbacks with useCallback
 * 4. Type-safe action types (constants)
 * 
 * State Structure:
 * {
 *   currentStep: 0,
 *   category: null,
 *   subcategory: null,
 *   vehicleDetails: {
 *     financialInterest: '',
 *     identificationType: 'Vehicle Registration',
 *     registrationNumber: '',
 *     cover_start_date: today,
 *     make: '',
 *     model: '',
 *     year: '',
 *     isAutoFilled: false,
 *     autoFillSource: null
 *   },
 *   pricingData: {...},
 *   selectedUnderwriter: null,
 *   clientDetails: {...},
 *   documents: [],
 *   errors: {}
 * }
 */

const ACTIONS = {
  SET_CATEGORY: 'SET_CATEGORY',
  SET_SUBCATEGORY: 'SET_SUBCATEGORY',
  SET_VEHICLE_DETAILS: 'SET_VEHICLE_DETAILS',
  SET_PRICING_DATA: 'SET_PRICING_DATA',
  SET_UNDERWRITER: 'SET_UNDERWRITER',
  SET_CLIENT_DETAILS: 'SET_CLIENT_DETAILS',
  SET_DOCUMENTS: 'SET_DOCUMENTS',
  SET_STEP: 'SET_STEP',
  SET_ERRORS: 'SET_ERRORS',
  RESET_FORM: 'RESET_FORM'
};
```

**Testing**:
```javascript
// Test 1: State updates correctly for each action
// Test 2: Reducer maintains immutability
// Test 3: Context provides values to children
// Test 4: Reset clears all state
```

#### Day 3: Form Validation Schema
**File**: `frontend/utils/motorInsuranceValidation.js`

```javascript
/**
 * Implementation Requirements:
 * 1. Centralized validation rules
 * 2. Field-level validation
 * 3. Step-level validation
 * 4. Form-level validation
 * 5. Dynamic rules based on coverage type
 * 
 * Key Validations:
 * - registrationNumber: KAA 123A format
 * - chassisNumber: 11-17 alphanumeric
 * - cover_start_date: Not > 3 months future, not > 1 year past
 * - sum_insured: Min 100,000, Max 50,000,000
 * - email: Valid email format
 * - phone: Kenyan format (07XX, 01XX)
 * - kraPin: A123456789X format
 * - idNumber: 7-8 digits
 */

export const ValidationRules = {
  registrationNumber: {
    required: true,
    validate: (value, formData) => {
      // Implementation here
    }
  },
  // ... other fields
};

export function validateField(fieldName, value, formData) {}
export function validateForm(formData, fields) {}
export function validateStep(step, formData) {}
```

**Testing**:
```javascript
// Test 1: Each validation rule works correctly
// Test 2: Required fields validated properly
// Test 3: Dynamic validation based on coverage type
// Test 4: Error messages are user-friendly
```

---

### Phase 2: Core Features (Week 1 - Days 4-7)

#### Day 4: Debounced Validation Hook
**File**: `frontend/hooks/useDebounce.js`

```javascript
/**
 * Implementation Requirements:
 * 1. Generic debounce hook
 * 2. Configurable delay (default 500ms)
 * 3. Cleanup on unmount
 * 4. TypeScript compatible
 * 
 * Usage:
 * const debouncedValue = useDebounce(inputValue, 500);
 */

export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

export function useDebouncedCallback(callback, delay = 500) {
  // Implementation
}
```

**Integration Points**:
- DynamicVehicleForm input fields
- Underwriter comparison trigger
- Real-time validation

#### Day 5: Auto-Save Draft System
**File**: `frontend/hooks/useFormDraft.js`

```javascript
/**
 * Implementation Requirements:
 * 1. Auto-save to AsyncStorage every 2 seconds
 * 2. Draft recovery on app restart
 * 3. Multiple drafts with unique IDs
 * 4. Draft expiry (7 days)
 * 5. Draft metadata (timestamp, step, category)
 * 
 * Draft Structure:
 * {
 *   id: 'motor_draft_12345',
 *   savedAt: '2025-10-13T10:30:00Z',
 *   step: 2,
 *   category: 'Private',
 *   subcategory: 'Comprehensive',
 *   formData: {...}
 * }
 */

export function useFormDraft(draftId, formData) {
  const saveDraft = useCallback(async () => {
    // Auto-save implementation
  }, [draftId, formData]);
  
  const loadDraft = useCallback(async () => {
    // Load draft implementation
  }, [draftId]);
  
  const deleteDraft = useCallback(async () => {
    // Delete draft implementation
  }, [draftId]);
  
  // Auto-save on formData change
  useEffect(() => {
    const timeoutId = setTimeout(saveDraft, 2000);
    return () => clearTimeout(timeoutId);
  }, [formData, saveDraft]);
  
  return { saveDraft, loadDraft, deleteDraft };
}
```

**Testing**:
```javascript
// Test 1: Draft saves automatically after 2 seconds
// Test 2: Draft loads on app restart
// Test 3: Multiple drafts managed correctly
// Test 4: Expired drafts cleaned up
```

#### Day 6: API Retry Service
**File**: `frontend/services/ApiRetryService.js`

```javascript
/**
 * Implementation Requirements:
 * 1. Exponential backoff (1s, 2s, 4s)
 * 2. Max 3 retries
 * 3. Only retry retryable errors (5xx, timeouts, network)
 * 4. Don't retry 4xx errors
 * 5. Configurable per request
 * 
 * Retryable Errors:
 * - Network request failed
 * - Timeout
 * - 500, 502, 503, 504
 * - 429 (rate limit)
 */

class ApiRetryService {
  async retryWithBackoff(apiCall, options = {}) {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2
    } = options;
    
    // Implementation
  }
  
  isRetryableError(error) {
    // Check if error should trigger retry
  }
}
```

**Integration**:
- Wrap all DjangoAPIService calls
- Underwriter comparison API
- Category/subcategory fetch
- Policy submission

#### Day 7: Smart Underwriter Memoization
**File**: `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/VehicleDetails/DynamicVehicleForm.js`

```javascript
/**
 * Implementation Requirements:
 * 1. Memoize comparison trigger data
 * 2. Create comparison signature
 * 3. Prevent duplicate API calls
 * 4. Cache results per signature
 * 5. Debounce trigger by 1 second
 */

const comparisonKey = useMemo(() => {
  if (!selectedProduct) return null;
  
  return JSON.stringify({
    subcategory: selectedProduct.subcategory_code,
    category: selectedProduct.category,
    registration: formData.registrationNumber,
    sumInsured: formData.sum_insured,
    tonnage: formData.tonnage,
    capacity: formData.passengerCapacity,
    coverDate: formData.cover_start_date
  });
}, [/* dependencies */]);

useEffect(() => {
  if (!comparisonKey || !canCompareUnderwriters()) return;
  
  if (comparisonTriggerRef.current === comparisonKey) return;
  
  comparisonTriggerRef.current = comparisonKey;
  
  const timeoutId = setTimeout(() => {
    triggerUnderwriterComparison();
  }, 1000);
  
  return () => clearTimeout(timeoutId);
}, [comparisonKey]);
```

---

### Phase 3: Document Integration (Week 2 - Days 8-10)

#### Day 8: Enhanced Document Auto-Fill
**File**: `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceScreen.js`

```javascript
/**
 * Implementation Requirements:
 * 1. Map logbook data to vehicle fields
 * 2. Lock fields for TOR/Third Party after extraction
 * 3. Keep fields editable for Comprehensive
 * 4. Show visual indicators
 * 5. Handle extraction failures gracefully
 */

const handleDocumentExtracted = useCallback((documentType, extractedData) => {
  const coverageType = state.selectedSubcategory?.coverage_type?.toLowerCase();
  const isComprehensive = coverageType === 'comprehensive';
  const isTOROrThirdParty = ['tor', 'third_party', 'tpo'].includes(coverageType);
  
  switch (documentType) {
    case 'LOGBOOK':
      // Extract vehicle details
      const vehicleData = {
        registrationNumber: extractedData.registrationNumber || extractedData.registration_number,
        make: extractedData.make || extractedData.vehicle_make,
        model: extractedData.model || extractedData.vehicle_model,
        year: extractedData.year || extractedData.year_of_manufacture,
        chassisNumber: extractedData.chassisNumber || extractedData.chassis_number,
        engineNumber: extractedData.engineNumber || extractedData.engine_number,
        isAutoFilled: true,
        autoFillSource: 'logbook',
        isLocked: isTOROrThirdParty // Lock for TOR/Third Party only
      };
      
      actions.setVehicleDetails(vehicleData);
      
      // Show success message
      Alert.alert(
        'Document Processed',
        `Vehicle details ${isTOROrThirdParty ? 'locked' : 'pre-filled'} from logbook`,
        [{ text: 'OK' }]
      );
      break;
      
    case 'ID_CARD':
      // Extract client details
      break;
      
    case 'KRA_PIN':
      // Extract KRA PIN
      break;
  }
}, [state.selectedSubcategory, actions]);
```

**Visual Indicators**:
```javascript
// In DynamicVehicleForm.js
{vehicleDetails.isAutoFilled && vehicleDetails.isLocked && (
  <View style={styles.autoFillBadge}>
    <Text style={styles.autoFillText}>
      🔒 Auto-filled from logbook
    </Text>
  </View>
)}

{vehicleDetails.isAutoFilled && !vehicleDetails.isLocked && (
  <View style={styles.autoFillBadge}>
    <Text style={styles.autoFillText}>
      ✏️ Pre-filled from logbook (editable)
    </Text>
  </View>
)}
```

#### Day 9: Backend Document Mapping Enhancement
**File**: `insurance-app/app/views_docs.py`

```python
def _apply_canonical_to_form(quotation, canonical):
    """
    Apply canonicalized fields to quotation form_data
    Enhanced to handle TOR/Third Party locking logic
    """
    form_data = quotation.form_data or {}
    
    # Vehicle details from logbook
    if canonical.get('registration_number'):
        form_data['vehicle_registration'] = canonical['registration_number']
        form_data['registration'] = canonical['registration_number']
        form_data['registrationNumber'] = canonical['registration_number']
    
    if canonical.get('make'):
        form_data['vehicle_make'] = canonical['make']
        form_data['make'] = canonical['make']
    
    if canonical.get('model'):
        form_data['vehicle_model'] = canonical['model']
        form_data['model'] = canonical['model']
    
    if canonical.get('year_of_manufacture'):
        form_data['vehicle_year'] = canonical['year_of_manufacture']
        form_data['year'] = canonical['year_of_manufacture']
    
    if canonical.get('chassis_number'):
        form_data['chassis_number'] = canonical['chassis_number']
        form_data['chassisNumber'] = canonical['chassis_number']
    
    # Mark as auto-filled for frontend logic
    form_data['isAutoFilled'] = True
    form_data['autoFillSource'] = 'logbook'
    
    # Client details from ID
    if canonical.get('id_number'):
        form_data['owner_id_number'] = canonical['id_number']
        form_data['id_number'] = canonical['id_number']
        form_data['idNumber'] = canonical['id_number']
    
    # KRA PIN
    if canonical.get('kra_pin'):
        form_data['owner_kra_pin'] = canonical['kra_pin']
        form_data['kra_pin'] = canonical['kra_pin']
        form_data['kraPin'] = canonical['kra_pin']
    
    quotation.form_data = form_data
    quotation.save()
```

#### Day 10: Field Locking Logic
**File**: `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/VehicleDetails/DynamicVehicleForm.js`

```javascript
/**
 * Implementation Requirements:
 * 1. Check if field should be locked
 * 2. Apply read-only styling
 * 3. Show unlock option if extraction failed
 * 4. Different behavior for TOR/Third Party vs Comprehensive
 */

const isFieldLocked = useCallback((fieldName) => {
  if (!formData.isAutoFilled) return false;
  
  const lockedFields = ['make', 'model', 'year'];
  if (!lockedFields.includes(fieldName)) return false;
  
  const coverageType = productType?.toLowerCase() || selectedProduct?.coverage_type?.toLowerCase();
  const isTOROrThirdParty = ['tor', 'third_party', 'tpo'].includes(coverageType);
  
  return isTOROrThirdParty && formData.isLocked;
}, [formData.isAutoFilled, formData.isLocked, productType, selectedProduct]);

// Render locked field
const renderLockedField = (field) => {
  return (
    <View style={styles.lockedFieldContainer}>
      <Text style={styles.fieldLabel}>{field.label}</Text>
      <View style={styles.lockedField}>
        <Text style={styles.lockedFieldValue}>
          {formData[field.key] || 'Not available'}
        </Text>
        <Text style={styles.lockedFieldBadge}>🔒 From logbook</Text>
      </View>
      {/* Option to unlock if user needs to edit */}
      <TouchableOpacity
        style={styles.unlockButton}
        onPress={() => handleUnlockField(field.key)}
      >
        <Text style={styles.unlockButtonText}>
          Unlock to edit manually
        </Text>
      </TouchableOpacity>
    </View>
  );
};
```

---

### Phase 4: Underwriter Enhancement (Week 2 - Days 11-12)

#### Day 11: Backend - NET/GROSS Display Mode
**File**: `insurance-app/app/models.py`

```python
class InsuranceProvider(models.Model):
    """
    Insurance underwriter/provider model
    """
    # Existing fields...
    name = models.CharField(max_length=200)
    company_name = models.CharField(max_length=200, blank=True)
    code = models.CharField(max_length=50, unique=True)
    
    # NEW FIELD: Premium display preference
    display_mode = models.CharField(
        max_length=10,
        choices=[
            ('NET', 'Net Premium (Base only)'),
            ('GROSS', 'Gross Premium (Including levies)')
        ],
        default='GROSS',
        help_text='How to display premiums for this underwriter to agents'
    )
    
    def get_display_premium(self, base_premium):
        """
        Calculate display premium based on mode
        """
        if self.display_mode == 'NET':
            return {
                'amount': base_premium,
                'display_text': f'KSh {base_premium:,.2f} (Net)',
                'note': '+ levies & stamp duty'
            }
        else:
            # Calculate gross (with levies)
            itl = base_premium * 0.0025
            pcf = base_premium * 0.0025
            stamp_duty = 40
            gross = base_premium + itl + pcf + stamp_duty
            
            return {
                'amount': gross,
                'display_text': f'KSh {gross:,.2f} (Total)',
                'note': 'incl. all levies'
            }
```

**Migration**:
```bash
python manage.py makemigrations
python manage.py migrate
```

**Admin Configuration**:
```python
# insurance-app/app/admin.py
class InsuranceProviderAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'display_mode', 'is_active']
    list_filter = ['display_mode', 'is_active']
    search_fields = ['name', 'company_name', 'code']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'company_name', 'code', 'is_active')
        }),
        ('Display Settings', {
            'fields': ('display_mode',),
            'description': 'Choose how premiums are displayed to agents'
        }),
    )
```

#### Day 12: Frontend - Underwriter Display & Filtering
**File**: `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/UnderwriterSelection/UnderwriterSelectionStep.js`

```javascript
/**
 * Implementation Requirements:
 * 1. Display NET or GROSS based on underwriter preference
 * 2. Sort by price (lowest to highest)
 * 3. Show savings vs highest option
 * 4. Visual distinction between NET and GROSS
 */

const [sortOrder, setSortOrder] = useState('price_asc'); // price_asc, price_desc, name

const sortUnderwriters = useCallback((underwriters) => {
  const sorted = [...underwriters];
  
  switch (sortOrder) {
    case 'price_asc':
      return sorted.sort((a, b) => {
        const priceA = a.display_mode === 'NET' ? a.base_premium : a.total_premium;
        const priceB = b.display_mode === 'NET' ? b.base_premium : b.total_premium;
        return priceA - priceB;
      });
      
    case 'price_desc':
      return sorted.sort((a, b) => {
        const priceA = a.display_mode === 'NET' ? a.base_premium : a.total_premium;
        const priceB = b.display_mode === 'NET' ? b.base_premium : b.total_premium;
        return priceB - priceA;
      });
      
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
      
    default:
      return sorted;
  }
}, [sortOrder]);

const renderUnderwriter = (underwriter, index) => {
  const isNet = underwriter.display_mode === 'NET';
  const displayAmount = isNet ? underwriter.base_premium : underwriter.total_premium;
  const highestPrice = Math.max(...underwriters.map(u => 
    u.display_mode === 'NET' ? u.base_premium : u.total_premium
  ));
  const savings = highestPrice - displayAmount;
  
  return (
    <TouchableOpacity
      style={[
        styles.underwriterCard,
        selectedUnderwriter?.id === underwriter.id && styles.selectedCard
      ]}
      onPress={() => handleSelectUnderwriter(underwriter)}
    >
      {/* Underwriter Name */}
      <Text style={styles.underwriterName}>{underwriter.name}</Text>
      
      {/* Premium Display */}
      <View style={styles.premiumContainer}>
        <Text style={styles.premiumAmount}>
          KSh {displayAmount.toLocaleString()}
        </Text>
        <View style={[
          styles.displayModeBadge,
          isNet ? styles.netBadge : styles.grossBadge
        ]}>
          <Text style={styles.displayModeText}>
            {isNet ? 'Net' : 'Total'}
          </Text>
        </View>
      </View>
      
      {/* Additional Info */}
      <Text style={styles.premiumNote}>
        {isNet ? '+ levies & stamp duty' : 'incl. all levies'}
      </Text>
      
      {/* Savings Badge */}
      {savings > 0 && index === 0 && (
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsText}>
            Save KSh {savings.toLocaleString()}
          </Text>
        </View>
      )}
      
      {/* Recommended Badge */}
      {index === 0 && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>✓ Recommended</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Sort Controls
<View style={styles.sortControls}>
  <Text style={styles.sortLabel}>Sort by:</Text>
  <TouchableOpacity
    style={[styles.sortButton, sortOrder === 'price_asc' && styles.sortButtonActive]}
    onPress={() => setSortOrder('price_asc')}
  >
    <Text style={styles.sortButtonText}>Price: Low to High</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.sortButton, sortOrder === 'price_desc' && styles.sortButtonActive]}
    onPress={() => setSortOrder('price_desc')}
  >
    <Text style={styles.sortButtonText}>Price: High to Low</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.sortButton, sortOrder === 'name' && styles.sortButtonActive]}
    onPress={() => setSortOrder('name')}
  >
    <Text style={styles.sortButtonText}>Name (A-Z)</Text>
  </TouchableOpacity>
</View>
```

---

### Phase 5: TOR Positioning (Week 2 - Day 13)

#### Backend Sorting Fix
**File**: `insurance-app/app/views.py`

```python
from django.db import models
from django.db.models import Case, When, Value, IntegerField, Q

class MotorSubcategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for motor subcategories (coverage types)
    """
    queryset = MotorSubcategory.objects.all()
    serializer_class = MotorSubcategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        
        if category:
            queryset = queryset.filter(
                Q(category__name__iexact=category) | 
                Q(category__code__iexact=category)
            )
        
        # Custom ordering: TOR first, then Third Party, then rest
        return queryset.annotate(
            sort_order=Case(
                # TOR products = 1 (highest priority)
                When(
                    Q(code__icontains='TOR') | 
                    Q(name__icontains='TOR') | 
                    Q(subcategory_code__icontains='TOR'),
                    then=Value(1)
                ),
                # Third Party products = 2
                When(
                    Q(coverage_type__iexact='THIRD_PARTY') & 
                    ~Q(code__icontains='TOR') &
                    ~Q(name__icontains='EXTENDIBLE'),
                    then=Value(2)
                ),
                # Third Party Extendible = 3
                When(
                    Q(coverage_type__iexact='THIRD_PARTY') & 
                    Q(name__icontains='EXTENDIBLE'),
                    then=Value(3)
                ),
                # Comprehensive = 4
                When(
                    Q(coverage_type__iexact='COMPREHENSIVE'),
                    then=Value(4)
                ),
                # Everything else = 5
                default=Value(5),
                output_field=IntegerField()
            )
        ).order_by('sort_order', 'name')
```

#### Frontend Consistency
**File**: `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceScreen.js`

Ensure fallback sorting matches backend:
```javascript
const sortSubcategories = (subcategories) => {
  return subcategories.sort((a, b) => {
    // TOR first
    const aIsTOR = /TOR/i.test(a.type || '') || /TOR/i.test(a.name || '');
    const bIsTOR = /TOR/i.test(b.type || '') || /TOR/i.test(b.name || '');
    
    if (aIsTOR && !bIsTOR) return -1;
    if (!aIsTOR && bIsTOR) return 1;
    
    // Then Third Party (non-extendible)
    const aIsTP = /THIRD_PARTY/i.test(a.type || '') && !/EXTENDIBLE/i.test(a.name || '');
    const bIsTP = /THIRD_PARTY/i.test(b.type || '') && !/EXTENDIBLE/i.test(b.name || '');
    
    if (aIsTP && !bIsTP) return -1;
    if (!aIsTP && bIsTP) return 1;
    
    // Then Third Party Extendible
    const aIsTPExt = /THIRD_PARTY/i.test(a.type || '') && /EXTENDIBLE/i.test(a.name || '');
    const bIsTPExt = /THIRD_PARTY/i.test(b.type || '') && /EXTENDIBLE/i.test(b.name || '');
    
    if (aIsTPExt && !bIsTPExt) return -1;
    if (!aIsTPExt && bIsTPExt) return 1;
    
    // Then Comprehensive
    const aIsComp = /COMPREHENSIVE/i.test(a.type || '');
    const bIsComp = /COMPREHENSIVE/i.test(b.type || '');
    
    if (aIsComp && !bIsComp) return -1;
    if (!aIsComp && bIsComp) return 1;
    
    // Finally, alphabetically
    return (a.name || '').localeCompare(b.name || '');
  });
};
```

---

## 🧪 Testing & Validation

### Unit Tests

#### Test 1: Category Caching
```javascript
describe('MotorCategoryCache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });
  
  it('should fetch categories from API on first load', async () => {
    const cache = new MotorCategoryCache();
    const categories = await cache.getCategories();
    
    expect(categories).toBeDefined();
    expect(categories.length).toBeGreaterThan(0);
  });
  
  it('should load categories from cache on second load', async () => {
    const cache = new MotorCategoryCache();
    await cache.getCategories(); // First load
    
    const cachedCategories = await cache.getCategories(); // Second load
    
    expect(cachedCategories).toBeDefined();
    // Verify no API call was made
  });
  
  it('should refresh cache when stale', async () => {
    const cache = new MotorCategoryCache();
    cache.CACHE_TTL = 0; // Set TTL to 0 for immediate expiry
    
    await cache.getCategories();
    await cache.getCategories(); // Should trigger refresh
    
    // Verify API call was made
  });
});
```

#### Test 2: Form Validation
```javascript
describe('Motor Insurance Validation', () => {
  it('should validate registration number format', () => {
    const error = validateField('registrationNumber', 'KAA123A', {
      identificationType: 'Vehicle Registration'
    });
    
    expect(error).toBeNull();
  });
  
  it('should reject invalid registration format', () => {
    const error = validateField('registrationNumber', 'INVALID', {
      identificationType: 'Vehicle Registration'
    });
    
    expect(error).toBeTruthy();
    expect(error).toContain('Invalid registration format');
  });
  
  it('should validate KRA PIN format', () => {
    const error = validateField('kraPin', 'A001234567Z', {});
    expect(error).toBeNull();
  });
  
  it('should reject invalid KRA PIN', () => {
    const error = validateField('kraPin', 'INVALID', {});
    expect(error).toBeTruthy();
  });
});
```

#### Test 3: Document Auto-Fill
```javascript
describe('Document Auto-Fill Logic', () => {
  it('should lock fields for TOR after logbook extraction', () => {
    const extractedData = {
      registrationNumber: 'KAA 123A',
      make: 'Toyota',
      model: 'Axio',
      year: 2020
    };
    
    const result = handleDocumentExtracted('LOGBOOK', extractedData, {
      selectedSubcategory: { coverage_type: 'TOR' }
    });
    
    expect(result.isLocked).toBe(true);
    expect(result.isAutoFilled).toBe(true);
  });
  
  it('should keep fields editable for Comprehensive', () => {
    const extractedData = {
      registrationNumber: 'KAA 123A',
      make: 'Toyota',
      model: 'Axio',
      year: 2020
    };
    
    const result = handleDocumentExtracted('LOGBOOK', extractedData, {
      selectedSubcategory: { coverage_type: 'COMPREHENSIVE' }
    });
    
    expect(result.isLocked).toBe(false);
    expect(result.isAutoFilled).toBe(true);
  });
});
```

### Integration Tests

#### Test 4: End-to-End Flow
```javascript
describe('Motor Insurance Flow E2E', () => {
  it('should complete TOR flow with document auto-fill', async () => {
    // 1. Select category
    await selectCategory('Private');
    
    // 2. Select TOR subcategory
    await selectSubcategory('TOR For Private');
    
    // 3. Upload logbook
    await uploadDocument('logbook', mockLogbookFile);
    
    // 4. Verify auto-fill
    const vehicleDetails = getFormData().vehicleDetails;
    expect(vehicleDetails.make).toBe('Toyota');
    expect(vehicleDetails.isLocked).toBe(true);
    
    // 5. Select underwriter
    await selectUnderwriter('Jubilee Insurance');
    
    // 6. Fill client details
    await fillClientDetails(mockClientData);
    
    // 7. Submit policy
    const result = await submitPolicy();
    expect(result.success).toBe(true);
  });
});
```

### Manual Testing Checklist

```markdown
## Motor 2 Flow Testing Checklist

### Category Selection
- [ ] Categories load instantly on second app launch
- [ ] All categories display correctly
- [ ] Category selection navigates to subcategory screen

### Subcategory Selection (Coverage Type)
- [ ] TOR appears first in the list
- [ ] Third Party appears second
- [ ] Comprehensive appears after Third Party
- [ ] All subcategories have correct badges

### Document Upload & Auto-Fill
- [ ] Logbook upload triggers extraction
- [ ] Vehicle details auto-fill correctly
- [ ] Fields lock for TOR (make/model/year)
- [ ] Fields stay editable for Comprehensive
- [ ] ID copy extracts name and ID number
- [ ] KRA PIN extracts correctly

### Form Validation
- [ ] Registration number validates correctly
- [ ] Email validates correctly
- [ ] Phone number validates Kenyan format
- [ ] KRA PIN validates format
- [ ] Sum insured validates min/max for Comprehensive
- [ ] Date validates not > 3 months future

### Underwriter Comparison
- [ ] Underwriters load correctly
- [ ] Sort by price works (low to high)
- [ ] Sort by price works (high to low)
- [ ] NET vs GROSS displays correctly
- [ ] Savings badge shows for lowest price
- [ ] Recommended badge shows

### Draft Auto-Save
- [ ] Form auto-saves every 2 seconds
- [ ] Draft recovers after app restart
- [ ] Draft prompt shows on app launch
- [ ] Draft deletes after submission

### API Retry
- [ ] Failed requests retry automatically
- [ ] Retry shows loading indicator
- [ ] Non-retryable errors show immediately
- [ ] User can manually retry

### Policy Submission
- [ ] All data submits correctly
- [ ] Premium breakdown is accurate
- [ ] Policy PDF generates
- [ ] Success screen shows policy number
```

---

## 📤 Deployment Checklist

### Pre-Deployment

```markdown
## Code Quality
- [ ] All ESLint warnings resolved
- [ ] No console.log statements in production code
- [ ] All TODO comments addressed
- [ ] Code reviewed by senior developer
- [ ] TypeScript errors resolved (if using TS)

## Testing
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing completed
- [ ] Edge cases tested
- [ ] Error scenarios tested

## Documentation
- [ ] API endpoints documented
- [ ] Component props documented
- [ ] State management documented
- [ ] Validation rules documented
- [ ] Admin guide updated

## Backend
- [ ] Migrations created and tested
- [ ] Database indexes added where needed
- [ ] API rate limiting configured
- [ ] Error logging configured
- [ ] Performance monitoring enabled

## Frontend
- [ ] Bundle size optimized
- [ ] Images optimized
- [ ] AsyncStorage keys documented
- [ ] Cache invalidation tested
- [ ] Offline behavior tested

## Security
- [ ] API authentication tested
- [ ] Data validation on backend
- [ ] Sensitive data encrypted
- [ ] HTTPS enforced
- [ ] Rate limiting active
```

### Deployment Steps

```bash
# 1. Backend Deployment
cd insurance-app
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py test

# 2. Frontend Build
cd ../frontend
npm install
npm run build
expo build:android
expo build:ios

# 3. Post-Deployment
# - Monitor error logs
# - Test production API
# - Verify cache is working
# - Test document upload
# - Test policy submission
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Categories Not Caching
**Symptom**: Categories fetched on every load  
**Solution**:
```javascript
// Check AsyncStorage permissions
import AsyncStorage from '@react-native-async-storage/async-storage';

// Verify cache is initialized
const cache = MotorCategoryCache.getInstance();
await cache.initialize();

// Force refresh if needed
await cache.clearCache();
await cache.refreshCache();
```

### Issue 2: Fields Not Locking After Document Upload
**Symptom**: Make/model/year editable for TOR  
**Solution**:
```javascript
// Verify coverage type detection
const isTOROrThirdParty = ['tor', 'third_party', 'tpo'].includes(
  coverageType?.toLowerCase()
);

// Ensure isLocked flag is set
vehicleData.isLocked = isTOROrThirdParty;
```

### Issue 3: Underwriter Comparison Not Triggering
**Symptom**: No underwriters shown  
**Solution**:
```javascript
// Check required fields
const requiredFields = [
  'registrationNumber',
  'cover_start_date'
];

// For comprehensive, also need sum_insured
if (isComprehensive) {
  requiredFields.push('sum_insured');
}

// Verify all required fields have values
const hasRequired = requiredFields.every(field => 
  formData[field] && formData[field].toString().trim()
);
```

### Issue 4: Draft Not Recovering
**Symptom**: Draft not loaded on app restart  
**Solution**:
```javascript
// Check draft exists in AsyncStorage
const draftKey = `motor_insurance_draft_${draftId}`;
const draftJson = await AsyncStorage.getItem(draftKey);

// Verify draft not expired
const draft = JSON.parse(draftJson);
const age = Date.now() - new Date(draft.savedAt).getTime();
const isExpired = age > 7 * 24 * 60 * 60 * 1000;
```

---

## 📚 Additional Resources

### Code Examples
- Category Caching: See `frontend/services/MotorCategoryCache.js`
- State Management: See `frontend/contexts/MotorInsuranceContext.js`
- Validation: See `frontend/utils/motorInsuranceValidation.js`
- Document Auto-Fill: See `MotorInsuranceScreen.js` line 940+

### API Documentation
- Motor Categories: `GET /api/v1/motor/categories/`
- Motor Subcategories: `GET /api/v1/motor/subcategories/?category={name}`
- Underwriter Comparison: `POST /api/v1/motor/compare-underwriters/`
- Document Upload: `POST /api/v1/documents/presign-upload/`

### Admin Configuration
- Insurance Providers: `/admin/app/insuranceprovider/`
- Motor Categories: `/admin/app/motorcategory/`
- Motor Subcategories: `/admin/app/motorsubcategory/`
- Document Uploads: `/admin/app/documentupload/`

---

## ✅ Success Criteria

### Performance
- [ ] Categories load in < 200ms after first fetch
- [ ] Form renders in < 500ms
- [ ] Underwriter comparison completes in < 3 seconds
- [ ] Document extraction completes in < 10 seconds

### User Experience
- [ ] Zero data loss with auto-save
- [ ] Clear visual feedback on all actions
- [ ] Helpful error messages
- [ ] Smooth navigation between steps
- [ ] Professional UI matching design system

### Data Accuracy
- [ ] 100% accurate premium calculations
- [ ] Correct levy applications (ITL, PCF, Stamp Duty)
- [ ] Accurate NET vs GROSS display
- [ ] Correct field locking for TOR/Third Party
- [ ] Reliable document extraction

### Business Rules
- [ ] TOR always appears first
- [ ] Vehicle details locked for TOR/Third Party when auto-filled
- [ ] Comprehensive fields fully editable
- [ ] Underwriters sorted by price
- [ ] NET/GROSS display per underwriter preference

---

## 🎓 Training Guide

### For Developers
1. Read this implementation guide thoroughly
2. Review existing codebase structure
3. Understand state management flow
4. Test each component in isolation
5. Follow PataBima coding standards

### For QA Team
1. Use manual testing checklist
2. Test all coverage types (TOR, Third Party, Comprehensive)
3. Test document upload for all document types
4. Verify auto-fill logic for each coverage type
5. Test draft recovery scenarios
6. Test error handling and retry logic

### For Product Team
1. Understand business rules for each coverage type
2. Verify NET/GROSS display makes sense
3. Test underwriter sorting preferences
4. Validate premium calculations
5. Approve UI/UX changes

---

**END OF IMPLEMENTATION GUIDE**

Questions or issues? Contact: PataBima Development Team  
Last Updated: October 13, 2025  
Version: 2.0

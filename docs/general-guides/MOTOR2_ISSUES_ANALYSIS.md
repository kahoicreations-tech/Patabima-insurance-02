# Motor 2 Issues Analysis & Fix Plan

**Date:** October 29, 2025  
**Status:** ✅ HIGH PRIORITY COMPLETE (2/4 Tasks)

---

## ✅ FIXED - Issue 1: Insurance Provider/Underwriter Not Recorded

**STATUS:** COMPLETE ✅

**Solution Implemented:**
- Updated `MotorInsuranceScreen.js` Step 7 to include comprehensive `underwriterDetails` object in policy submission
- Added 7 underwriter fields: id, name, company, total_premium, breakdown, is_extendible, extendible_config
- Enhanced `QuotationsScreenNew.js` to display "Insurance Provider" in expanded card details

**Files Modified:**
- `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceScreen.js` (Line ~1630)
- `frontend/screens/main/QuotationsScreenNew.js` (Line ~1033)

---

## ✅ FIXED - Issue 2: Levies Showing as KES 0 in Quotations

**STATUS:** COMPLETE ✅

**Solution Implemented:**
- **Primary Fix:** Added levy calculation fallback in `MotorInsuranceScreen.js` Step 7 premium breakdown
  - ITL = basic * 0.0025 (0.25%)
  - PCF = basic * 0.0025 (0.25%)  
  - Stamp Duty = 40 (fixed KES 40)
- **Secondary Fix:** Added calculation logic in `QuotationsScreenNew.js` when basic premium exists but levies are zero

**Files Modified:**
- `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceScreen.js` (Line ~1609)
- `frontend/screens/main/QuotationsScreenNew.js` (Line ~280)

**Calculation Logic:**
```javascript
// For Basic Premium of KES 342:
ITL:  342 * 0.0025 = 0.86
PCF:  342 * 0.0025 = 0.86
Stamp: 40.00 (fixed)
Total: 383.72
```

---

## Issues Identified

### 1. ❌ Insurance Provider/Underwriter Not Recorded

**Problem:**  
When viewing quotations/policies (screenshot shows "MAZDA DEMIO" policy POL-2025-223859), the insurance provider/underwriter information is not displayed, even though it should be captured during the Motor 2 flow.

**Root Cause Analysis:**

1. **Frontend Capture:** ✅ WORKING
   - `UnderwriterSelectionStep.js` properly captures underwriter selection
   - Stored in `state.selectedUnderwriter`
   - Contains: `name`, `company`, `total_premium`, `breakdown`, etc.

2. **Policy Submission:** ⚠️ INCOMPLETE MAPPING
   ```javascript
   // PolicySubmission.js Line 109
   underwriterDetails: safe.underwriterDetails || safe.underwriter_details || null,
   ```
   - Only maps if explicitly named `underwriterDetails` or `underwriter_details`
   - BUT `state.selectedUnderwriter` is passed as separate prop, not nested in main object
   - Normalization function expects it inside composed data object

3. **Data Flow Gap:**
   ```
   MotorInsuranceScreen (Step 7)
     ↓
   Passes policyData with: premiumBreakdown.underwriter_name ✅
   BUT missing: underwriterDetails object ❌
     ↓
   PolicySubmission normalizePolicyData()
     ↓
   underwriterDetails: null (because not in input)
     ↓
   Backend receives incomplete underwriter info
   ```

**Fix Required:**
- Update `MotorInsuranceScreen.js` Step 7 to include full underwriter object
- Ensure `underwriterDetails` contains all required fields: id, name, company, contact

---

### 2. ❌ Levies Showing as KES 0 in Quotations

**Problem:**  
Screenshot shows:
```
Training Levy (ITL): KES 0
PCF Levy: KES 0
Stamp Duty: KES 0
```

**Expected:**
- Training Levy (ITL): 0.25% of base premium
- PCF Levy: 0.25% of base premium  
- Stamp Duty: KES 40 (fixed)

**Root Cause Analysis:**

1. **Premium Calculation:** ⚠️ ZERO VALUES IN BACKEND RESPONSE
   ```javascript
   // MotorInsuranceScreen.js Lines 1612-1618
   premiumBreakdown: {
     basic_premium: selectedPricing.basic_premium || 0,
     itl: selectedPricing.itl || 0,  // ← Coming as 0 from backend
     pcf: selectedPricing.pcf || 0,   // ← Coming as 0 from backend
     stamp_duty: selectedPricing.stamp_duty || 0, // ← Coming as 0 from backend
     total_premium: selectedPricing.total_premium || 0,
   }
   ```

2. **Backend API Issue:**
   - Motor pricing endpoints not calculating levies
   - Third Party products might have different levy calculation logic
   - Need to verify backend `/api/motor2/calculate-premium/` endpoint

3. **Frontend Display:**
   ```javascript
   // QuotationsScreenNew.js (screenshot shows breakdown)
   // Displays: Training Levy (ITL), PCF Levy, Stamp Duty
   // Values all show KES 0
   ```

**Fix Required:**
- Check backend Motor 2 pricing calculation
- Ensure levies computed: `ITL = base * 0.0025`, `PCF = base * 0.0025`, `Stamp = 40`
- If backend not providing, add frontend fallback calculation

---

### 3. ❌ Inconsistent Text Capitalization

**Problem:**  
Mixed capitalization styles throughout Motor 2 UI:
- Some buttons: "Next Step" vs "NEXT STEP"
- Labels: "vehicle registration" vs "Vehicle Registration"
- Status: "draft" vs "DRAFT" vs "Draft"

**Standards to Implement:**

| Element Type | Style | Example |
|-------------|-------|---------|
| **Product Names** | Title Case | "Private Third Party", "Comprehensive" |
| **Field Labels** | Sentence case | "Vehicle registration", "Chassis number" |
| **Primary Buttons** | Title Case | "Next Step", "Submit Policy" |
| **Secondary Buttons** | Sentence case | "Go back", "Cancel" |
| **Status Badges** | UPPERCASE | "DRAFT", "ACTIVE", "PAID" |
| **Form Placeholders** | Sentence case | "Enter registration number" |
| **Section Headings** | Title Case | "Client Information", "Payment Details" |

**Files to Update:**
- `MotorInsuranceScreen.js` - Step titles, button labels
- `EnhancedClientForm.js` - Field labels
- `DynamicVehicleForm.js` - Form labels
- `PolicyDetailsStep.js` - Input labels
- `EnhancedPayment.js` - Payment section labels

---

### 4. ❌ Poor Quotations List UX

**Problem:**  
Long vertical list (screenshot shows single column scrolling) makes it hard to:
- Scan multiple quotations quickly
- Compare policies at a glance
- Find specific policy types

**Current Issues:**
- Single column layout wastes horizontal space
- Requires excessive scrolling for 10+ quotations
- No visual grouping by status or category
- Hard to distinguish between different policy types quickly

**Recommended Solution: Tabbed Layout with Compact Cards**

```
┌─────────────────────────────────────────┐
│  Quotations                    [Search] │
├─────────────────────────────────────────┤
│ [All] [Draft] [Active] [Paid] [Expired] │  ← Tabs
├─────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐        │
│ │ POL-223859  │ │ POL-936417  │        │  ← 2 Column Grid
│ │ MAZDA DEMIO │ │ Toyota Vitz │        │
│ │ KDA 234H    │ │ KAA 123X    │        │
│ │ Ksh 342     │ │ Ksh 6,070   │        │
│ │ [Draft]     │ │ [Active]    │        │
│ └─────────────┘ └─────────────┘        │
│ ┌─────────────┐ ┌─────────────┐        │
│ │ ...         │ │ ...         │        │
│ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────┘
```

**Alternative: Accordion by Category**
```
▼ Private Motor (3)
  - MAZDA DEMIO | KDA 234H | Ksh 342 | Draft
  - Toyota Vitz | KAA 123X | Ksh 6,070 | Active
  
▼ Commercial Motor (1)
  - Isuzu Truck | KBX 456Y | Ksh 12,500 | Paid
  
▶ Medical Insurance (2)
```

**Preferred:** Tabs + 2-Column Grid
- Reduces scrolling by 50%
- Better use of screen space
- Quick status filtering via tabs
- Expandable cards for full details

---

## Implementation Plan

### Task 1: Fix Insurance Provider Recording

**Files to Modify:**
1. `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceScreen.js`
   - Update Step 7 policy data assembly
   - Add proper `underwriterDetails` object

**Changes:**
```javascript
// Step 7: Around line 1570
const policyData = {
  quoteId: state.quoteId || `QUOTE-${Date.now()}`,
  clientDetails,
  vehicleDetails,
  productDetails,
  
  // FIX: Add comprehensive underwriter details
  underwriterDetails: state.selectedUnderwriter ? {
    id: state.selectedUnderwriter.underwriter_id || state.selectedUnderwriter.id,
    name: state.selectedUnderwriter.underwriter_name || state.selectedUnderwriter.name,
    company: state.selectedUnderwriter.company || state.selectedUnderwriter.underwriter_name,
    total_premium: state.selectedUnderwriter.total_premium,
    breakdown: state.selectedUnderwriter.breakdown,
    is_extendible: state.selectedUnderwriter.is_extendible,
    extendible_config: state.selectedUnderwriter.extendible_config
  } : null,
  
  extendibleConfig,
  premiumBreakdown,
  paymentDetails,
  agent_id: state.agentId || 'AGENT-DEFAULT',
};
```

2. `frontend/screens/main/QuotationsScreenNew.js`
   - Display underwriter name in policy cards
   - Add underwriter icon/badge

---

### Task 2: Fix Zero Levies

**Option A: Backend Fix (Recommended)**
1. Check `insurance-app/app/views/motor2_pricing.py`
2. Ensure levy calculation:
   ```python
   basic_premium = calculate_base_premium(...)
   itl = round(basic_premium * 0.0025, 2)  # 0.25%
   pcf = round(basic_premium * 0.0025, 2)  # 0.25%
   stamp_duty = 40  # Fixed
   total = basic_premium + itl + pcf + stamp_duty
   ```

**Option B: Frontend Fallback**
If backend can't be fixed immediately, add calculation in frontend:
```javascript
// MotorInsuranceScreen.js
const effectivePremium = state.selectedUnderwriter ? (() => {
  const uw = state.selectedUnderwriter || {};
  const bd = uw.breakdown || {};
  const base = Number(bd.base_premium ?? bd.basic_premium ?? uw.base_premium ?? 0);
  
  // Calculate levies if missing
  const training = Number(bd.training_levy ?? bd.itl ?? 0) || Math.round(base * 0.0025 * 100) / 100;
  const pcf = Number(bd.pcf_levy ?? bd.pcf ?? 0) || Math.round(base * 0.0025 * 100) / 100;
  const stamp = Number(bd.stamp_duty ?? 0) || 40;
  
  const total = base + training + pcf + stamp;
  
  return {
    base_premium: base,
    totalPremium: total,
    breakdown: {
      ...bd,
      training_levy: training,
      pcf_levy: pcf,
      stamp_duty: stamp
    }
  };
})() : state.calculatedPremium;
```

---

### Task 3: Implement Proper Capitalization

**Create Utility Function:**
```javascript
// frontend/utils/textFormatting.js
export const formatText = {
  titleCase: (str) => {
    return str.replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  },
  
  sentenceCase: (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },
  
  uppercase: (str) => str.toUpperCase(),
  
  productName: (str) => formatText.titleCase(str),
  fieldLabel: (str) => formatText.sentenceCase(str),
  statusBadge: (str) => formatText.uppercase(str),
};
```

**Apply Across Files:**
- Import utility in all Motor 2 screens
- Update button text, labels, headings systematically

---

### Task 4: Redesign Quotations List

**New Component Structure:**
```javascript
// QuotationsScreenNew.js

const TabFilters = () => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {['All', 'Draft', 'Active', 'Paid', 'Expired'].map(tab => (
      <TabButton 
        key={tab}
        label={tab}
        active={activeFilter === tab}
        onPress={() => setActiveFilter(tab)}
      />
    ))}
  </ScrollView>
);

const QuoteCard = ({ quote, onPress }) => (
  <TouchableOpacity style={styles.compactCard} onPress={onPress}>
    <View style={styles.cardHeader}>
      <Text style={styles.policyNumber}>{quote.policyNumber}</Text>
      <StatusBadge status={quote.status} size="small" />
    </View>
    <Text style={styles.vehicleName}>{quote.vehicleName}</Text>
    <Text style={styles.regNumber}>{quote.registration}</Text>
    <View style={styles.cardFooter}>
      <Text style={styles.premium}>Ksh {quote.premium}</Text>
      <Ionicons name="chevron-forward" size={16} />
    </View>
  </TouchableOpacity>
);

const QuoteGrid = ({ quotes }) => (
  <FlatList
    data={quotes}
    numColumns={2}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => <QuoteCard quote={item} onPress={() => expandQuote(item)} />}
    columnWrapperStyle={styles.gridRow}
  />
);
```

**Styles:**
```javascript
compactCard: {
  flex: 1,
  margin: 8,
  padding: 12,
  backgroundColor: Colors.white,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: Colors.border,
  minHeight: 120,
},
gridRow: {
  justifyContent: 'space-between',
  paddingHorizontal: 8,
}
```

---

## Priority Order

1. **HIGH:** Fix Zero Levies (Task 2) - Backend pricing calculation
2. **HIGH:** Fix Insurance Provider Not Recorded (Task 1) - Data mapping
3. **MEDIUM:** Redesign Quotations List (Task 4) - UX improvement
4. **LOW:** Implement Proper Capitalization (Task 3) - Polish

## Testing Checklist

- [ ] Create Third Party policy → Verify underwriter saved and displayed
- [ ] Check quotation details → Verify ITL, PCF, Stamp Duty calculated correctly
- [ ] Review all Motor 2 screens → Verify consistent capitalization
- [ ] Test quotations list → Verify grid layout, tabs functional, search working

---

**Next Steps:** Start with Task 1 (Insurance Provider) and Task 2 (Levies) in parallel.

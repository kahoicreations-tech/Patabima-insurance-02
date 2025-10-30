# Pricing Builder - Existing Data Loading Enhancement

**Status**: ✅ Complete  
**Date**: 2025-01-XX  
**Component**: Insurance Provider Admin - Pricing Builder  
**Impact**: Enables editing existing pricing configurations without data loss

---

## Overview

The pricing builder now properly loads existing pricing configurations from the `features` field, including:

- ✅ Bracket-based pricing with multiple sum insured ranges
- ✅ Add-ons/extensions configuration
- ✅ Market position settings
- ✅ All product types (Private, Commercial, PSV, Motorcycle, TukTuk, Special)

This prevents data loss when editing existing InsuranceProvider records and provides visual guidance for configuration updates.

---

## What Changed

### 1. Data Source Update

**Before:**

```javascript
const textArea = document.querySelector("#id_pricing_data");
let pricingData = {};
if (textArea && textArea.value) {
  pricingData = JSON.parse(textArea.value);
}
```

**After:**

```javascript
const featuresTextArea = document.querySelector("#id_features");
let pricingData = {};
let marketPosition = "standard";

if (featuresTextArea && featuresTextArea.value) {
  const features = JSON.parse(featuresTextArea.value);

  // Extract pricing data from features.pricing
  if (features.pricing && typeof features.pricing === "object") {
    Object.keys(features.pricing).forEach((productCode) => {
      const pricing = features.pricing[productCode];
      pricingData[productCode] = {
        enabled: true,
        pricing_type: pricing.pricing_type || "fixed",
        ...pricing,
      };

      // Load brackets if present
      if (pricing.brackets && Array.isArray(pricing.brackets)) {
        pricingData[productCode].brackets = pricing.brackets;
      }

      // Load add-ons if present
      if (pricing.addons && Array.isArray(pricing.addons)) {
        pricingData[productCode].addons = pricing.addons;
      }
    });
  }

  // Extract market position
  if (features.market_position) {
    marketPosition = features.market_position;
  }
}
```

### 2. Enhanced Data Loading

The `loadExistingData()` function now:

1. **Sets Market Position**:

   ```javascript
   const marketSelect = document.getElementById("marketPositionSelect");
   if (marketSelect && marketPosition) {
     marketSelect.value = marketPosition;
   }
   ```

2. **Loads Pricing Type**:

   - Automatically selects correct pricing method (fixed/percentage/bracket)
   - Shows appropriate UI elements based on pricing type

3. **Handles Bracket Pricing**:

   - Stores brackets array in `pricingData[productCode].brackets`
   - Bracket modal loads existing brackets when opened
   - Supports unlimited brackets per product

4. **Handles Add-ons**:

   - Stores add-ons array in `pricingData[productCode].addons`
   - Add-ons modal loads existing add-ons when opened
   - Percentage conversion: Backend stores `0.05` (5%), UI shows `5`

5. **Data Type Conversions**:
   - **Percentage Rate**: Backend `0.035` (3.5%) → UI `3.5`
   - **Add-on Percentage**: Backend `0.05` (5%) → UI `5`
   - **Brackets**: Direct mapping (no conversion needed)

### 3. Save Process Update

When saving, the builder:

1. **Converts UI Values to Backend Format**:

   ```javascript
   // Percentage rate: UI 3.5 → Backend 0.035
   pricingEntry.rate = parseFloat(product.rate) / 100;

   // Add-on percentage: UI 5 → Backend 0.05
   pricingEntry.addons = product.addons.map((addon) => ({
     name: addon.name,
     type: addon.type,
     value:
       addon.type === "percentage"
         ? parseFloat(addon.value) / 100
         : parseFloat(addon.value),
   }));
   ```

2. **Writes to Features Field**:

   ```javascript
   const finalJson = {
     pricing: pricingConfig,
     addon_overrides: {},
     market_position: marketPosition,
   };

   if (featuresTextArea) {
     featuresTextArea.value = JSON.stringify(finalJson, null, 2);
   }
   ```

---

## Features JSON Structure

### Backend Storage Format

```json
{
  "pricing": {
    "PRIVATE_COMPREHENSIVE": {
      "pricing_type": "bracket",
      "brackets": [
        {
          "min_value": 0,
          "max_value": 1000000,
          "premium": 25000
        },
        {
          "min_value": 1000001,
          "max_value": 3000000,
          "premium": 35000
        },
        {
          "min_value": 3000001,
          "max_value": 5000000,
          "premium": 50000
        }
      ],
      "addons": [
        {
          "name": "Excess Protector",
          "type": "fixed",
          "value": 5000
        },
        {
          "name": "Political Violence & Terrorism",
          "type": "percentage",
          "value": 0.05
        }
      ]
    },
    "PRIVATE_TOR": {
      "pricing_type": "fixed",
      "base_premium": 5000
    },
    "COMMERCIAL_COMPREHENSIVE": {
      "pricing_type": "percentage",
      "rate": 0.035,
      "min_premium": 20000,
      "max_premium": 500000
    }
  },
  "addon_overrides": {},
  "market_position": "premium"
}
```

### UI Representation

**Bracket Configuration Modal** (when user clicks "Configure Brackets"):

```
Bracket 1:
  Min Sum Insured: 0
  Max Sum Insured: 1,000,000
  Premium: 25,000

Bracket 2:
  Min Sum Insured: 1,000,001
  Max Sum Insured: 3,000,000
  Premium: 35,000

[+ Add Bracket]
```

**Add-ons Configuration Modal** (when user clicks "+ Add-ons"):

```
Add-on 1:
  Name: Excess Protector
  Pricing Type: Fixed
  Value: 5000

Add-on 2:
  Name: Political Violence & Terrorism
  Pricing Type: Percentage
  Value: 5 (displays as 5%, stored as 0.05)

[+ Add Add-on]
```

---

## Loading Sequence

### 1. Page Load

```
DOMContentLoaded
  ↓
Parse features textarea (#id_features)
  ↓
Extract features.pricing object
  ↓
For each product in features.pricing:
  - Add to pricingData object
  - Convert rate from decimal to percentage
  - Store brackets array (if present)
  - Store addons array (if present)
  - Convert addon percentages to display format
  ↓
Extract features.market_position
  ↓
Call loadExistingData()
```

### 2. Load Existing Data

```
loadExistingData()
  ↓
Set market position dropdown value
  ↓
For each product toggle:
  - Check if product in pricingData
  - If yes:
    * Enable checkbox
    * Enable product row
    * Set pricing type dropdown
    * Load field values based on pricing type
    * Show/hide appropriate inputs
  ↓
Call updatePreview()
```

### 3. User Opens Bracket Modal

```
User clicks "Configure Brackets"
  ↓
Get currentBracketProduct code
  ↓
Load pricingData[currentBracketProduct].brackets
  ↓
Render bracket items with existing values
  ↓
User can add/edit/remove brackets
  ↓
On save: Update pricingData[currentBracketProduct].brackets
  ↓
Call updatePreview() → Updates features textarea
```

### 4. User Opens Add-ons Modal

```
User clicks "+ Add-ons"
  ↓
Get currentAddonProduct code
  ↓
Load pricingData[currentAddonProduct].addons
  ↓
Render addon items with existing values
  ↓
User can add/edit/remove add-ons
  ↓
On save: Update pricingData[currentAddonProduct].addons
  ↓
Call updatePreview() → Updates features textarea
```

---

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    INSURANCEPROVIDER MODEL                     │
│                    features (JSONField)                        │
│  {                                                             │
│    "pricing": {                                                │
│      "PRIVATE_COMPREHENSIVE": {                                │
│        "pricing_type": "bracket",                              │
│        "brackets": [...],                                      │
│        "addons": [...]                                         │
│      }                                                         │
│    },                                                          │
│    "market_position": "standard"                               │
│  }                                                             │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    PAGE LOAD / PARSE                          │
│  - Read #id_features textarea                                 │
│  - Parse JSON                                                  │
│  - Extract features.pricing → pricingData object              │
│  - Extract features.market_position → marketPosition var      │
│  - Convert decimals to percentages for display                │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    UI POPULATION                              │
│  - Enable product checkboxes                                   │
│  - Set pricing type dropdowns                                  │
│  - Load field values (rate, base_premium, etc.)               │
│  - Set market position dropdown                                │
│  - Show appropriate inputs based on pricing type               │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    USER INTERACTIONS                          │
│  - Edit fields → Update pricingData → updatePreview()        │
│  - Click "Configure Brackets" → Load brackets → Modal         │
│  - Click "+ Add-ons" → Load addons → Modal                   │
│  - Add/Edit/Remove items → Update pricingData arrays         │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    SAVE / UPDATE PREVIEW                      │
│  - Build final JSON structure                                 │
│  - Convert percentages back to decimals                       │
│  - Update #id_features textarea                               │
│  - Display JSON preview                                        │
└───────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    DJANGO ADMIN SAVE                          │
│  - Submit form                                                 │
│  - InsuranceProvider.features = parsed JSON                    │
│  - Database updated with new configuration                     │
└──────────────────────────────────────────────────────────────┘
```

---

## Example Workflow: Editing Existing Configuration

### Scenario

Admin wants to edit "Britam Insurance" comprehensive pricing for Private vehicles.

### Current Configuration (Backend)

```json
{
  "pricing": {
    "PRIVATE_COMPREHENSIVE": {
      "pricing_type": "bracket",
      "brackets": [
        { "min_value": 0, "max_value": 1000000, "premium": 25000 },
        { "min_value": 1000001, "max_value": 3000000, "premium": 35000 }
      ],
      "addons": [{ "name": "Excess Protector", "type": "fixed", "value": 5000 }]
    }
  },
  "market_position": "standard"
}
```

### Edit Steps

1. **Navigate to Admin**:

   ```
   http://yoursite.com/admin/app/insuranceprovider/123/change/
   ```

2. **Page Loads**:

   - ✅ "Private - Comprehensive" checkbox is ENABLED
   - ✅ Pricing Type dropdown shows "Bracket (Ranges)"
   - ✅ "Configure Brackets" button is VISIBLE
   - ✅ "+ Add-ons" button is VISIBLE
   - ✅ Market Position shows "Standard"

3. **Click "Configure Brackets"**:

   - Modal opens
   - Shows existing brackets:
     ```
     Bracket 1: 0 - 1,000,000 = 25,000
     Bracket 2: 1,000,001 - 3,000,000 = 35,000
     ```
   - Admin adds Bracket 3: `3,000,001 - 5,000,000 = 50,000`
   - Clicks "Save Brackets"

4. **Click "+ Add-ons"**:

   - Modal opens
   - Shows existing add-on:
     ```
     Add-on 1: Excess Protector (Fixed) = 5,000
     ```
   - Admin adds PVT: `Political Violence & Terrorism (Percentage) = 5`
   - Clicks "Save Add-ons"

5. **JSON Preview Updates**:

   ```json
   {
     "pricing": {
       "PRIVATE_COMPREHENSIVE": {
         "pricing_type": "bracket",
         "brackets": [
           { "min_value": 0, "max_value": 1000000, "premium": 25000 },
           { "min_value": 1000001, "max_value": 3000000, "premium": 35000 },
           { "min_value": 3000001, "max_value": 5000000, "premium": 50000 }
         ],
         "addons": [
           { "name": "Excess Protector", "type": "fixed", "value": 5000 },
           {
             "name": "Political Violence & Terrorism",
             "type": "percentage",
             "value": 0.05
           }
         ]
       }
     },
     "market_position": "standard"
   }
   ```

6. **Click "Save"**:
   - Django admin saves features field
   - Database updated
   - Materialize action creates MotorPricing records

---

## Validation & Error Handling

### On Page Load

1. **JSON Parse Error**:

   ```javascript
   try {
     const features = JSON.parse(featuresTextArea.value);
   } catch (e) {
     console.warn("[Pricing Builder] Could not parse existing features:", e);
     // Builder starts with empty configuration
   }
   ```

2. **Missing pricing Object**:

   ```javascript
   if (features.pricing && typeof features.pricing === "object") {
     // Load pricing data
   } else {
     // No existing pricing, start fresh
   }
   ```

3. **Invalid Product Code**:
   - If product code in features.pricing doesn't match any toggle, it's ignored
   - Only valid products are loaded into UI

### During Editing

1. **Bracket Validation**:

   - Min value must be < Max value
   - Bracket ranges should not overlap (visual warning)
   - Premium must be > 0

2. **Add-on Validation**:

   - Name is required
   - Value must be numeric
   - Percentage value: 0.01 - 100 (displayed as 0.01% - 100%)

3. **Real-time Preview**:
   - Updates on every change
   - Shows validation status (✓ Valid or X errors)
   - Displays product count

---

## Testing Checklist

### Test 1: Load Existing Bracket Pricing

- [ ] Create InsuranceProvider with bracket pricing
- [ ] Open in admin
- [ ] Verify checkboxes enabled
- [ ] Verify pricing type shows "Bracket (Ranges)"
- [ ] Click "Configure Brackets"
- [ ] Verify existing brackets display correctly
- [ ] Add new bracket
- [ ] Save and verify features field updated

### Test 2: Load Existing Add-ons

- [ ] Create InsuranceProvider with add-ons
- [ ] Open in admin
- [ ] Click "+ Add-ons"
- [ ] Verify existing add-ons display correctly
- [ ] Edit add-on value
- [ ] Save and verify features field updated

### Test 3: Mixed Pricing Types

- [ ] Create InsuranceProvider with multiple product types
- [ ] Private Comprehensive: Bracket pricing
- [ ] Private TOR: Fixed pricing
- [ ] Commercial Comprehensive: Percentage pricing
- [ ] Open in admin
- [ ] Verify all products load correctly
- [ ] Verify correct inputs shown for each type

### Test 4: Market Position

- [ ] Create InsuranceProvider with market_position = "premium"
- [ ] Open in admin
- [ ] Verify market position dropdown shows "Premium"
- [ ] Change to "Budget"
- [ ] Save and verify updated

### Test 5: Empty Configuration

- [ ] Create new InsuranceProvider (no pricing)
- [ ] Open in admin
- [ ] Verify all checkboxes unchecked
- [ ] Enable products and configure
- [ ] Save and verify features field created

### Test 6: Percentage Conversion

- [ ] Create pricing with rate = 0.035 (3.5%)
- [ ] Open in admin
- [ ] Verify rate input shows "3.5"
- [ ] Change to "4.5"
- [ ] Save and verify features.pricing.rate = 0.045

### Test 7: Data Preservation

- [ ] Load existing configuration with brackets + add-ons
- [ ] Edit only one bracket
- [ ] Save
- [ ] Verify other brackets unchanged
- [ ] Verify add-ons unchanged

---

## Benefits

### 1. **No Data Loss**

- Editing existing configurations doesn't clear brackets/add-ons
- All existing data visible in UI before making changes
- Clear visual representation prevents accidental overwrites

### 2. **Guided Editing**

- Admin sees exactly what's configured
- Modal interfaces prevent JSON syntax errors
- Real-time preview shows final output

### 3. **Reduced Manual JSON Editing**

- No need to manually edit features field
- Visual interface for all common operations
- JSON preview for verification only

### 4. **Better UX**

- Checkboxes auto-enable for configured products
- Pricing type auto-selects
- Appropriate inputs shown immediately
- Market position pre-selected

### 5. **Consistency**

- All admins use same visual interface
- Reduces training requirements
- Prevents configuration errors

---

## Technical Notes

### 1. Percentage Handling

**Backend Storage** (decimal):

- `0.035` = 3.5%
- `0.05` = 5%

**UI Display** (percentage):

- `3.5` (displayed with % suffix in label)
- `5` (displayed with % suffix in label)

**Conversion Functions**:

```javascript
// Load: Backend → UI
const displayRate = (backendRate * 100).toFixed(2);

// Save: UI → Backend
const backendRate = parseFloat(uiRate) / 100;
```

### 2. Data Structure Mapping

| UI Element            | pricingData Key    | features.pricing Key |
| --------------------- | ------------------ | -------------------- |
| Pricing Type Dropdown | `pricing_type`     | `pricing_type`       |
| Rate Input            | `rate`             | `rate` (converted)   |
| Base Premium Input    | `base_premium`     | `base_premium`       |
| Min Premium Input     | `min_premium`      | `min_premium`        |
| Max Premium Input     | `max_premium`      | `max_premium`        |
| Configure Brackets    | `brackets` array   | `brackets` array     |
| Add-ons               | `addons` array     | `addons` array       |
| Market Position       | N/A (separate var) | `market_position`    |

### 3. Modal Data Flow

**Brackets Modal**:

```javascript
// Open modal
pricingData[productCode].brackets → render bracket items

// User edits
bracket items → temp array in modal

// Save
temp array → pricingData[productCode].brackets → updatePreview()
```

**Add-ons Modal**:

```javascript
// Open modal
pricingData[productCode].addons → render addon items

// User edits
addon items → temp array in modal

// Save
temp array → pricingData[productCode].addons → updatePreview()
```

---

## Future Enhancements

### 1. Bracket Validation

- Detect overlapping ranges
- Suggest optimal bracket structure
- Gap detection between brackets

### 2. Add-on Templates

- Save common add-on configurations
- Quick apply templates to products
- Bulk add-on management

### 3. Bulk Edit

- Edit same field across multiple products
- Copy pricing from one product to another
- Batch percentage adjustments

### 4. Version History

- Track changes to pricing configurations
- Rollback to previous versions
- Audit trail for compliance

### 5. Import/Export

- Export pricing configuration as JSON/CSV
- Import from other insurers
- Bulk configuration updates

---

## Troubleshooting

### Issue: Pricing data not loading

**Check**:

1. Is `features` field populated?
2. Is JSON valid? (check browser console for parse errors)
3. Are product codes correct? (must match product toggles)

**Solution**:

- Check browser console for errors
- Verify features field in Django admin raw JSON
- Ensure product codes match exactly (case-sensitive)

### Issue: Brackets not showing in modal

**Check**:

1. Is `pricingData[productCode].brackets` an array?
2. Are brackets stored in correct format?

**Solution**:

```javascript
// Verify in browser console
console.log(pricingData["PRIVATE_COMPREHENSIVE"].brackets);
// Should show: [{min_value, max_value, premium}, ...]
```

### Issue: Add-on percentages wrong

**Check**:

1. Is conversion happening on load?
2. Is conversion happening on save?

**Solution**:

- Load: `addon.value * 100` (0.05 → 5)
- Save: `addon.value / 100` (5 → 0.05)

### Issue: Changes not saving

**Check**:

1. Is `featuresTextArea.value` being updated?
2. Is JSON preview showing correct data?

**Solution**:

- Check `updatePreview()` function
- Verify `featuresTextArea` selector is correct
- Check browser console for JavaScript errors

---

## Related Documentation

- [Enhanced Pricing Builder Guide](./ENHANCED_PRICING_BUILDER_GUIDE.md)
- [Comprehensive Pricing System](./COMPREHENSIVE_PRICING_SYSTEM.md)
- [Motor Insurance Endpoints Plan](./MOTOR_INSURANCE_ENDPOINTS_PLAN.md)
- [Database Schema](./db-schema.md)

---

## Conclusion

The pricing builder now seamlessly loads existing configurations from the `features` field, enabling safe editing of bracket-based pricing and add-ons without data loss. The visual interface guides admins through configuration updates while maintaining data integrity and providing real-time validation.

**Key Achievement**: ✅ Minimize manual JSON tampering while providing full editing capabilities through visual interface.

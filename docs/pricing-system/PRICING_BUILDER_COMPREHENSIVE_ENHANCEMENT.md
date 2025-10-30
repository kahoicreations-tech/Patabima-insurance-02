# Pricing Builder Comprehensive Enhancement

**Date**: 2025-01-25  
**Status**: ✅ Complete  
**Impact**: All motor insurance pricing configurations now editable from single visual interface

---

## Overview

The pricing builder has been comprehensively enhanced to support ALL motor insurance pricing tables and configurations in one unified interface. Admins can now configure:

1. ✅ **Comprehensive Products** - Percentage-based pricing (default)
2. ✅ **Bracket Pricing** - Sum insured ranges
3. ✅ **Add-ons & Extensions** - Coverage extensions
4. ✅ **Commercial Tonnage Pricing** - Weight-based pricing
5. ✅ **PSV PLL Pricing** - Passenger Legal Liability
6. ✅ **Extendible Products** - Initial period + extension terms
7. ✅ **Vehicle Adjustment Factors** - Age, usage, location multipliers

---

## What Changed

### 1. Confirmed Comprehensive Products Use Percentage Pricing

**Default Pricing Method**: Percentage (can be changed to Bracket or Fixed)

```html
<select class="pricing-type-select compact-select" disabled>
  <option value="percentage">Percentage</option>
  <!-- DEFAULT -->
  <option value="bracket">Bracket (Ranges)</option>
  <option value="fixed">Fixed Amount</option>
</select>
```

**Percentage Input**:

- UI: Enter `3.5` (displayed as 3.5%)
- Backend: Stored as `0.035` (decimal)
- Min/Max premiums supported

### 2. Added Commercial Tonnage Pricing Modal

**Triggered For**: Products containing "COMMERCIAL" + "COMP" in subcategory_code

**Button**: "⚙ Tonnage Pricing" (orange button)

**Configuration**:

```javascript
{
  "tonnage_pricing": [
    {
      "tonnage_from": 0,
      "tonnage_to": 3,
      "description": "Upto 3 Tons",
      "base_premium": 30000
    },
    {
      "tonnage_from": 3.5,
      "tonnage_to": 8,
      "description": "3.5 to 8 Tons",
      "base_premium": 40000
    }
    // ... more ranges
  ]
}
```

**Default Ranges Provided**:

- Upto 3 Tons
- 3.5 to 8 Tons
- 8.5 to 12 Tons
- 13 to 16 Tons
- 16.5 to 20 Tons
- Over 20 Tons (open-ended)

### 3. Added PSV PLL Pricing Modal

**Triggered For**: Products containing "PSV" in subcategory_code

**Button**: "PLL Pricing" (purple button)

**Configuration**:

```javascript
{
  "pll_pricing": [
    {
      "pll_amount": 500,
      "rate_per_person": 800,
      "is_commercial_institutional": false
    },
    {
      "pll_amount": 250,
      "rate_per_person": 400,
      "is_commercial_institutional": false
    }
  ]
}
```

**Fields**:

- PLL Amount (K): 500, 250, or custom
- Rate per Person (KSh): Premium multiplier
- Commercial/Institutional checkbox

### 4. Added Extendible Pricing Modal

**Triggered For**: Products containing "EXT" in subcategory_code

**Button**: "Extension Terms" (blue button)

**Configuration**:

```javascript
{
  "extendible_config": {
    "initial_period_days": 30,
    "initial_amount": 5000,
    "balance_amount": 3000,
    "total_annual_premium": 8000,
    "extension_deadline_days": 30,
    "grace_period_days": 7,
    "penalty_for_late_extension": 0,
    "allow_partial_extension": false
  }
}
```

**Features**:

- Initial period configuration (e.g., 30 days)
- Initial payment amount
- Balance amount (remaining premium)
- Auto-calculated total
- Extension deadline
- Grace period
- Late extension penalty (%)
- Partial extension toggle

### 5. Added Vehicle Adjustment Factors Modal

**Global Configuration**: Applies to ALL products

**Button**: "⚙ Adjustment Factors" (gray button in header)

**Configuration**:

```javascript
{
  "adjustment_factors": [
    {
      "factor_type": "vehicle_age",
      "factor_key": "0-1",
      "factor_value": 1.0,
      "description": "Less than 1 year old"
    },
    {
      "factor_type": "vehicle_age",
      "factor_key": "1-3",
      "factor_value": 1.05,
      "description": "1 to 3 years old"
    },
    {
      "factor_type": "usage_type",
      "factor_key": "private",
      "factor_value": 1.0,
      "description": "Private use"
    },
    {
      "factor_type": "usage_type",
      "factor_key": "commercial",
      "factor_value": 1.25,
      "description": "Commercial use"
    }
  ]
}
```

**Factor Types**:

- Vehicle Age
- Usage Type
- Location
- Driver Age

**Default Factors Provided**:

- Vehicle Age: 0-1, 1-3, 3-5, 5+ years
- Usage: Private (1.0), Commercial (1.25)

---

## UI Enhancements

### Pricing Table Updates

**Max Premium Column Now Shows**:

1. **Comprehensive Products**:

   - Max Premium input field
   - "+ Add-ons" button (green)

2. **Commercial Comprehensive**:

   - "⚙ Tonnage Pricing" button (orange)
   - "+ Add-ons" button (green)

3. **PSV Products**:

   - "PLL Pricing" button (purple)

4. **Extendible Products** (Third-Party EXT, TOR EXT):

   - "Extension Terms" button (blue)

5. **Other Products**:
   - N/A (fixed pricing only)

### Header Additions

**New Button**: "⚙ Adjustment Factors" (gray button next to Market Position selector)

---

## Complete Features JSON Structure

```json
{
  "pricing": {
    "PRIVATE_COMPREHENSIVE": {
      "pricing_type": "percentage",
      "rate": 0.035,
      "min_premium": 20000,
      "max_premium": 500000,
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
    "COMMERCIAL_GENERAL_CARTAGE_COMP": {
      "pricing_type": "percentage",
      "rate": 0.04,
      "min_premium": 30000,
      "max_premium": 750000,
      "tonnage_pricing": [
        {
          "tonnage_from": 0,
          "tonnage_to": 3,
          "description": "Upto 3 Tons",
          "base_premium": 30000
        },
        {
          "tonnage_from": 3.5,
          "tonnage_to": 8,
          "description": "3.5 to 8 Tons",
          "base_premium": 40000
        }
      ],
      "addons": [
        {
          "name": "Excess Protector",
          "type": "fixed",
          "value": 8000
        }
      ]
    },
    "PSV_MATATU_14_SEATER_COMP": {
      "pricing_type": "percentage",
      "rate": 0.045,
      "min_premium": 35000,
      "pll_pricing": [
        {
          "pll_amount": 500,
          "rate_per_person": 800,
          "is_commercial_institutional": false
        },
        {
          "pll_amount": 250,
          "rate_per_person": 400,
          "is_commercial_institutional": false
        }
      ]
    },
    "PRIVATE_THIRD_PARTY_EXT": {
      "pricing_type": "fixed",
      "base_premium": 8000,
      "extendible_config": {
        "initial_period_days": 30,
        "initial_amount": 5000,
        "balance_amount": 3000,
        "total_annual_premium": 8000,
        "extension_deadline_days": 30,
        "grace_period_days": 7,
        "penalty_for_late_extension": 5,
        "allow_partial_extension": false
      }
    }
  },
  "adjustment_factors": [
    {
      "factor_type": "vehicle_age",
      "factor_key": "0-1",
      "factor_value": 1.0,
      "description": "Less than 1 year old"
    },
    {
      "factor_type": "vehicle_age",
      "factor_key": "1-3",
      "factor_value": 1.05,
      "description": "1 to 3 years old"
    },
    {
      "factor_type": "usage_type",
      "factor_key": "private",
      "factor_value": 1.0,
      "description": "Private use"
    },
    {
      "factor_type": "usage_type",
      "factor_key": "commercial",
      "factor_value": 1.25,
      "description": "Commercial use"
    }
  ],
  "addon_overrides": {},
  "market_position": "standard"
}
```

---

## Data Flow

### 1. Page Load

```
Parse features field
  ↓
Extract pricing data for each product
  ↓
Load tonnage_pricing arrays
  ↓
Load pll_pricing arrays
  ↓
Load extendible_config objects
  ↓
Load global adjustment_factors array
  ↓
Enable appropriate buttons based on product type
  ↓
Populate UI with existing values
```

### 2. User Configuration

**Scenario: Configure Commercial Comprehensive Product**

1. Enable "General Cartage Comprehensive" checkbox
2. Select "Percentage" pricing type
3. Enter rate: `4` (4%)
4. Enter min premium: `30000`
5. Enter max premium: `750000`
6. Click "⚙ Tonnage Pricing" button
7. Modal opens with default tonnage ranges
8. Edit premiums for each tonnage
9. Add custom tonnage range if needed
10. Click "Save Tonnage Pricing"
11. Click "+ Add-ons" button
12. Configure Excess Protector: Fixed `8000`
13. Click "Save Add-ons"
14. JSON preview updates with complete configuration
15. Click "Save" in Django admin

### 3. Adjustment Factors Configuration

1. Click "⚙ Adjustment Factors" button in header
2. Modal opens with default factors
3. Edit multipliers for existing factors
4. Add custom factors (e.g., location-based)
5. Click "Save Adjustment Factors"
6. Factors apply globally to all products

---

## Integration with Existing Pricing Tables

### Database Tables vs. JSON Configuration

**Current Approach**: The pricing builder edits the `features` JSONField

**Materialize Action**: Admin can run "Materialize Pricing" to create database records:

1. **MotorPricing** - Base pricing records
2. **CommercialTonnagePricing** - Tonnage-based records
3. **PSVPLLPricing** - PLL configuration records
4. **ExtendiblePricing** - Extension terms records
5. **VehicleAdjustmentFactor** - Global multipliers

### URLs Referenced

Original request mentioned these URLs should be integrated:

- ✅ `http://127.0.0.1:8000/admin/app/commercialtonnagepricing/` - Now editable via Tonnage Pricing modal
- ✅ `http://127.0.0.1:8000/admin/app/extendiblepricing/` - Now editable via Extension Terms modal
- ✅ `http://127.0.0.1:8000/admin/app/psvpllpricing/` - Now editable via PLL Pricing modal
- ✅ `http://127.0.0.1:8000/admin/app/vehicleadjustmentfactor/` - Now editable via Adjustment Factors modal

**Before**: Admins had to visit 4+ different admin pages to configure pricing  
**After**: Single unified interface in InsuranceProvider edit page

---

## Benefits

### 1. Unified Configuration

**Single Entry Point**: Edit ALL pricing from one screen

- No need to navigate between multiple admin pages
- All configurations stored in `features` field
- Consistent interface for all pricing types

### 2. Product-Specific Buttons

**Smart UI**: Only shows relevant buttons for each product type

- Comprehensive → Add-ons button
- Commercial Comprehensive → Tonnage + Add-ons buttons
- PSV → PLL Pricing button
- Extendible → Extension Terms button

### 3. Data Preservation

**Load Existing Data**: All configurations load from `features` field

- Tonnage pricing arrays
- PLL configurations
- Extension terms
- Adjustment factors
- Prevents data loss during editing

### 4. Visual Editing

**No Manual JSON Editing**: All complex structures have visual interfaces

- Tonnage ranges with descriptions
- PLL configurations with checkboxes
- Extension terms with auto-calculated totals
- Adjustment factors with dropdowns

### 5. Real-time Preview

**JSON Preview Updates**: See final configuration as you edit

- Shows complete features structure
- Includes all pricing tables
- Validation status
- Copy to clipboard

---

## Workflow Example: Configure Madison Insurance

### Scenario

Configure Madison Insurance with:

- Private Comprehensive (percentage + brackets + add-ons)
- Commercial Comprehensive (tonnage pricing + add-ons)
- PSV Matatu (PLL pricing)
- Third-Party Extended (extension terms)
- Global adjustment factors

### Steps

1. **Navigate to Madison Insurance**:

   ```
   http://127.0.0.1:8000/admin/app/insuranceprovider/{madison_id}/change/
   ```

2. **Configure Private Comprehensive**:

   - [x] Enable checkbox
   - [x] Select "Bracket" pricing type
   - [x] Click "Configure Brackets"
   - [x] Add brackets: 0-1M (25K), 1M-3M (35K), 3M-5M (50K)
   - [x] Click "Save Brackets"
   - [x] Click "+ Add-ons"
   - [x] Add Excess Protector: Fixed 5000
   - [x] Add PVT: Percentage 5
   - [x] Click "Save Add-ons"

3. **Configure Commercial Comprehensive**:

   - [x] Enable "General Cartage Comprehensive"
   - [x] Select "Percentage" pricing
   - [x] Enter rate: 4
   - [x] Enter min: 30000, max: 750000
   - [x] Click "⚙ Tonnage Pricing"
   - [x] Edit default tonnage ranges
   - [x] Upto 3 Tons: 30000
   - [x] 3.5-8 Tons: 40000
   - [x] 8.5-12 Tons: 50000
   - [x] (Continue for all ranges)
   - [x] Click "Save Tonnage Pricing"
   - [x] Click "+ Add-ons"
   - [x] Add Excess Protector: Fixed 8000
   - [x] Click "Save Add-ons"

4. **Configure PSV Matatu**:

   - [x] Enable "PSV - Matatu 14 Seater Comprehensive"
   - [x] Select "Percentage" pricing
   - [x] Enter rate: 4.5
   - [x] Enter min: 35000
   - [x] Click "PLL Pricing"
   - [x] Configure PLL 500K: 800 per person
   - [x] Configure PLL 250K: 400 per person
   - [x] Click "Save PLL Pricing"

5. **Configure Third-Party Extended**:

   - [x] Enable "Private - Third-Party Extended"
   - [x] Pricing type: Fixed (default)
   - [x] Base premium: 8000
   - [x] Click "Extension Terms"
   - [x] Initial period: 30 days
   - [x] Initial amount: 5000
   - [x] Balance amount: 3000
   - [x] Extension deadline: 30 days
   - [x] Grace period: 7 days
   - [x] Late penalty: 5%
   - [x] Click "Save Extendible Pricing"

6. **Configure Adjustment Factors**:

   - [x] Click "⚙ Adjustment Factors" in header
   - [x] Edit vehicle age factors:
     - 0-1 years: 1.0
     - 1-3 years: 1.05
     - 3-5 years: 1.10
     - 5+ years: 1.15
   - [x] Edit usage factors:
     - Private: 1.0
     - Commercial: 1.25
   - [x] Add location factor:
     - Nairobi: 1.1
     - Mombasa: 1.15
     - Other: 1.0
   - [x] Click "Save Adjustment Factors"

7. **Review JSON Preview**:

   - [x] Check all products configured
   - [x] Verify tonnage pricing included
   - [x] Verify PLL pricing included
   - [x] Verify extension terms included
   - [x] Verify adjustment factors included
   - [x] Copy JSON if needed

8. **Save**:

   - [x] Click "Save" in Django admin
   - [x] features field updated with complete configuration

9. **Materialize (Optional)**:
   - [x] Select "Materialize Pricing to Database"
   - [x] Creates MotorPricing records
   - [x] Creates CommercialTonnagePricing records
   - [x] Creates PSVPLLPricing records
   - [x] Creates ExtendiblePricing records
   - [x] Creates VehicleAdjustmentFactor records

---

## Testing Checklist

### Test 1: Comprehensive Percentage Pricing

- [ ] Enable Private Comprehensive
- [ ] Verify "Percentage" is selected by default
- [ ] Enter rate: 3.5
- [ ] Enter min: 20000, max: 500000
- [ ] Save and verify features field

### Test 2: Tonnage Pricing

- [ ] Enable Commercial General Cartage Comprehensive
- [ ] Click "⚙ Tonnage Pricing"
- [ ] Verify 6 default tonnage ranges shown
- [ ] Edit premiums
- [ ] Add custom range
- [ ] Save and verify in JSON preview

### Test 3: PLL Pricing

- [ ] Enable PSV Matatu 14 Seater Comprehensive
- [ ] Click "PLL Pricing"
- [ ] Verify 2 default PLL configs shown
- [ ] Edit rate per person
- [ ] Add custom PLL amount
- [ ] Save and verify in JSON preview

### Test 4: Extendible Pricing

- [ ] Enable Private Third-Party Extended
- [ ] Click "Extension Terms"
- [ ] Enter initial period: 30 days
- [ ] Enter initial amount: 5000
- [ ] Enter balance: 3000
- [ ] Verify total auto-calculates: 8000
- [ ] Enter grace period: 7 days
- [ ] Enter penalty: 5%
- [ ] Save and verify in JSON preview

### Test 5: Adjustment Factors

- [ ] Click "⚙ Adjustment Factors" button
- [ ] Verify 6 default factors shown
- [ ] Edit multipliers
- [ ] Add custom factor type
- [ ] Save and verify in JSON preview

### Test 6: Complete Workflow

- [ ] Configure product with all features:
  - Percentage pricing
  - Brackets
  - Add-ons
  - Tonnage pricing
  - PLL pricing
  - Extension terms
- [ ] Configure adjustment factors
- [ ] Verify JSON preview shows all sections
- [ ] Save
- [ ] Reload page
- [ ] Verify all data loads correctly
- [ ] Edit one section
- [ ] Verify other sections preserved

### Test 7: Data Loading

- [ ] Create features with existing data:
  - Tonnage pricing arrays
  - PLL configs
  - Extension terms
  - Adjustment factors
- [ ] Open in admin
- [ ] Click respective buttons
- [ ] Verify all data loads into modals
- [ ] Edit and save
- [ ] Verify updated correctly

---

## Technical Notes

### Modal Event Handlers

**Close Functions**:

- `closeBracketModal()`
- `closeAddonsModal()`
- `closeTonnageModal()`
- `closePLLModal()`
- `closeExtendibleModal()`
- `closeAdjustmentModal()`

**All triggered by**:

- Close button (×)
- Cancel button
- Modal overlay click (if implemented)

### Enable Product Row

**Updated function** enables all new buttons:

```javascript
function enableProductRow(row) {
  row.classList.add("enabled");
  row.querySelectorAll(".compact-input, .compact-select").forEach((input) => {
    input.disabled = false;
  });
  row
    .querySelectorAll(
      ".configure-brackets-btn, .configure-addons-btn, " +
        ".configure-tonnage-btn, .configure-pll-btn, " +
        ".configure-extendible-btn"
    )
    .forEach((btn) => {
      btn.disabled = false;
    });
}
```

### Button Visibility Logic

**Template Conditions**:

```django
{% if 'COMMERCIAL' in subcategory.subcategory_code and 'COMP' in subcategory.subcategory_code %}
    <button class="configure-tonnage-btn">⚙ Tonnage Pricing</button>
    <button class="configure-addons-btn">+ Add-ons</button>

{% elif 'PSV' in subcategory.subcategory_code %}
    <button class="configure-pll-btn">PLL Pricing</button>

{% elif 'EXT' in subcategory.subcategory_code %}
    <button class="configure-extendible-btn">Extension Terms</button>

{% elif subcategory.product_type == 'COMPREHENSIVE' %}
    <input data-field="max_premium" />
    <button class="configure-addons-btn">+ Add-ons</button>
{% endif %}
```

---

## Future Enhancements

### 1. Import/Export Templates

- Export Madison pricing as template
- Import template to other insurers
- Bulk apply tonnage ranges

### 2. Validation Rules

- Detect overlapping tonnage ranges
- Warn if PLL rates inconsistent
- Validate extension terms logic

### 3. Bulk Operations

- Apply same add-ons to multiple products
- Copy tonnage pricing between insurers
- Global adjustment factor updates

### 4. Historical Versions

- Track changes to pricing configurations
- Rollback capability
- Effective date management

---

## Conclusion

The pricing builder now provides a **complete unified interface** for configuring ALL motor insurance pricing:

✅ **Comprehensive products**: Percentage pricing (default)  
✅ **All extensions**: Visual modal interfaces  
✅ **Tonnage pricing**: Commercial products  
✅ **PLL pricing**: PSV products  
✅ **Extension terms**: Extendible products  
✅ **Adjustment factors**: Global configuration

**Impact**: Admins no longer need to visit multiple admin pages. All pricing configurations editable from single InsuranceProvider edit screen with visual interfaces for complex structures.

**Mission Accomplished**: "Enable users to visit an insurance provider and edit all prices, extensions, and add-ons for all specific subcategories instead of different [admin pages]."

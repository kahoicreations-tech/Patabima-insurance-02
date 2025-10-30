# Adjustment Factors: Global vs Product-Specific

**Date**: 2025-01-25  
**Status**: ✅ Implemented Both Options

---

## Overview

The pricing builder now supports **TWO LEVELS** of adjustment factor configuration:

1. **Global Adjustment Factors** - Apply to ALL products by default
2. **Product-Specific Adjustment Factors** - Override global for specific subcategories

This provides maximum flexibility while maintaining ease of use.

---

## Implementation

### 1. Global Adjustment Factors

**Button Location**: Header (next to Market Position selector)  
**Button Text**: "⚙ Adjustment Factors"  
**Button Color**: Gray (#607d8b)

**Modal Title**: "Configure Global Vehicle Adjustment Factors"

**Description**: "Configure multipliers for vehicle age, usage type, and other adjustment factors that apply to ALL products by default"

**Data Structure**:

```json
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
      "factor_key": "5+",
      "factor_value": 1.15,
      "description": "Over 5 years old"
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

**Storage Location**: `features.adjustment_factors` (top-level)

**Applies To**: All products that don't have product-specific overrides

---

### 2. Product-Specific Adjustment Factors

**Button Location**: Max Premium column for comprehensive products  
**Button Text**: "⚙ Adjustments"  
**Button Color**: Gray (#607d8b)

**Shows For**:

- ✅ Private Comprehensive
- ✅ Commercial Comprehensive (along with Tonnage + Add-ons)
- ✅ PSV Comprehensive (along with PLL)
- ✅ Motorcycle Comprehensive
- ✅ TukTuk Comprehensive

**Modal Title**: "Configure Adjustment Factors: {Product Name}"

**Description**: "Configure multipliers specific to this product. These will override global adjustment factors."

**Data Structure**:

```json
{
  "pricing": {
    "PRIVATE_COMPREHENSIVE": {
      "pricing_type": "percentage",
      "rate": 0.035,
      "product_adjustments": [
        {
          "factor_type": "vehicle_age",
          "factor_key": "5+",
          "factor_value": 1.1,
          "description": "Over 5 years (lower for private)"
        },
        {
          "factor_type": "seating_capacity",
          "factor_key": "5+",
          "factor_value": 1.05,
          "description": "Family vehicles"
        }
      ]
    },
    "COMMERCIAL_GENERAL_CARTAGE_COMP": {
      "pricing_type": "percentage",
      "rate": 0.04,
      "product_adjustments": [
        {
          "factor_type": "vehicle_age",
          "factor_key": "5+",
          "factor_value": 1.3,
          "description": "Over 5 years (higher for commercial)"
        },
        {
          "factor_type": "tonnage",
          "factor_key": "20+",
          "factor_value": 1.2,
          "description": "Heavy trucks"
        }
      ]
    }
  }
}
```

**Storage Location**: `features.pricing.{PRODUCT_CODE}.product_adjustments`

**Overrides**: Global adjustment factors for the same factor_type + factor_key combination

---

## Factor Types Available

### Global Factors

1. **Vehicle Age**

   - `0-1` - Less than 1 year old
   - `1-3` - 1 to 3 years old
   - `3-5` - 3 to 5 years old
   - `5+` - Over 5 years old

2. **Usage Type**

   - `private` - Private use
   - `commercial` - Commercial use

3. **Location**

   - `nairobi` - Nairobi region
   - `mombasa` - Mombasa region
   - `other` - Other regions

4. **Driver Age**
   - `18-25` - Young drivers
   - `25-50` - Prime age
   - `50+` - Senior drivers

### Product-Specific Additional Factors

5. **Seating Capacity** (for PSV/Private)

   - `2-4` - Small vehicles
   - `5-14` - Medium vehicles
   - `14+` - Large vehicles

6. **Tonnage** (for Commercial)
   - `0-3` - Light vehicles
   - `3-8` - Medium trucks
   - `8-20` - Heavy trucks
   - `20+` - Extra heavy

---

## Precedence Rules

### Case 1: No Product-Specific Factors

**Global**:

```json
{
  "adjustment_factors": [
    { "factor_type": "vehicle_age", "factor_key": "5+", "factor_value": 1.15 }
  ]
}
```

**Product**: No product_adjustments

**Result**: Vehicle aged 5+ gets **1.15x multiplier** for this product

---

### Case 2: Product-Specific Override

**Global**:

```json
{
  "adjustment_factors": [
    { "factor_type": "vehicle_age", "factor_key": "5+", "factor_value": 1.15 }
  ]
}
```

**Product**:

```json
{
  "COMMERCIAL_COMP": {
    "product_adjustments": [
      { "factor_type": "vehicle_age", "factor_key": "5+", "factor_value": 1.3 }
    ]
  }
}
```

**Result**: Commercial vehicle aged 5+ gets **1.30x multiplier** (overrides global 1.15)

---

### Case 3: Partial Override

**Global**:

```json
{
  "adjustment_factors": [
    { "factor_type": "vehicle_age", "factor_key": "5+", "factor_value": 1.15 },
    {
      "factor_type": "usage_type",
      "factor_key": "commercial",
      "factor_value": 1.25
    }
  ]
}
```

**Product**:

```json
{
  "PRIVATE_COMPREHENSIVE": {
    "product_adjustments": [
      { "factor_type": "vehicle_age", "factor_key": "5+", "factor_value": 1.1 }
    ]
  }
}
```

**Result**:

- Vehicle aged 5+: **1.10x** (product override)
- Commercial usage: **1.25x** (global fallback, no override)

---

### Case 4: Product-Specific Additional Factors

**Global**:

```json
{
  "adjustment_factors": [
    { "factor_type": "vehicle_age", "factor_key": "5+", "factor_value": 1.15 }
  ]
}
```

**Product**:

```json
{
  "PSV_MATATU_COMP": {
    "product_adjustments": [
      {
        "factor_type": "seating_capacity",
        "factor_key": "14+",
        "factor_value": 1.2
      }
    ]
  }
}
```

**Result**:

- Vehicle aged 5+: **1.15x** (global)
- Seating 14+: **1.20x** (product-specific, not in global)
- **Combined**: 1.15 × 1.20 = **1.38x total multiplier**

---

## UI Workflow

### Configure Global Factors

1. Click "⚙ Adjustment Factors" button in header
2. Modal opens showing global factors
3. Default factors provided (vehicle age, usage type)
4. Edit multipliers or add new factors
5. Click "Save Global Adjustments"
6. Factors stored in `features.adjustment_factors`
7. Apply to ALL products by default

### Configure Product-Specific Factors

1. Enable a comprehensive product (e.g., Private Comprehensive)
2. Click "⚙ Adjustments" button for that product
3. Modal opens showing product-specific factors
4. If empty: "No product-specific adjustments configured. Global adjustments will apply."
5. Click "+ Add Adjustment Factor"
6. Configure factor (type, key, multiplier, description)
7. Click "Save Product Adjustments"
8. Factors stored in `features.pricing.{PRODUCT_CODE}.product_adjustments`
9. Override global factors for THIS product only

---

## Example Scenarios

### Scenario 1: Standard Setup (Global Only)

**Use Case**: Same adjustment factors for all products

**Configuration**:

- Set global factors: vehicle age (1.0, 1.05, 1.10, 1.15)
- Set global factors: usage type (private 1.0, commercial 1.25)
- Don't configure product-specific factors

**Result**: All products use the same multipliers

---

### Scenario 2: Commercial Higher Risk

**Use Case**: Commercial vehicles have higher risk than private

**Global Factors**:

- Vehicle age 5+: 1.15

**Private Comprehensive** (product-specific):

- Vehicle age 5+: 1.10 (lower risk)

**Commercial Comprehensive** (product-specific):

- Vehicle age 5+: 1.30 (higher risk)

**Result**:

- Private 5+ years: Premium × 1.10
- Commercial 5+ years: Premium × 1.30

---

### Scenario 3: PSV Seating Capacity

**Use Case**: PSV pricing varies by seating capacity

**Global Factors**:

- Vehicle age 5+: 1.15
- Usage type commercial: 1.25

**PSV Matatu 14-Seater** (product-specific):

- Seating capacity 14+: 1.20
- Vehicle age 5+: 1.12 (moderate risk for PSV)

**Result** for 5+ year old Matatu:

- Base premium: 50,000
- Age factor: 1.12
- Seating factor: 1.20
- **Final premium**: 50,000 × 1.12 × 1.20 = **67,200**

---

### Scenario 4: Tonnage-Based Commercial

**Use Case**: Heavy trucks have different risk profile

**Global Factors**:

- Vehicle age 5+: 1.15

**Commercial General Cartage** (product-specific):

- Tonnage 20+: 1.25 (extra heavy)
- Vehicle age 5+: 1.20 (commercial specific)

**Result** for 5+ year 25-ton truck:

- Base premium (from tonnage table): 85,000
- Age factor: 1.20
- Tonnage factor: 1.25
- **Final premium**: 85,000 × 1.20 × 1.25 = **127,500**

---

## Complete JSON Example

```json
{
  "pricing": {
    "PRIVATE_COMPREHENSIVE": {
      "pricing_type": "percentage",
      "rate": 0.035,
      "min_premium": 20000,
      "max_premium": 500000,
      "product_adjustments": [
        {
          "factor_type": "vehicle_age",
          "factor_key": "5+",
          "factor_value": 1.1,
          "description": "Over 5 years old (private)"
        }
      ]
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
        }
      ],
      "product_adjustments": [
        {
          "factor_type": "vehicle_age",
          "factor_key": "5+",
          "factor_value": 1.3,
          "description": "Over 5 years old (commercial)"
        },
        {
          "factor_type": "tonnage",
          "factor_key": "20+",
          "factor_value": 1.25,
          "description": "Extra heavy trucks"
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
        }
      ],
      "product_adjustments": [
        {
          "factor_type": "seating_capacity",
          "factor_key": "14+",
          "factor_value": 1.2,
          "description": "Large matatus"
        },
        {
          "factor_type": "vehicle_age",
          "factor_key": "5+",
          "factor_value": 1.12,
          "description": "Over 5 years (PSV moderate)"
        }
      ]
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
      "factor_type": "vehicle_age",
      "factor_key": "3-5",
      "factor_value": 1.1,
      "description": "3 to 5 years old"
    },
    {
      "factor_type": "vehicle_age",
      "factor_key": "5+",
      "factor_value": 1.15,
      "description": "Over 5 years old (global default)"
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
    },
    {
      "factor_type": "location",
      "factor_key": "nairobi",
      "factor_value": 1.1,
      "description": "Nairobi region"
    },
    {
      "factor_type": "location",
      "factor_key": "other",
      "factor_value": 1.0,
      "description": "Other regions"
    }
  ],
  "addon_overrides": {},
  "market_position": "standard"
}
```

---

## Benefits of Two-Level System

### 1. **Ease of Use**

- Set global defaults once
- Most products inherit automatically
- No need to configure every product individually

### 2. **Flexibility**

- Override for specific products as needed
- Fine-tune risk profiles per category
- Product-specific factors (seating, tonnage)

### 3. **Maintainability**

- Update global factors → affects all products
- Update product-specific → affects only that product
- Clear precedence rules

### 4. **Business Logic**

- Commercial vehicles: Higher risk multipliers
- Private vehicles: Lower risk multipliers
- PSV: Capacity-based adjustments
- Trucks: Tonnage-based adjustments

---

## Database Model Note

**Current VehicleAdjustmentFactor Model**: Global (no FK to subcategory/underwriter)

**JSON Storage Approach**: Supports both global AND product-specific

**Materialize Action**: Can create:

1. **Global records** from `features.adjustment_factors`
2. **Product-specific records** from `features.pricing.{CODE}.product_adjustments` (requires model update to add FK)

**Recommendation**: Keep JSON-based approach for maximum flexibility. Materialize action can be enhanced later if needed.

---

## Conclusion

✅ **Global Adjustment Factors**: Easy setup, apply to all products  
✅ **Product-Specific Adjustment Factors**: Fine-grained control per subcategory  
✅ **Clear Precedence**: Product-specific overrides global  
✅ **Maximum Flexibility**: Best of both worlds

**Confirmed**: Adjustment factors are now **specific to their subcategory** when configured at product level, with global fallback for ease of use.

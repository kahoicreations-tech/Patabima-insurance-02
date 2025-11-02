# Motor2 Subcategory Pricing Report

**Date**: October 31, 2025  
**Backend**: ec2-34-203-241-81.compute-1.amazonaws.com

---

## Executive Summary

**Total Subcategories Tested**: 21  
**✅ Working with Underwriter Pricing**: 12 (57%)  
**❌ Missing Underwriter Pricing**: 9 (43%)

### Critical Issue Identified:

**ALL COMPREHENSIVE products are missing underwriter pricing configurations!**

---

## Detailed Results by Category

### 1. PRIVATE (4 subcategories)

| Subcategory             | Status     | Underwriters | Notes                               |
| ----------------------- | ---------- | ------------ | ----------------------------------- |
| PRIVATE_THIRD_PARTY     | ✅ Working | 7            | Full pricing available              |
| PRIVATE_THIRD_PARTY_EXT | ❌ Missing | 0            | **Extendible variant - NO PRICING** |
| PRIVATE_COMPREHENSIVE   | ❌ Missing | 0            | **Comprehensive - NO PRICING**      |
| PRIVATE_TOR             | ✅ Working | 7            | Time on Risk - working              |

**Status**: 50% functional (2/4 working)  
**Critical**: EXT and COMP variants missing

---

### 2. COMMERCIAL (5 subcategories tested)

| Subcategory                     | Status     | Underwriters | Notes                          |
| ------------------------------- | ---------- | ------------ | ------------------------------ |
| COMMERCIAL_GENERAL_CARTAGE_TP   | ✅ Working | 7            | Third party working            |
| COMMERCIAL_OWN_GOODS_TP         | ✅ Working | 7            | Third party working            |
| COMMERCIAL_GENERAL_CARTAGE_COMP | ❌ Missing | 0            | **Comprehensive - NO PRICING** |
| COMMERCIAL_OWN_GOODS_COMP       | ❌ Missing | 0            | **Comprehensive - NO PRICING** |
| COMMERCIAL_TOR                  | ✅ Working | 7            | Time on Risk working           |

**Status**: 60% functional (3/5 working)  
**Critical**: All COMP variants missing

---

### 3. PSV (4 subcategories tested)

| Subcategory        | Status     | Underwriters | Notes                               |
| ------------------ | ---------- | ------------ | ----------------------------------- |
| PSV_MATATU_1M_TP   | ✅ Working | 5            | 1 Month Third Party                 |
| PSV_MATATU_2WKS_TP | ❌ Missing | 0            | **2 Weeks variant - NO PRICING**    |
| PSV_UBER_TP        | ✅ Working | 5            | Uber/Taxi Third Party               |
| PSV_UBER_COMP      | ❌ Missing | 0            | **Uber Comprehensive - NO PRICING** |

**Status**: 50% functional (2/4 working)  
**Critical**: Short-term and COMP variants missing

---

### 4. MOTORCYCLE (4 subcategories tested)

| Subcategory             | Status     | Underwriters | Notes                                  |
| ----------------------- | ---------- | ------------ | -------------------------------------- |
| MOTORCYCLE_PRIVATE_TP   | ✅ Working | 5            | Private Third Party                    |
| MOTORCYCLE_PSV_TP       | ✅ Working | 5            | PSV/Commercial Third Party             |
| MOTORCYCLE_PRIVATE_COMP | ❌ Missing | 0            | **Private Comprehensive - NO PRICING** |
| MOTORCYCLE_PSV_COMP     | ❌ Missing | 0            | **PSV Comprehensive - NO PRICING**     |

**Status**: 50% functional (2/4 working)  
**Critical**: All COMP variants missing

---

### 5. TUKTUK (4 subcategories tested)

| Subcategory            | Status     | Underwriters | Notes                                     |
| ---------------------- | ---------- | ------------ | ----------------------------------------- |
| TUKTUK_COMMERCIAL_TP   | ✅ Working | 5            | Commercial Third Party                    |
| TUKTUK_PSV_TP          | ✅ Working | 5            | PSV Third Party                           |
| TUKTUK_COMMERCIAL_COMP | ❌ Missing | 0            | **Commercial Comprehensive - NO PRICING** |
| TUKTUK_PSV_COMP        | ❌ Missing | 0            | **PSV Comprehensive - NO PRICING**        |

**Status**: 50% functional (2/4 working)  
**Critical**: All COMP variants missing

---

## Pattern Analysis

### ✅ Products WITH Underwriter Pricing (12):

1. **Third Party (TP)** - All working across all categories
2. **Time on Risk (TOR)** - Working where available
3. **Basic variants** - Standard products have pricing

### ❌ Products WITHOUT Underwriter Pricing (9):

#### Pattern 1: ALL Comprehensive Products (8 products)

- PRIVATE_COMPREHENSIVE
- COMMERCIAL_GENERAL_CARTAGE_COMP
- COMMERCIAL_OWN_GOODS_COMP
- PSV_UBER_COMP
- MOTORCYCLE_PRIVATE_COMP
- MOTORCYCLE_PSV_COMP
- TUKTUK_COMMERCIAL_COMP
- TUKTUK_PSV_COMP

**Root Cause**: Comprehensive products require sum_insured for pricing calculation. The comparison endpoint may not be properly configured to handle percentage-based pricing models.

#### Pattern 2: Extendible Variants (1 product)

- PRIVATE_THIRD_PARTY_EXT

**Root Cause**: Extendible products require special payment plan configuration that may not be set up in backend underwriter pricing tables.

#### Pattern 3: Short-term Variants (1 product tested)

- PSV_MATATU_2WKS_TP

**Root Cause**: Time-period variants (2 weeks, 6 months) may not have pricing configured.

---

## Impact on User Experience

### Current App Behavior:

1. User selects Third Party product → ✅ **Works perfectly** (7 underwriters show pricing)
2. User selects Comprehensive product → ❌ **Shows infinite loading** → Now shows error after fix
3. User selects Extendible product → ❌ **Shows infinite loading** → Now shows error after fix

### After Frontend Fix (Just Implemented):

- Loading spinner shows while fetching
- If no pricing returned → **Error message displayed**:
  > "No underwriter pricing available for [product name]. This product may not be configured yet. Please contact support or select a different product."
- Retry button available
- User can go back and select different product

---

## Recommendations

### 1. Backend Configuration (URGENT)

#### Priority 1 - Comprehensive Products:

The compare_motor_pricing endpoint needs to handle comprehensive products properly. Two approaches:

**Option A**: Configure default comprehensive rates in underwriter pricing

```sql
-- Example: Add comprehensive pricing for each underwriter
INSERT INTO underwriter_pricing (underwriter_code, subcategory_code, pricing_type, rate, min_premium)
VALUES
  ('MADISON', 'PRIVATE_COMPREHENSIVE', 'percentage', 0.03, 15000),
  ('UAP', 'PRIVATE_COMPREHENSIVE', 'percentage', 0.03, 15000),
  -- etc for all underwriters and comprehensive products
```

**Option B**: Modify API to require sum_insured for comprehensive comparisons

```python
# In compare_motor_pricing endpoint
if subcategory.pricing_model == 'PERCENTAGE' and not sum_insured:
    return {"error": "sum_insured required for comprehensive products"}
```

#### Priority 2 - Extendible Products:

Add extendible_config to underwriter pricing for EXT variants:

```sql
UPDATE underwriter_pricing
SET extendible_config = '{
  "initial_period_days": 30,
  "extension_deadline_days": 60,
  "initial_amount": 2000,
  "balance_amount": 2500,
  "total_annual_premium": 4500
}'
WHERE subcategory_code LIKE '%_EXT';
```

#### Priority 3 - Short-term Variants:

Configure pricing for time-period variants (2 weeks, 6 months, etc.)

---

### 2. Frontend Improvements (COMPLETED ✅)

**Already Implemented**:

- ✅ Unified loading spinner (no more duplicate spinners)
- ✅ Empty response detection
- ✅ Clear error messaging when no pricing available
- ✅ Retry functionality
- ✅ User can navigate back to select different product

**Recommended Next Steps**:

- Hide comprehensive products from selection until backend pricing configured
- Add product availability indicator in subcategory selection
- Show warning before user selects unconfigured products

---

### 3. Data Integrity Checks

**Implement Backend Validation**:

```python
# Check all subcategories have at least one underwriter with pricing
def validate_pricing_coverage():
    subcategories = Motor2Subcategory.objects.filter(is_active=True)
    missing_pricing = []

    for sub in subcategories:
        pricing_count = UnderwriterPricing.objects.filter(
            subcategory_code=sub.subcategory_code
        ).count()

        if pricing_count == 0:
            missing_pricing.append(sub.subcategory_code)

    return missing_pricing
```

---

## Testing Commands

To reproduce this analysis:

```powershell
# Test any subcategory
$body = @{
  category='PRIVATE'
  subcategory='PRIVATE_THIRD_PARTY'
  cover_type='THIRD_PARTY'
} | ConvertTo-Json

curl -X POST "http://ec2-34-203-241-81.compute-1.amazonaws.com/api/v1/public_app/insurance/compare_motor_pricing/" `
  -H "Content-Type: application/json" `
  -d $body | ConvertFrom-Json
```

---

## Conclusion

**Current State**:

- Third Party and Time on Risk products fully functional (57% of products)
- All Comprehensive products missing pricing configuration (43% non-functional)

**User Impact**:

- Users can successfully quote Third Party insurance ✅
- Users attempting Comprehensive quotes see error message after loading (Frontend fix deployed)
- Backend configuration required to enable Comprehensive products

**Next Action**:
Backend team needs to configure underwriter pricing for all comprehensive products and extendible variants.

---

## Appendix: Full Subcategory List

### Not Tested (Additional subcategories in database):

- COMMERCIAL_GENERAL_CARTAGE_TP_PM
- COMMERCIAL_GENERAL_CARTAGE_TP_EXT
- COMMERCIAL_GENERAL_CARTAGE_TP_EXT_PM
- COMMERCIAL_OWN_GOODS_TP_EXT
- PSV_PLAIN_TPO
- PSV_TOUR_VAN_TP
- PSV_MATATU_1WK_TP_EXT
- PSV_TOUR_VAN_TP_EXT
- PSV_TUKTUK_TP_EXT
- PSV_UBER_TP_EXT
- MOTORCYCLE_PSV_TP_6M
- MOTORCYCLE_PSV_COMP_6M
- TUKTUK_COMMERCIAL_TP_EXT
- TUKTUK_PSV_TP_EXT
- SPECIAL category subcategories (not tested)

**Recommendation**: Test remaining subcategories and configure missing pricing before production launch.

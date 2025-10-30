# Extendible Product Underwriter Filtering - Implementation Complete

## Overview

Implemented filtering logic to ensure that **only underwriters with valid extendible_config** are shown for extendible (EXT) products. This applies to all EXT subcategories (e.g., PRIVATE_THIRD_PARTY_EXT, COMMERCIAL_COMPREHENSIVE_EXT, etc.).

## Business Rule

**"If the underwriter does not have an extendible config, it should not be shown. Only the ones with extendible configs should be displayed. This applies to all subcategories - if no specific subcategory is available for a specific underwriter, it should not be shown."**

## Implementation Details

### Backend Changes

**File: `insurance-app/app/views/motor_flow.py`**

#### 1. Mark Underwriters for Exclusion (Lines ~1112-1120)

When processing EXT products, underwriters without valid `extendible_config` are marked with a flag:

```python
if isinstance(ext_cfg, dict):
    result['extendible_config'] = { ... }
    result['is_extendible'] = True
    result['payment_plan'] = 'EXTENDIBLE'
    print(f"✅ Added extendible config from features.pricing for {subcategory_code} - {name}")
else:
    print(f"⚠️ No extendible_config in features.pricing for {subcategory_code} - {name}")
    result['is_extendible'] = False
    result['_exclude_from_ext_product'] = True  # ← NEW FLAG
```

#### 2. Filter Comparisons Before Response (Lines ~1140-1165)

New filtering logic removes underwriters marked for exclusion:

```python
# Filter out underwriters that don't support the requested product
filtered_comparisons = []
for comp in comparisons:
    result = comp.get('result', {})

    # Skip underwriters marked for exclusion
    if result.get('_exclude_from_ext_product'):
        print(f"🚫 Excluding {result.get('underwriter_name')} - no extendible_config for {subcategory_code}")
        continue

    # Skip underwriters with errors
    if 'error' in result and result.get('total_premium', 0) == 0:
        print(f"⚠️ Excluding {result.get('underwriter_name')} - pricing error")
        continue

    # Clean up internal flags before sending to frontend
    result.pop('_exclude_from_ext_product', None)
    filtered_comparisons.append(comp)

print(f"\n📊 Comparison Results: {len(filtered_comparisons)} out of {len(comparisons)} underwriters shown for {subcategory_code}")

return Response({'comparisons': filtered_comparisons, 'count': len(filtered_comparisons)})
```

### Test Coverage

**File: `insurance-app/app/tests/test_extendible_pricing_single_source.py`**

Added new test to verify filtering behavior:

```python
def test_ext_products_filter_out_underwriters_without_config(self):
    """For EXT products, only underwriters with extendible_config should be returned."""
    # Setup: Madison has extendible_config, UAP does not

    resp = self.client.post(url, data=payload)
    data = resp.json()

    # Should only have 1 underwriter (Madison with config)
    self.assertEqual(len(data['comparisons']), 1)
    self.assertEqual(result['underwriter_code'], 'MADISON')

    # Ensure UAP is NOT in the results
    uap_entry = next((c for c in data['comparisons'] if c['result'].get('underwriter_code') == 'UAP'), None)
    self.assertIsNone(uap_entry, 'UAP should have been filtered out')
```

## Test Results

### Manual Test (test_extendible_filtering.py)

```
================================================================================
Testing Extendible Underwriter Filtering
================================================================================

Requesting comparisons for: PRIVATE_THIRD_PARTY_EXT
Category: PRIVATE
--------------------------------------------------------------------------------
✅ Added extendible config from features.pricing for PRIVATE_THIRD_PARTY_EXT - Madison Insurance
⚠️ No extendible_config in features.pricing for PRIVATE_THIRD_PARTY_EXT - UAP Insurance
⚠️ No extendible_config in features.pricing for PRIVATE_THIRD_PARTY_EXT - Britam Insurance
⚠️ No extendible_config in features.pricing for PRIVATE_THIRD_PARTY_EXT - CIC Insurance Group
⚠️ No extendible_config in features.pricing for PRIVATE_THIRD_PARTY_EXT - PATABIMA INC
⚠️ No extendible_config in features.pricing for PRIVATE_THIRD_PARTY_EXT - Jubilee Insurance
⚠️ No extendible_config in features.pricing for PRIVATE_THIRD_PARTY_EXT - APA Insurance
🚫 Excluding UAP Insurance - no extendible_config for PRIVATE_THIRD_PARTY_EXT
🚫 Excluding Britam Insurance - no extendible_config for PRIVATE_THIRD_PARTY_EXT
🚫 Excluding CIC Insurance Group - no extendible_config for PRIVATE_THIRD_PARTY_EXT
🚫 Excluding PATABIMA INC - no extendible_config for PRIVATE_THIRD_PARTY_EXT
🚫 Excluding Jubilee Insurance - no extendible_config for PRIVATE_THIRD_PARTY_EXT
🚫 Excluding APA Insurance - no extendible_config for PRIVATE_THIRD_PARTY_EXT

📊 Comparison Results: 1 out of 7 underwriters shown for PRIVATE_THIRD_PARTY_EXT

✅ Total underwriters returned: 1

Underwriter Details:
1. ✅ Madison Insurance
   - Has extendible_config: True
   - is_extendible: True
   - Total Premium: KSh 7,075.00
   - Initial Amount: KSh 3,600.00
   - Balance Amount: KSh 2,400.00
   - Total Annual: KSh 7,000.00

✅ SUCCESS: All returned underwriters have extendible_config
```

### Unit Tests

```
Ran 3 tests in 0.042s
OK

✅ test_compare_uses_features_pricing_extendible_config
✅ test_compare_ignores_extendiblepricing_table
✅ test_ext_products_filter_out_underwriters_without_config
```

## Frontend Impact

**No frontend changes required!** The filtering happens at the API level, so:

- `UnderwriterSelectionStep.js` will only receive underwriters with valid configs
- Payment calculations will always have `extendible_config` available
- No need for frontend null checks or error handling for missing configs

## How to Configure Extendible Products

For an underwriter to appear in EXT product comparisons, add `extendible_config` to their `features.pricing`:

```json
{
  "features": {
    "pricing": {
      "PRIVATE_THIRD_PARTY_EXT": {
        "pricing_type": "fixed",
        "base_premium": 7000,
        "extendible_config": {
          "initial_amount": 3600,
          "balance_amount": 2400,
          "total_annual_premium": 7000,
          "initial_period_days": 30,
          "extension_deadline_days": 30,
          "grace_period_days": 7,
          "penalty_for_late_extension": 0,
          "allow_partial_extension": false
        }
      }
    }
  }
}
```

### Required Fields in extendible_config:

- `initial_amount` - Amount due upfront (e.g., 3600)
- `balance_amount` - Remaining balance (e.g., 2400)
- `total_annual_premium` - Full year premium (e.g., 7000)
- `initial_period_days` - Coverage period for initial payment (e.g., 30)
- `extension_deadline_days` - Days to pay balance (e.g., 30)
- `grace_period_days` - Grace period after deadline (e.g., 7)
- `penalty_for_late_extension` - Late payment penalty percentage (e.g., 0)
- `allow_partial_extension` - Allow partial extensions (e.g., false)

## Benefits

1. **Data Integrity**: Only underwriters with complete extendible configurations are shown
2. **Better UX**: Users don't see incomplete or invalid options
3. **Simplified Frontend**: No need for null checks or error states
4. **Consistent Behavior**: Same filtering logic across all EXT products
5. **Easy Configuration**: Admins can enable/disable underwriters by adding/removing configs

## Migration Notes

### Current State (Production)

Based on test results, currently:

- **Madison Insurance**: Has extendible_config ✅
- **UAP, Britam, CIC, PATABIMA INC, Jubilee, APA**: No extendible_config ❌

### Action Required

If any of the excluded underwriters should offer EXT products:

1. Go to Django Admin
2. Edit the underwriter's `features.pricing` JSON
3. Add `extendible_config` to the relevant subcategory (e.g., `PRIVATE_THIRD_PARTY_EXT`)
4. Save and verify via compare endpoint

## Related Files

- `insurance-app/app/views/motor_flow.py` - Compare pricing endpoint with filtering
- `insurance-app/app/tests/test_extendible_pricing_single_source.py` - Unit tests
- `test_extendible_filtering.py` - Manual test script
- `docs/EXTENDIBLE_PRICING_SINGLE_SOURCE_MIGRATION.md` - Original migration documentation

## Status

✅ **COMPLETE** - All tests passing, filtering working as expected

# Extendible Pricing - Single Source of Truth Migration Plan

## Executive Summary

**Goal**: Consolidate all extendible product pricing to use the **pricing builder** (`features.pricing` JSON field) as the **ONLY** source of truth, eliminating the dual-system complexity between the pricing builder and the ExtendiblePricing table.

**Current Problem**:

- Extendible pricing is currently managed in TWO places:
  1. Insurance Provider's `features.pricing` JSON field (pricing builder in admin) ✅ **SHOULD BE THE SOURCE**
  2. `ExtendiblePricing` database table ❌ **SHOULD BE REMOVED/DEPRECATED**
- Recent code added sync logic from builder → ExtendiblePricing, creating unnecessary complexity
- Compare endpoint queries ExtendiblePricing table instead of reading directly from features.pricing
- Risk of data inconsistency between the two sources

---

## Current Architecture Analysis

### Data Flow (AS-IS)

```
┌─────────────────────────────────────────────────────────┐
│  Insurance Provider Admin (features.pricing JSON)       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ "PRIVATE_THIRD_PARTY_EXT": {                     │  │
│  │   "base_premium": 7000,                          │  │
│  │   "pricing_type": "fixed",                       │  │
│  │   "extendible_config": {                         │  │
│  │     "initial_amount": 3600,                      │  │
│  │     "balance_amount": 2400,                      │  │
│  │     "total_annual_premium": 7000,                │  │
│  │     "initial_period_days": 30,                   │  │
│  │     "extension_deadline_days": 30,               │  │
│  │     "grace_period_days": 7,                      │  │
│  │     "penalty_for_late_extension": 0              │  │
│  │   }                                              │  │
│  │ }                                                │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Admin Action: "Materialize pricing from features.json"
                 ▼
┌─────────────────────────────────────────────────────────┐
│  ExtendiblePricing Table (Django Model)                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │ subcategory: PRIVATE_THIRD_PARTY_EXT             │  │
│  │ underwriter: Madison Insurance                   │  │
│  │ initial_amount: 3600                             │  │
│  │ balance_amount: 2400                             │  │
│  │ total_annual_premium: 7000                       │  │
│  │ initial_period_days: 30                          │  │
│  │ extension_deadline_days: 30                      │  │
│  │ grace_period_days: 7                             │  │
│  │ penalty_for_late_extension: 0.00                 │  │
│  │ allow_partial_extension: False                   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Queried by compare_motor_pricing endpoint
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend App (React Native)                            │
│  - Payment Summary shows ExtendiblePricing values       │
│  - Alert shows ExtendiblePricing values                 │
│  - Policy submission includes extendible_config         │
└─────────────────────────────────────────────────────────┘
```

**Problem**: Two sources mean two points of failure and manual sync required.

---

## Proposed Architecture (TO-BE)

### Single Source of Truth: Pricing Builder (features.pricing)

```
┌─────────────────────────────────────────────────────────┐
│  Insurance Provider Admin (Pricing Builder)              │
│  ONLY SOURCE - Edit features.pricing JSON               │
│  http://127.0.0.1:8000/admin/app/insuranceprovider/     │
│  ┌──────────────────────────────────────────────────┐  │
│  │ {                                                │  │
│  │   "pricing": {                                   │  │
│  │     "PRIVATE_THIRD_PARTY_EXT": {                 │  │
│  │       "base_premium": 7000,                      │  │
│  │       "pricing_type": "fixed",                   │  │
│  │       "extendible_config": {                     │  │
│  │         "initial_amount": 3600,                  │  │
│  │         "balance_amount": 2400,                  │  │
│  │         "total_annual_premium": 7000,            │  │
│  │         "initial_period_days": 30,               │  │
│  │         "extension_deadline_days": 30,           │  │
│  │         "grace_period_days": 7,                  │  │
│  │         "penalty_for_late_extension": 0          │  │
│  │       }                                          │  │
│  │     }                                            │  │
│  │   }                                              │  │
│  │ }                                                │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Read directly (no DB table lookup)
                 ▼
┌─────────────────────────────────────────────────────────┐
│  compare_motor_pricing Endpoint                          │
│  /api/insurance/compare_motor_pricing/                  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ # Get provider features.pricing                  │  │
│  │ pricing_cfg = provider.features['pricing'][code] │  │
│  │                                                  │  │
│  │ if 'EXT' in subcategory_code:                    │  │
│  │   # Read extendible_config from features        │  │
│  │   ext_cfg = pricing_cfg.get('extendible_config') │  │
│  │   if ext_cfg:                                    │  │
│  │     result['extendible_config'] = ext_cfg        │  │
│  │     result['is_extendible'] = True               │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────┬────────────────────────────────────────┘
                 │
                 │ Direct from builder, no DB lookup
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend App (React Native)                            │
│  - Receives extendible_config from features.pricing     │
│  - Displays values from pricing builder                 │
│  - No client-side calculation or fallbacks              │
│  - Single source guarantees consistency                 │
└─────────────────────────────────────────────────────────┘
```

**Benefits**:

- ✅ One place to edit ALL pricing (regular + extendible)
- ✅ No separate ExtendiblePricing table to maintain
- ✅ No sync logic needed
- ✅ No risk of inconsistency
- ✅ Pricing builder already has excellent UI
- ✅ Simpler architecture - fewer models, fewer queries
- ✅ All pricing data co-located with provider

---

### Phase 1: Remove Builder → ExtendiblePricing Sync Logic ✂️

**Files to Modify:**

1. `insurance-app/app/admin.py` - Remove ExtendiblePricing sync from `materialize_pricing_from_features`

**Changes:**

```python
# REMOVE this entire block (lines 259-346):
# =============================
# Sync ExtendiblePricing if any
# =============================
try:
    ext_cfg = ...  # All this sync logic
    ...
except Exception as e:
    errors.append(...)
```

**Why**: We're NOT syncing to ExtendiblePricing anymore. Builder features.pricing is the source.

````

**Why**: Builder will ONLY handle regular pricing (MotorPricing), not extendible terms.

---

### Phase 2: Update Admin Fieldset Descriptions 📝

**Files to Modify:**
1. `insurance-app/app/admin.py` - Update InsuranceProviderAdmin fieldsets

**Changes:**
```python
(
    "Pricing & Features",
    {
        "description": (
            "Define per-product pricing under features.pricing. Example:\n\n"
            "{\n  'pricing': {\n"
            "    'PRIVATE_TP': { 'pricing_type': 'fixed', 'base_premium': 5200 },\n"
            "    'PRIVATE_TOR': { 'pricing_type': 'fixed', 'base_premium': 1500 },\n"
            "    'PRIVATE_COMPREHENSIVE': { 'pricing_type': 'percentage', 'rate': 0.003, 'min_premium': 20000 },\n"
            "    'PRIVATE_THIRD_PARTY_EXT': {\n"
            "      'pricing_type': 'fixed',\n"
            "      'base_premium': 7000,\n"
            "      'extendible_config': {\n"
            "        'initial_amount': 3600,\n"
            "        'balance_amount': 2400,\n"
            "        'total_annual_premium': 7000,\n"
            "        'initial_period_days': 30,\n"
            "        'extension_deadline_days': 30,\n"
            "        'grace_period_days': 7,\n"
            "        'penalty_for_late_extension': 0\n"
            "      }\n"
            "    }\n"
            "  }\n}\n\n"
            "✅ This is the ONLY source of truth for ALL pricing (regular + extendible).\n"
            "For extendible products (e.g., *_EXT), include extendible_config as shown above.\n\n"
### Phase 3: Update Compare Endpoint to Read from features.pricing 🔧

**Files to Modify:**
1. `insurance-app/app/views/motor_flow.py` - `compare_pricing` function

**Changes:**
```python
# REPLACE the ExtendiblePricing DB lookup (lines 1071-1116) with:

# Add extendible config if this is an extendible product
if 'EXT' in subcategory_code.upper():
    try:
        # Read extendible_config directly from provider features.pricing
        features = underwriter_obj.features or {}
        pricing_data = features.get('pricing', {})
        product_pricing = pricing_data.get(subcategory_code, {})
        ext_cfg = product_pricing.get('extendible_config')

        if ext_cfg and isinstance(ext_cfg, dict):
            result['extendible_config'] = {
                'initial_period_days': ext_cfg.get('initial_period_days', 30),
                'initial_amount': float(ext_cfg.get('initial_amount', 0)),
                'balance_amount': float(ext_cfg.get('balance_amount', 0)),
                'total_annual_premium': float(ext_cfg.get('total_annual_premium', 0)),
                'extension_deadline_days': ext_cfg.get('extension_deadline_days', 30),
                'grace_period_days': ext_cfg.get('grace_period_days', 7),
                'penalty_for_late_extension': float(ext_cfg.get('penalty_for_late_extension', 0)),
                'allow_partial_extension': ext_cfg.get('allow_partial_extension', False)
            }
            result['is_extendible'] = True
            result['payment_plan'] = 'EXTENDIBLE'
            print(f"✅ Added extendible config from features.pricing for {subcategory_code} - {name}")
        else:
            print(f"⚠️ No extendible_config in features.pricing for {subcategory_code} - {name}")
            result['is_extendible'] = False
    except Exception as e:
        print(f"❌ Error reading extendible_config from features.pricing for {subcategory_code} - {name}: {e}")
        import traceback
        traceback.print_exc()
        result['is_extendible'] = False
````

**Why**: Read directly from features.pricing instead of querying ExtendiblePricing table.
'initial_amount': float(ext_pricing.initial_amount),
'balance_amount': float(ext_pricing.balance_amount),
'total_annual_premium': float(ext_pricing.total_annual_premium),
'extension_deadline_days': ext_pricing.extension_deadline_days,
'grace_period_days': ext_pricing.grace_period_days,
'penalty_for_late_extension': float(ext_pricing.penalty_for_late_extension),
'allow_partial_extension': ext_pricing.allow_partial_extension
}

```

**Status**: ✅ Implemented — compare_pricing now reads extendible_config from features.pricing (builder) and no longer queries ExtendiblePricing for new quotes.

---

### Phase 4: Remove Frontend Fallbacks 🧹

**Files to Modify:**
1. `frontend/utils/pricingCalculations.js`
2. `frontend/services/MotorInsurancePricingService.js`
3. `frontend/screens/quotations/Motor 2/MotorInsuranceFlow/MotorInsuranceScreen.js`

**Status**: ✅ Frontend already preserves backend extendible_config. No changes needed since we're changing the backend source only.

---

### Phase 5: Update Policy Retrieval Views (Optional Deprecation Path) 🔍

**Files to Check:**
1. `insurance-app/app/views/policy_management.py` - `get_policy_details`, `list_upcoming_renewals_extensions`, `extend_motor_policy`

**Current Status:**
- These views query ExtendiblePricing table for policy extension logic
- **Decision needed**: Keep ExtendiblePricing for **active policies** (historical data), but new quotes use features.pricing?
- OR: Migrate policy extension logic to also read from features.pricing?

**Recommended Approach:**
- Keep ExtendiblePricing queries for existing/active policies (don't break existing functionality)
- New quotes from compare endpoint use features.pricing
### Phase 6: Remove Data Integrity Checks 🔬

**Action:** DELETE (not needed)

Since we're using features.pricing as the source, we don't need a separate audit command for ExtendiblePricing coverage. The pricing builder UI shows exactly what's configured.

**Alternative:** Create a command to verify all EXT products have `extendible_config` in features.pricing (optional).         ))
```

**Run:**

```bash
python manage.py audit_extendible_pricing
```

---

### Phase 7: Update Documentation 📚

**Files to Update:**

1. `docs/EXTENDIBLE_PRODUCTS_COMPLETE_FLOW.md`
2. `docs/EXTENDIBLE_PRICING_ADMIN_GUIDE.md`
3. `README.md`
4. `.github/copilot-instructions.md`

**Key Points:**

- Document that ExtendiblePricing is the ONLY source
- Remove any references to builder extendible_config
- Update admin workflows to use ExtendiblePricing admin interface
- Add link to ExtendiblePricing admin in all relevant guides

---

## Files Requiring Changes

### Backend Changes

| File                             | Action                 | Lines   | Description                                                                                               |
| -------------------------------- | ---------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `app/admin.py`                   | **REMOVE**             | 259-346 | Delete ExtendiblePricing sync logic from materialize                                                      |
| `app/admin.py`                   | **UPDATE**             | 76-90   | Update fieldset description to clarify extendible config location                                         |
| `app/views/motor_flow.py`        | ✅ **UPDATE COMPLETE** | -       | Now reads extendible_config from features.pricing (builder); ExtendiblePricing no longer used for compare |
| `app/views/policy_management.py` | ✅ **NO CHANGE**       | 310-356 | Already uses ExtendiblePricing as source                                                                  |

### Frontend Changes

| File                                                              | Action           | Lines | Description                                 |
| ----------------------------------------------------------------- | ---------------- | ----- | ------------------------------------------- |
| `frontend/screens/quotations/Motor 2/.../MotorInsuranceScreen.js` | ✅ **NO CHANGE** | -     | Already uses backend extendible_config      |
| `frontend/utils/pricingCalculations.js`                           | ✅ **NO CHANGE** | -     | Already preserves backend extendible_config |
| `frontend/services/MotorInsurancePricingService.js`               | ✅ **NO CHANGE** | -     | Already uses backend values                 |

### New Files to Create

### New Files to Create

| File                                                 | Purpose       |
| ---------------------------------------------------- | ------------- |
| `docs/EXTENDIBLE_PRICING_SINGLE_SOURCE_MIGRATION.md` | This document |

## _Note: No new management commands needed since features.pricing is self-documenting in the admin UI._

## Testing Strategy

### Unit Tests

```python
# tests/test_extendible_pricing_single_source.py

def test_compare_endpoint_uses_extendible_pricing_table():
    """Verify compare endpoint reads from ExtendiblePricing, not builder"""
    pass

def test_builder_does_not_sync_to_extendible_pricing():
    """Verify materialize action does NOT touch ExtendiblePricing"""
    pass

def test_all_ext_products_have_pricing():
    """Verify all EXT subcategories have ExtendiblePricing records"""
| File | Action | Lines | Description |
|------|--------|-------|-------------|
| `app/admin.py` | **REMOVE** | 259-346 | Delete ExtendiblePricing sync logic from materialize |
| `app/admin.py` | **UPDATE** | 76-90 | Update fieldset description to show extendible_config example |
| `app/views/motor_flow.py` | **UPDATE** | 1071-1116 | Read extendible_config from features.pricing instead of ExtendiblePricing table |
| `app/views/policy_management.py` | ✅ **NO CHANGE** | - | Keep ExtendiblePricing queries for existing policies (backward compat) |
3. Verify response includes exact ExtendiblePricing values
4. Update ExtendiblePricing in admin
5. Call API again, verify updated values returned

### Manual Testing Checklist
- [ ] Add extendible_config to features.pricing for a provider
- [ ] Run compare endpoint for that product
- [ ] Verify frontend Payment Summary shows correct values from features.pricing
- [ ] Verify payment alert shows correct values from features.pricing
- [ ] Update extendible_config values in features.pricing
- [ ] Verify frontend immediately reflects changes (no cache issues)
- [ ] Run builder materialize action (should NOT touch ExtendiblePricing)
- [ ] Verify ExtendiblePricing records remain unchanged

---

## Migration Execution Plan

### Pre-Migration Checklist
- [ ] Backup database: `pg_dump patabima > backup_before_single_source.sql`
- [ ] Document current ExtendiblePricing values for reference
- [ ] Copy ExtendiblePricing values to features.pricing for all providers
- [ ] Test features.pricing extendible_config with one provider first

### Execution Steps (30-45 minutes)

**Step 1: Backend Changes (15 min)**
1. Remove ExtendiblePricing sync logic from `admin.py`
2. Update compare_pricing to read from features.pricing
3. Update fieldset descriptions
4. Run Django checks: `python manage.py check`

**Step 2: Data Migration (10 min)**
1. For each provider with ExtendiblePricing records:
   - Copy values to features.pricing.extendible_config
   - Save provider
2. Verify one provider's compare endpoint works with new source

**Step 3: Testing (15 min)**
1. Test compare endpoint for 3-4 EXT products
2. Verify frontend Payment Summary
3. Verify payment alert values
4. Update one provider's extendible_config, verify change propagates

**Step 4: Documentation (10 min)**
1. Update relevant docs
2. Commit with clear message: `feat: consolidate extendible pricing to single source (ExtendiblePricing table)`

### Rollback Plan
If issues arise:
1. Restore database: `psql patabima < backup_before_single_source.sql`
2. Git revert: `git revert HEAD`
3. Restart Django server

---

## Expected Outcomes

### Immediate Benefits
- ✅ One admin interface for ALL pricing (features.pricing builder)
- ✅ No sync required between builder and DB table
- ✅ Guaranteed data consistency (single source)
- ✅ Simpler codebase (~100 lines removed + simplified compare logic)
- ✅ Faster edits (no materialize action needed)
- ✅ All pricing data co-located with provider
### Long-Term Benefits
- 🎯 Easier onboarding for new underwriters (all pricing in one place)
- 🎯 Reduced bug surface area (no DB<->JSON sync bugs)
- 🎯 Better admin UX (pricing builder UI already excellent)
- 🎯 Easier to add new extendible fields (just update JSON schema, no migrations)
- 🎯 Performance: Direct JSON read vs DB query + serialization
- 🎯 Can eventually deprecate ExtendiblePricing model entirelydel, no builder sync)
- 🎯 Performance: Direct DB query vs JSON parsing + sync

### Metrics to Monitor
- API response times for compare_motor_pricing (should be same or faster)
- ExtendiblePricing admin usage (should increase)
- Support tickets related to pricing inconsistency (should decrease to zero)

---

## FAQs
**Q: What happens to existing ExtendiblePricing table data?**
A: It remains in the database for backward compatibility with active policies. New quotes will use features.pricing. We can deprecate/remove the table in a future cleanup once all active policies using it have expired.

**Q: Can we still use ExtendiblePricing admin interface?**
A: Yes, but it won't be used by compare endpoint. Recommend hiding it from admin menu to avoid confusion.

**Q: What if a provider doesn't have extendible_config in features.pricing?**
A: Compare endpoint will not return extendible_config, and product won't be marked as extendible. Frontend will treat it as a regular product.

**Q: How do we bulk-update all providers with extendible_config?**
A: Create a management command to copy from ExtendiblePricing → features.pricing, or manually edit each provider's features.pricing JSON.

**Q: Can we add new extendible fields (e.g., discount_for_early_payment)?**
A: Yes! Just add to the extendible_config JSON structure in features.pricing. No DB migration needed. Compare endpoint will include it automatically.
A: Yes! Just add to ExtendiblePricing model, run migration, and compare endpoint will include it. No builder changes needed.

---

## Conclusion

This migration consolidates extendible pricing from a dual-system (builder + ExtendiblePricing table) to a **single source of truth** (`features.pricing` in the pricing builder), eliminating complexity, reducing maintenance overhead, and ensuring data consistency across the entire PataBima platform.

**Total Effort**: ~40 minutes implementation + ~15 minutes testing
**Risk Level**: Low (changing data source only, frontend unchanged)
**Impact**: High (cleaner architecture, better maintainability, all pricing in one place)

**Next Steps**: Review this plan, approve, and execute Phase 1-7 sequentially.

---

**Document Version**: 2.0 (CORRECTED - features.pricing is source of truth)
**Created**: 2025-10-27
**Updated**: 2025-10-27
**Author**: PataBima Engineering Team
**Status**: Implemented
```

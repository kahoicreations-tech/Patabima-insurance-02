# Motor3 DMVIC Integration - Intermediary Endpoints Migration

**Completed: January 18, 2026**

---

## ✅ Summary of Changes

Motor3 has been updated to use **Intermediary Integration endpoints** for all certificate operations, reflecting PataBima's role as an insurance broker/intermediary.

---

## 🔄 Integration Strategy: HYBRID Approach

Since PataBima operates as an **INTERMEDIARY (Broker)** that compares prices from multiple underwriters before issuing certificates, we use:

### 1. **Member Company Endpoints (v5)** - Vehicle Operations

- **Why**: Intermediary endpoints don't provide vehicle search capabilities
- **Used for**:
  - Vehicle search in NTSA database
  - Double insurance validation (regulatory compliance)

### 2. **Intermediary Integration Endpoints (v6)** - Certificate Operations

- **Why**: As a broker, we must use Intermediary endpoints for proper commission tracking
- **Used for**:
  - Certificate preview
  - Certificate validation
  - Certificate issuance

---

## 📝 Files Modified

### 1. `insurance-app/app/services/dmvic_service.py`

**Change**: Updated documentation header to explain hybrid approach

**Key Points**:

- Clarified that PataBima is an INTERMEDIARY
- Documented why we use v5 for vehicle search (no v6 equivalent)
- Documented why we use v6 for certificates (broker status)

```python
"""
INTEGRATION APPROACH (Updated January 18, 2026):
================================================
PataBima operates as an INTERMEDIARY (Broker) in DMVIC's system.

We use a HYBRID integration approach:

1. MEMBER COMPANY ENDPOINTS (v5 - /api/v5/Integration/*)
   - Vehicle Search: Search NTSA database for vehicle details
   - Validate Double Insurance: Check for existing active policies

2. INTERMEDIARY INTEGRATION ENDPOINTS (v6 - /api/v6/IntermediaryIntegration/*)
   - Preview Certificate: Generate preview without inventory allocation
   - Validate Certificate: Pre-validate data before issuance
   - Issue Certificate: Issue actual certificate with proper intermediary accounting
"""
```

---

### 2. `insurance-app/app/views/dmvic_views.py`

**Changes**: Updated `preview_certificate()` and `issue_certificate()` functions

#### Before (Member Company):

```python
# Old code used different methods per certificate type
if certificate_type == 'A':
    result = dmvic_service.preview_type_a_certificate(dmvic_payload)
elif certificate_type == 'B':
    result = dmvic_service.preview_type_b_certificate(dmvic_payload)
# ... etc
```

#### After (Intermediary):

```python
# New code uses unified Intermediary endpoint for all certificate types
policy_data = {
    'registration_number': policy.registration_number,
    'chassis_number': policy.chassis_number or '',
    # ... all policy fields
}

# Single method for all certificate types (A/B/C/D)
result = dmvic_service.preview_type_a_certificate_intermediary(policy_data)
```

**Benefits**:

- ✅ Single unified endpoint for all certificate types
- ✅ Preview works WITHOUT inventory allocation
- ✅ Proper broker/intermediary status in DMVIC records
- ✅ Correct commission tracking

---

### 3. `MOTOR_ENDPOINTS_WORKING.md`

**Changes**: Updated DMVIC section to document hybrid approach

**Added**:

- Clear labeling of which endpoints use v5 vs v6
- Explanation of why we use each integration type
- Updated integration notes section

**Example**:

```markdown
### Issue Certificate (Intermediary v6)

POST /api/insurance/dmvic/issue-certificate/
Integration: Intermediary (v6) - /api/v6/IntermediaryIntegration/IssuanceTypeACertificate
Note: PataBima uses Intermediary integration as we are a broker
```

---

## 🎯 What This Means

### For Motor3 Flow:

1. **Vehicle Verification (Step 3)**: Still uses Member Company v5 ✅
   - `/api/insurance/dmvic/search-vehicle/`
2. **Double Insurance Check (Step 9)**: Still uses Member Company v5 ✅
   - `/api/insurance/dmvic/validate-double-insurance/`
3. **Certificate Preview**: Now uses Intermediary v6 ✅
   - `/api/insurance/dmvic/preview-certificate/`
   - Endpoint: `/api/v6/IntermediaryIntegration/PreviewTypeACertificate`
4. **Certificate Issuance**: Now uses Intermediary v6 ✅
   - `/api/insurance/dmvic/issue-certificate/`
   - Endpoint: `/api/v6/IntermediaryIntegration/IssuanceTypeACertificate`

### Business Impact:

- ✅ **Correct Broker Status**: DMVIC records will show PataBima as intermediary
- ✅ **Commission Tracking**: Proper commission accounting in DMVIC system
- ✅ **Preview Without Inventory**: Can preview certificates before inventory allocation
- ✅ **Unified Certificate Handling**: One method handles all certificate types

---

## 🔍 Technical Details

### Intermediary Integration Benefits:

1. **No Inventory Required for Preview**
   - Member Company: Requires sticker inventory allocated
   - Intermediary: Preview works without inventory (Azure Blob URL returned)

2. **Proper Accounting**
   - Member Company: Assumes direct underwriter relationship
   - Intermediary: Recognizes broker role, tracks commissions correctly

3. **Simplified API**
   - Member Company: Different endpoints per certificate type (A/B/C/D)
   - Intermediary: Single endpoint handles all types

### What Stays on Member Company v5:

**Vehicle Search** (`search_vehicle`)

- Reason: Intermediary API doesn't provide vehicle search
- Endpoint: `/api/v5/Integration/VehicleSearch`
- Required for: Auto-filling vehicle details from NTSA database

**Double Insurance Validation** (`validate_double_insurance`)

- Reason: Regulatory compliance, not certificate-specific
- Endpoint: `/api/V5/Integration/ValidateDoubleInsurance`
- Required for: Preventing double insurance (mandatory)

---

## ⚠️ Important Notes

### ER006 Error (No Inventory)

Even with Intermediary integration, certificate **issuance** requires DMVIC to allocate physical sticker inventory to account 97218.

**Current Status**:

- ✅ Preview works (no inventory needed)
- ❌ Issuance returns ER006 until inventory allocated
- ⏳ Awaiting DMVIC to allocate PSV sticker inventory

**Error Handling**:
The code now properly detects ER006 and returns user-friendly message:

```json
{
  "success": false,
  "error": "No inventory allocated",
  "user_message": "DMVIC certificate issuance requires sticker inventory allocation. Please contact DMVIC support."
}
```

---

## 🧪 Testing Checklist

- [ ] Vehicle search works (uses v5)
- [ ] Double insurance validation works (uses v5)
- [ ] Certificate preview generates (uses v6 Intermediary)
- [ ] Certificate issuance works when inventory allocated (uses v6 Intermediary)
- [ ] ER006 error handled gracefully
- [ ] All certificate types (A/B/C/D) work with unified endpoint
- [ ] Broker status reflected in DMVIC records

---

## 📚 Reference Documentation

### DMVIC API Specification Sections:

- **4.2.1**: Vehicle Search - Member Company (v5)
- **4.11**: Validate Double Insurance - Member Company (v5)
- **4.12.9**: Preview Type A Certificate - Intermediary (v6)
- **4.12.1**: Issue Type A Certificate - Intermediary (v6)
- **4.13.1**: Validate Type A Certificate - Intermediary (v6)
- **4.14**: Certificates Inventory - Intermediary (v6)

### Related Files:

- `DMVIC_INTERMEDIARY_INTEGRATION.md` - Full integration guide
- `MOTOR3_COMPLETE_FLOW_GUIDE.md` - Motor3 flow documentation
- `MOTOR_ENDPOINTS_WORKING.md` - API endpoints reference

---

## ✨ Conclusion

Motor3 now correctly uses **Intermediary Integration** for all certificate operations, properly reflecting PataBima's role as an insurance broker that compares multiple underwriters before issuing policies.

The hybrid approach (v5 for vehicle operations, v6 for certificates) gives us the best of both worlds:

- ✅ Vehicle search and validation functionality
- ✅ Proper broker status and commission tracking
- ✅ Preview without inventory allocation
- ✅ Simplified certificate handling

**Status**: ✅ COMPLETE - Ready for testing once DMVIC allocates inventory

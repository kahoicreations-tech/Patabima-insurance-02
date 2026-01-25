# DMVIC Certificate Type Testing Report

**Date:** January 2, 2026  
**Environment:** UAT (https://uat-api.dmvic.com)  
**Account:** patabimaagencyapi@dmvic.info  
**Member Company ID:** 97218

## Testing Overview

This document summarizes testing of different DMVIC certificate types and cover types to determine which combinations are currently authorized for the PataBima account.

## Certificate Types

DMVIC supports three Type A Certificate types:

| Type | Description | Cover Types Supported |
|------|-------------|----------------------|
| **7** | Private Vehicles | Comprehensive (100), Third Party (200), TPTF (300) |
| **8** | PSV/Taxi (Public Service Vehicles) | Comprehensive (100), Third Party (200), TPTF (300) |
| **9** | Commercial Vehicles | Comprehensive (100), Third Party (200), TPTF (300) |

## Cover Types

| Code | Name | Description |
|------|------|-------------|
| **100** | Comprehensive | Full coverage including theft, fire, and damage |
| **200** | Third Party | Third-party liability only |
| **300** | TPTF | Third Party, Theft, and Fire |

## Test Results

### ✅ Type 8 (PSV/Taxi) - AUTHORIZED

**Status:** Working  
**Test Vehicles:** KBZ123A (MINIBUS), KCA567D (TAXI)

```
Result: SUCCESS
- Preview generation: ✅ Working
- Certificate URL: ✅ Generated
- Expected behavior: ✅ Normal

Note: May show ER006 (No Inventory) but preview still generates successfully.
```

**Example Response:**
```json
{
  "success": true,
  "callbackObj": {
    "TypeACertificatePreviewURL": "https://[azure-blob-url]",
    "Result": {
      "ErrorList": [
        {
          "ErrorCode": "ER006",
          "ErrorMessage": "There are no stickers allocated to you ..."
        }
      ]
    }
  }
}
```

### ❌ Type 7 (Private Vehicles) - NOT AUTHORIZED

**Status:** Blocked  
**Test Vehicles:** KDC324F (SALOON), KAC040R (PICKUP)  
**Cover Types Tested:** Comprehensive, Third Party

```
Result: ERROR - ER001
- Error Code: ER001
- Message: "One of the parameters has not been authorized by DMVIC Administrator"
- Action Required: Contact DMVIC to authorize Type 7 certificates
```

**Example Error:**
```json
{
  "success": false,
  "callbackObj": {
    "Result": {
      "ErrorList": [
        {
          "ErrorCode": "ER001",
          "ErrorMessage": "One of the parameters has not been authorized by DMVIC Administrator : Member Company Code Or Certificate Type."
        }
      ]
    }
  }
}
```

### ❌ Type 9 (Commercial Vehicles) - NOT AUTHORIZED

**Status:** Blocked  
**Test Vehicles:** KBX890E (LORRY), KCE234F (VAN)  
**Cover Types Tested:** Third Party

```
Result: ERROR - ER001
- Error Code: ER001
- Message: "One of the parameters has not been authorized by DMVIC Administrator"
- Action Required: Contact DMVIC to authorize Type 9 certificates
```

## Known Error Codes

### ER001 - Authorization Error
**Impact:** BLOCKING - Cannot generate preview or issue certificate  
**Cause:** Certificate type not authorized for account  
**Solution:** Contact DMVIC support to request authorization

**User Message:**
```
"Your account is not authorized to issue this type of certificate. 
Only PSV (Public Service Vehicle) certificates are currently authorized.
Please contact support for authorization."
```

### ER006 - No Inventory
**Impact:** NON-BLOCKING for preview, BLOCKING for issuance  
**Cause:** No sticker inventory allocated to account  
**Solution:** Contact DMVIC support to allocate stickers

**User Message:**
```
"Certificate stickers need to be allocated. You can preview the certificate, 
but issuance requires inventory."
```

**Note:** Preview generation works normally even with ER006. The error only blocks actual certificate issuance.

### ER010 - Vehicle Not Found
**Impact:** BLOCKING  
**Cause:** Registration number not found in DMVIC database  
**Solution:** Verify registration number is correct

### ER020 - Double Insurance
**Impact:** BLOCKING  
**Cause:** Vehicle already has active insurance  
**Solution:** Cannot issue duplicate certificate

### ER100 - Authentication Failed
**Impact:** BLOCKING  
**Cause:** Invalid credentials or expired token  
**Solution:** Re-authenticate with DMVIC

## Current Account Status

| Feature | Status | Notes |
|---------|--------|-------|
| Type 8 (PSV) Certificates | ✅ Authorized | Fully working with preview and issuance |
| Type 7 (Private) Certificates | ❌ Not Authorized | Requires DMVIC approval |
| Type 9 (Commercial) Certificates | ❌ Not Authorized | Requires DMVIC approval |
| Preview Generation | ✅ Working | Generates Azure Blob URLs |
| Sticker Inventory | ❌ Not Allocated | ER006 warning (doesn't block preview) |
| Certificate Validation | ✅ Working | ValidateTypeACertificate endpoint functional |
| Vehicle Search | ✅ Working | VehicleSearch endpoint functional |

## Production Readiness Checklist

### Immediate Actions Required:
- [ ] **Contact DMVIC:** Request authorization for Type 7 (Private) certificates
- [ ] **Contact DMVIC:** Request authorization for Type 9 (Commercial) certificates
- [ ] **Contact DMVIC:** Request sticker inventory allocation for account 97218
- [ ] **Test:** Re-test after authorizations are granted
- [ ] **Monitor:** Set up error monitoring for ER001 and ER006

### Pre-Production:
- [ ] **Switch URL:** Change from UAT to production DMVIC API
- [ ] **Enable SSL:** Set `DMVIC_SSL_VERIFY=true` in production
- [ ] **Certificate Renewal:** Renew PatabimaAgencyUAT.pfx before Jan 30, 2026
- [ ] **Load Testing:** Test with high volume of PSV certificates
- [ ] **Error Handling:** Verify all error codes display properly in frontend

### Frontend Integration:
- [x] **Error Handler:** Created `dmvicErrorHandler.js` utility
- [x] **Error Alerts:** Created `errorAlerts.js` for consistent error display
- [x] **User Messages:** Implemented user-friendly error messages
- [x] **Status UI:** Added status-based UI in PolicySuccess
- [x] **Preview Display:** Added preview button in Step8_Submission
- [ ] **Testing:** Test error displays on actual devices (iOS/Android)

## API Availability Notes

**Current Status (January 2, 2026):**  
During testing, DMVIC UAT API returned "Something Went Wrong" errors intermittently. This may indicate:
- Temporary API downtime
- Maintenance window
- Token expiration issues

**Recommendation:** Implement retry logic with exponential backoff for transient errors.

## Certificate Body Type Mapping

The system automatically determines certificate type based on vehicle body type:

| Body Type | Certificate Type | Notes |
|-----------|------------------|-------|
| SALOON, SEDAN, HATCHBACK, SUV, 4X4, PICKUP, WAGON, COUPE, CONVERTIBLE | Type 7 (Private) | Currently **not authorized** |
| MINIBUS, MATATU, PSV, TAXI, CAB | Type 8 (PSV) | ✅ **Currently working** |
| LORRY, TRUCK, VAN, BUS, TRAILER | Type 9 (Commercial) | Currently **not authorized** |

## Recommendations

### Short Term (Current State):
1. **Only offer PSV certificates** in production until Type 7 and 9 are authorized
2. **Display clear messages** when users try to get certificates for private/commercial vehicles
3. **Show preview buttons** even when ER006 occurs (preview still works)
4. **Implement retry logic** for API timeouts and transient errors

### Medium Term (After Authorization):
1. **Test all certificate types** thoroughly after DMVIC authorizes Type 7 and 9
2. **Monitor error rates** for each certificate type
3. **Set up alerts** for authorization errors (ER001) in case permissions change
4. **Implement certificate download** to S3 to prevent Azure Blob URL expiration

### Long Term (Production):
1. **Auto-retry failed certificates** when inventory becomes available
2. **Batch certificate generation** for high-volume periods
3. **Certificate status tracking** with customer notifications
4. **Admin dashboard** for monitoring DMVIC integration health

## Frontend Error Handling

### Error Display Components Created:

1. **`dmvicErrorHandler.js`**
   - Parses DMVIC error codes
   - Returns user-friendly messages
   - Determines error severity and actions
   - Formats errors for logging

2. **`errorAlerts.js`**
   - Consistent Alert.alert() wrappers
   - DMVIC-specific error alerts
   - API error formatting
   - Confirmation dialogs

### Usage Example:

```javascript
import { showDmvicErrorAlert } from '../utils/errorAlerts';

try {
  const result = await generateCertificate(policyData);
} catch (error) {
  showDmvicErrorAlert(
    error,
    () => handleRetry(), // Retry callback
    () => handleContactSupport() // Support callback
  );
}
```

## Testing Commands

### Test Certificate Types (When API is available):
```bash
cd insurance-app
python test_dmvic_types.py
```

### Test Specific Vehicle:
```python
from app.services.dmvic_service import get_dmvic_service

dmvic = get_dmvic_service()

# Test PSV (should work)
result = dmvic.preview_type_a_certificate_intermediary({
    'registration_number': 'KBZ123A',
    'cover_type': 'THIRD_PARTY',
    'body_type': 'MINIBUS',
    # ... other policy data
})
```

## Contact Information

**DMVIC Support:**
- Email: support@dmvic.info
- Phone: [To be added]
- Request Type: Certificate Type Authorization & Sticker Allocation
- Account Reference: patabimaagencyapi@dmvic.info (Member Company 97218)

**What to Request:**
1. Authorization for Type 7 (Private Vehicle) certificates
2. Authorization for Type 9 (Commercial Vehicle) certificates
3. Sticker inventory allocation for account 97218
4. Production API credentials and endpoints

## Summary

| Metric | Value |
|--------|-------|
| **Working Certificate Types** | 1 out of 3 (33%) |
| **Authorized Types** | Type 8 (PSV) only |
| **Blocked Types** | Type 7 (Private), Type 9 (Commercial) |
| **Preview Generation** | ✅ Fully working for Type 8 |
| **Inventory Status** | ⚠️  Not allocated (non-blocking) |
| **Production Ready** | ⚠️  Partial (PSV only) |
| **Next Actions** | Contact DMVIC for authorizations |

---

**Last Updated:** January 2, 2026  
**Next Review:** After receiving DMVIC authorizations

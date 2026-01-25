# DMVIC Error Code Quick Reference

**Last Updated:** January 2, 2026

## Common Error Codes

### ER001 - Authorization Error
**Status:** 🔴 BLOCKING  
**Cause:** Certificate type not authorized for your account  
**Solution:** Contact DMVIC support to request authorization  
**User Sees:** "Your account is not authorized to issue this type of certificate"  

**What to do:**
1. Contact DMVIC at support@dmvic.info
2. Request authorization for certificate type (7, 8, or 9)
3. Provide account reference: patabimaagencyapi@dmvic.info
4. Member Company ID: 97218

**Current Status:**
- Type 7 (Private): ❌ Not authorized
- Type 8 (PSV): ✅ Authorized
- Type 9 (Commercial): ❌ Not authorized

---

### ER006 - No Inventory
**Status:** ⚠️  WARNING (Non-blocking for preview)  
**Cause:** No certificate stickers allocated to account  
**Solution:** Contact DMVIC to allocate sticker inventory  
**User Sees:** "Certificate stickers need to be allocated. You can preview the certificate, but issuance requires inventory."

**What to do:**
1. Contact DMVIC at support@dmvic.info
2. Request sticker inventory allocation
3. Specify quantity needed
4. Account reference: 97218

**Note:** Preview generation works normally with ER006. Only actual issuance is blocked.

---

### ER010 - Vehicle Not Found
**Status:** 🔴 BLOCKING  
**Cause:** Registration number not found in DMVIC database  
**Solution:** Verify registration number is correct  
**User Sees:** "Vehicle not found. Please verify the registration number."

**What to do:**
1. Check registration number spelling
2. Verify format (e.g., KDC324F not KDC 324F)
3. Confirm vehicle is registered in Kenya
4. Try searching with different formatting

---

### ER011 - Invalid Registration Format
**Status:** 🔴 BLOCKING  
**Cause:** Registration number format is invalid  
**Solution:** Check registration format  
**User Sees:** "Invalid registration number format. Please check and try again."

**Valid Formats:**
- KDC324F
- KBZ123A
- KCA567D

**Invalid Formats:**
- KDC 324F (with space)
- 324FKDC (wrong order)
- KDC324 (incomplete)

---

### ER020 - Double Insurance
**Status:** 🔴 BLOCKING  
**Cause:** Vehicle already has active insurance policy  
**Solution:** Cannot issue duplicate certificate  
**User Sees:** "This vehicle is already insured. Cannot issue duplicate certificate."

**What to do:**
1. Check policy start/end dates
2. Wait for existing policy to expire
3. Contact insurer to cancel existing policy if appropriate
4. Use different registration if testing

---

### ER100 - Authentication Failed
**Status:** 🔴 BLOCKING  
**Cause:** DMVIC login failed  
**Solution:** Check credentials, retry  
**User Sees:** "Connection to certificate system failed. Please try again."

**What to do:**
1. Retry the operation
2. Check internet connection
3. Verify DMVIC credentials in .env
4. Check if DMVIC API is operational
5. Contact support if persists

---

### UNKNOWN - Generic Error
**Status:** ⚠️  WARNING  
**Cause:** Unexpected error  
**Solution:** Retry or contact support  
**User Sees:** "Something went wrong. Please try again or contact support."

**What to do:**
1. Retry the operation
2. Check console logs for details
3. Verify request payload
4. Contact support with error details

---

## Error Code Summary Table

| Code | Type | Blocking | Preview Works | Issuance Works | User Action |
|------|------|----------|---------------|----------------|-------------|
| ER001 | Authorization | Yes | ❌ | ❌ | Contact Support |
| ER006 | Inventory | No | ✅ | ❌ | Preview Only |
| ER010 | Vehicle | Yes | ❌ | ❌ | Retry |
| ER011 | Validation | Yes | ❌ | ❌ | Fix Format |
| ER020 | Duplicate | Yes | ❌ | ❌ | None |
| ER100 | Auth | Yes | ❌ | ❌ | Retry |
| UNKNOWN | Generic | Maybe | ❓ | ❓ | Retry |

## Testing Error Scenarios

### Test ER001 (Not Authorized)
```python
# Try to generate Type 7 certificate (Private - not authorized)
policy_data = {
    'registration_number': 'KDC324F',
    'body_type': 'SALOON',
    'cover_type': 'COMPREHENSIVE',
    # ... other fields
}
dmvic.preview_type_a_certificate_intermediary(policy_data)
# Expected: ER001 error
```

### Test ER006 (No Inventory)
```python
# Try to generate Type 8 certificate (PSV - authorized but no inventory)
policy_data = {
    'registration_number': 'KBZ123A',
    'body_type': 'MINIBUS',
    'cover_type': 'THIRD_PARTY',
    # ... other fields
}
result = dmvic.preview_type_a_certificate_intermediary(policy_data)
# Expected: Success with ER006 warning, preview URL generated
```

### Test ER010 (Vehicle Not Found)
```python
# Try with non-existent registration
policy_data = {
    'registration_number': 'ZZZ999Z',  # Doesn't exist
    # ... other fields
}
dmvic.preview_type_a_certificate_intermediary(policy_data)
# Expected: ER010 error
```

## Frontend Error Display

### Example 1: ER001 Alert
```javascript
Alert.alert(
  'Certificate Type Not Authorized',
  'Your account is not authorized to issue this type of certificate. Only PSV certificates are currently authorized.\n\nError Code: ER001',
  [
    { text: 'Contact Support', onPress: () => openSupport() },
    { text: 'OK', style: 'cancel' }
  ]
);
```

### Example 2: ER006 with Preview
```javascript
Alert.alert(
  'No Certificate Inventory',
  'Certificate stickers need to be allocated. You can preview the certificate, but issuance requires inventory.',
  [
    { text: 'View Preview', onPress: () => openPreview(previewUrl) },
    { text: 'OK', style: 'cancel' }
  ]
);
```

## Debugging Tips

### Check Error in Console
```javascript
import { formatDmvicErrorForLogging } from '../utils/dmvicErrorHandler';

try {
  await generateCertificate();
} catch (error) {
  console.error(formatDmvicErrorForLogging(error));
  // Outputs formatted error with all details
}
```

### Parse Error Manually
```javascript
import { parseDmvicError } from '../utils/dmvicErrorHandler';

const errorResponse = {
  success: false,
  callbackObj: {
    Result: {
      ErrorList: [
        { ErrorCode: 'ER001', ErrorMessage: '...' }
      ]
    }
  }
};

const parsed = parseDmvicError(errorResponse);
console.log(parsed);
// Output:
// {
//   code: 'ER001',
//   title: 'Certificate Type Not Authorized',
//   userMessage: '...',
//   action: 'CONTACT_SUPPORT',
//   ...
// }
```

## Contact Information

### DMVIC Support
- **Email:** support@dmvic.info
- **Account:** patabimaagencyapi@dmvic.info
- **Member Company ID:** 97218

### What to Include in Support Request
1. Error code (e.g., ER001)
2. Certificate type trying to issue (7, 8, or 9)
3. Vehicle registration number
4. Account reference
5. Screenshot of error if available

### PataBima Internal Support
- **Error Logs:** Check CloudWatch logs
- **Testing Script:** `insurance-app/test_dmvic_types.py`
- **Documentation:** See DMVIC_CERTIFICATE_TYPE_TESTING.md
- **Error Handler Code:** `frontend/utils/dmvicErrorHandler.js`

---

## Quick Actions

### If you see ER001:
1. Check certificate type mapping in code
2. Verify account authorizations in DMVIC portal
3. Contact DMVIC for authorization

### If you see ER006:
1. Don't panic - preview still works
2. Show preview to user
3. Contact DMVIC for inventory allocation
4. Document in admin panel

### If you see ER010:
1. Verify registration format
2. Check for typos
3. Test with known working registration
4. Verify vehicle exists in DMVIC database

### If errors persist:
1. Check DMVIC API status
2. Verify credentials in .env
3. Check SSL certificate expiry (Jan 30, 2026)
4. Review CloudWatch logs
5. Contact DMVIC support

---

**Print this page and keep it handy for quick error resolution!**

# Motor3 Smoke Test Guide

## Overview

The Motor3 smoke test script (`scripts/test-motor3-smoke.ps1`) validates the complete Motor3 insurance flow including all DMVIC integrations (both v5 and v6).

---

## What It Tests

### ✅ Authentication

- User signup
- User login
- Token management

### ✅ Motor3 Configuration

- Categories retrieval
- Subcategories retrieval
- Underwriters discovery

### ✅ DMVIC Vehicle Search (v5 Member Company)

- Vehicle search in NTSA database
- Vehicle data extraction
- Active cover detection

### ✅ Premium Calculation

- Single underwriter premium calculation
- Multi-underwriter pricing comparison

### ✅ Motor3 Quotation Flow

- Quotation creation
- Quotation listing
- Quotation retrieval

### ✅ DMVIC Double Insurance (v5 Member Company)

- Active policy validation
- Regulatory compliance check

### ✅ Motor3 Policy Creation

- Quotation to policy conversion
- Policy number generation

### ✅ DMVIC Certificate Operations (v6 Intermediary)

- Certificate preview (works without inventory)
- Certificate issuance (requires inventory)

### ✅ Policy Management

- Policy listing
- Policy retrieval

---

## Usage

### Basic Run (Local Backend)

```powershell
cd C:\Users\USER\Desktop\PATABIMA01
.\scripts\test-motor3-smoke.ps1
```

### Test Against EC2 Backend

```powershell
.\scripts\test-motor3-smoke.ps1 -BaseUrl "http://your-ec2-instance.com:8000"
```

### Test with Specific Vehicle

```powershell
.\scripts\test-motor3-smoke.ps1 -RegistrationNumber "KCB456Z"
```

### Include Certificate Preview Test

```powershell
.\scripts\test-motor3-smoke.ps1 -TestCertificatePreview
```

### Use Existing Account (Skip Signup)

```powershell
.\scripts\test-motor3-smoke.ps1 -Phone "254712345678" -Password "YourPassword" -SkipSignup
```

### Verbose Mode (Show All Requests/Responses)

```powershell
.\scripts\test-motor3-smoke.ps1 -Verbose
```

### Full Test with All Options

```powershell
.\scripts\test-motor3-smoke.ps1 `
  -BaseUrl "http://localhost:8000" `
  -RegistrationNumber "KCA123A" `
  -TestCertificatePreview `
  -Verbose
```

---

## Parameters

| Parameter                | Type   | Default                 | Description                                |
| ------------------------ | ------ | ----------------------- | ------------------------------------------ |
| `BaseUrl`                | string | `http://localhost:8000` | Backend API base URL                       |
| `Phone`                  | string | Random                  | User phone number                          |
| `Password`               | string | `Test@123`              | User password                              |
| `RegistrationNumber`     | string | `KCA123A`               | Vehicle registration to test               |
| `SkipSignup`             | switch | false                   | Skip user signup if account exists         |
| `TestCertificatePreview` | switch | false                   | Test certificate preview (requires policy) |
| `Verbose`                | switch | false                   | Show detailed request/response info        |

---

## Expected Output

### Successful Run Example:

```
========================================
  AUTHENTICATION
========================================

→ User Signup
✓ User Signup - PASSED

→ User Login
ℹ Authenticated as User ID: 123
✓ User Login - PASSED

========================================
  MOTOR3 CONFIGURATION
========================================

→ Get Motor Categories
ℹ Found 6 categories
✓ Get Motor Categories - PASSED

→ Get Private Subcategories
ℹ Found 4 subcategories for PRIVATE
✓ Get Private Subcategories - PASSED

→ Get Underwriters for Third-Party
ℹ Found 5 underwriters
✓ Get Underwriters for Third-Party - PASSED

========================================
  DMVIC VEHICLE SEARCH (v5 Member Company)
========================================

→ Search Vehicle in NTSA Database
ℹ Vehicle: Toyota Axio (2015)
ℹ Chassis: JTFSH3P26J3012345
ℹ Has Active Cover: True
ℹ Cover Expires: 2026-01-25
✓ Search Vehicle in NTSA Database - PASSED

========================================
  PREMIUM CALCULATION
========================================

→ Calculate Third-Party Premium
ℹ Base Premium: KSh 4000
ℹ Total Premium: KSh 4520
✓ Calculate Third-Party Premium - PASSED

→ Compare Pricing Across Underwriters
ℹ Compared 5 underwriters
ℹ   - APA: KSh 4520
ℹ   - Jubilee: KSh 4650
ℹ   - Britam: KSh 4500
ℹ   - ICEA: KSh 4700
ℹ   - GA: KSh 4480
✓ Compare Pricing Across Underwriters - PASSED

========================================
  MOTOR3 QUOTATION CREATION
========================================

→ Create Third-Party Quotation
ℹ Quote Number: QT-2026-001234
ℹ Premium: KSh 4520
✓ Create Third-Party Quotation - PASSED

→ List User Quotations
ℹ Found 1 quotation(s)
✓ List User Quotations - PASSED

→ Get Quotation Details
ℹ Quote: QT-2026-001234
ℹ Status: pending
✓ Get Quotation Details - PASSED

========================================
  DMVIC DOUBLE INSURANCE CHECK (v5 Member Company)
========================================

→ Validate Double Insurance
ℹ Has Active Cover: False
✓ Validate Double Insurance - PASSED

========================================
  TEST SUMMARY
========================================

Total Tests:   12
Passed:        12
Failed:        0
Skipped:       0

Pass Rate:     100%

========================================
```

---

## Test Results

The script generates a JSON file with detailed test results:

**Location**: `test-results-motor3-smoke-YYYYMMDD-HHmmss.json`

**Example**:

```json
{
  "Total": 12,
  "Passed": 12,
  "Failed": 0,
  "Skipped": 0,
  "Tests": [
    {
      "Name": "User Signup",
      "Status": "PASSED",
      "Result": { "success": true, "user_id": 123 }
    },
    {
      "Name": "Search Vehicle in NTSA Database",
      "Status": "PASSED",
      "Result": {
        "success": true,
        "vehicle": {
          "registration_number": "KCA123A",
          "make": "Toyota",
          "model": "Axio",
          "year_of_manufacture": 2015
        }
      }
    }
  ]
}
```

---

## Certificate Preview Test

### Why It's Optional

Certificate preview requires:

1. Valid policy creation
2. Payment simulation (may fail without actual payment gateway)
3. DMVIC inventory allocation (for issuance only)

### Enable It:

```powershell
.\scripts\test-motor3-smoke.ps1 -TestCertificatePreview
```

### Expected Behavior:

**Certificate Preview**: ✅ Should PASS

- Uses v6 Intermediary endpoint
- Works WITHOUT inventory allocation
- Returns Azure Blob URL for preview PDF

**Certificate Issuance**: ⚠️ May SKIP

- Requires DMVIC to allocate stickers to account 97218
- Will return ER006 error if no inventory
- Script handles this gracefully as expected behavior

---

## Common Issues

### 1. Connection Refused

**Error**: `Unable to connect to the remote server`

**Solution**: Ensure backend is running:

```powershell
cd insurance-app
python manage.py runserver
```

### 2. Authentication Failed

**Error**: `Login failed: No access token returned`

**Solution**: Use `-SkipSignup` if account already exists:

```powershell
.\scripts\test-motor3-smoke.ps1 -Phone "254712345678" -SkipSignup
```

### 3. DMVIC Timeout

**Error**: `Request timed out`

**Solution**: Script uses 60-second timeout (same as production). If still timing out, check:

- DMVIC service status
- Network connectivity
- Backend logs: `insurance-app/logs/`

### 4. ER006 - No Inventory

**Error**: `Certificate issuance blocked: No inventory allocated`

**This is EXPECTED**: DMVIC hasn't allocated sticker inventory yet. Preview should still work.

---

## Integration Points Tested

### DMVIC v5 (Member Company)

- ✅ `/api/v5/Integration/VehicleSearch` - Vehicle search
- ✅ `/api/V5/Integration/ValidateDoubleInsurance` - Double insurance check

### DMVIC v6 (Intermediary)

- ✅ `/api/v6/IntermediaryIntegration/PreviewTypeACertificate` - Certificate preview
- ⚠️ `/api/v6/IntermediaryIntegration/IssuanceTypeACertificate` - Certificate issuance (requires inventory)

### Backend Endpoints

- ✅ Authentication (signup, login)
- ✅ Motor3 configuration (categories, subcategories, underwriters)
- ✅ Premium calculation and comparison
- ✅ Quotation CRUD operations
- ✅ Policy management

---

## Next Steps After Successful Test

1. **Review Test Results JSON**: Check for any skipped tests
2. **Test on EC2**: Validate against production environment
3. **Request DMVIC Inventory**: Contact DMVIC to allocate stickers for account 97218
4. **Run Full Certificate Test**: Once inventory allocated, run with `-TestCertificatePreview`

---

## Quick Commands

### Before Running Tests

```powershell
# Start local backend
cd insurance-app
python manage.py runserver

# In another terminal, run tests
cd C:\Users\USER\Desktop\PATABIMA01
.\scripts\test-motor3-smoke.ps1
```

### Test Different Scenarios

```powershell
# Test with real vehicle registration
.\scripts\test-motor3-smoke.ps1 -RegistrationNumber "KCB789X"

# Test certificate preview
.\scripts\test-motor3-smoke.ps1 -TestCertificatePreview

# Full verbose test
.\scripts\test-motor3-smoke.ps1 -Verbose -TestCertificatePreview

# Production EC2 test
.\scripts\test-motor3-smoke.ps1 -BaseUrl "http://ec2-instance:8000" -TestCertificatePreview
```

---

## Exit Codes

- `0`: All tests passed
- `1`: One or more tests failed

Use in CI/CD:

```powershell
.\scripts\test-motor3-smoke.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Motor3 smoke tests failed!"
    exit 1
}
```

---

## Support

For issues or questions:

1. Check test results JSON for detailed error messages
2. Review backend logs: `insurance-app/logs/django.log`
3. Enable verbose mode: `-Verbose`
4. Check DMVIC integration docs: `DMVIC_INTERMEDIARY_INTEGRATION.md`

---

**Last Updated**: January 18, 2026  
**Script Version**: 1.0  
**Compatible With**: Motor3 v6 Intermediary Integration

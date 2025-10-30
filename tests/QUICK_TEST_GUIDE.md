# Quick Testing Guide: Non-Motor Backend Connections

## ✅ What This Tests

Verifies all 7 non-motor insurance products properly submit quotations to the Django backend's ManualQuote system.

## 🏃 Quick Start

### 1. Start Django Backend

```bash
# In one terminal
cd insurance-app
python manage.py runserver
```

### 2. Run Test Script

**PowerShell (Windows) - Recommended:**

```powershell
# Simple usage (uses localhost:8000)
.\tests\test-non-motor.ps1

# With custom API URL
.\tests\test-non-motor.ps1 -ApiUrl "http://54.234.123.45:8000"

# With authentication token
.\tests\test-non-motor.ps1 -ApiUrl "http://localhost:8000" -AuthToken "your_jwt_token_here"
```

**Node.js Direct (Cross-platform):**

```bash
# From project root
node tests/test-non-motor-backend-connections.js
```

## 📊 Expected Output

```
==============================================================
  NON-MOTOR INSURANCE BACKEND CONNECTION TESTS
==============================================================

Configuration:
  API Base URL: http://localhost:8000
  Auth Token:   Not provided (testing as public)
  Total Tests:  7

Testing: Medical Insurance (Individual)
Line Key: MEDICAL
Endpoint: /api/v1/public_app/insurance/submit_manual_quote
✓ PASSED
  Status: 201
  Reference: MQ-2025-001234

Testing: WIBA Insurance
Line Key: WIBA
Endpoint: /api/v1/public_app/insurance/submit_manual_quote
✓ PASSED
  Status: 201
  Reference: MQ-2025-001235

... (5 more products)

==============================================================
TEST SUMMARY
==============================================================

Total Tests:    7
Passed:         7
Failed:         0
Skipped:        0

PASSED TESTS:
  1. Medical Insurance (Individual) (MEDICAL)
     Reference: MQ-2025-001234
  2. WIBA Insurance (WIBA)
     Reference: MQ-2025-001235
  3. Travel Insurance (TRAVEL)
     Reference: MQ-2025-001236
  4. Personal Accident Insurance (PERSONAL_ACCIDENT)
     Reference: MQ-2025-001237
  5. Professional Indemnity Insurance (PROFESSIONAL_INDEMNITY)
     Reference: MQ-2025-001238
  6. Last Expense Insurance (LAST_EXPENSE)
     Reference: MQ-2025-001239
  7. Domestic Package Insurance (DOMESTIC_PACKAGE)
     Reference: MQ-2025-001240

==============================================================

ALL TESTS PASSED! ✓
```

## 🔧 Advanced Usage

### Test Against EC2 Deployment

**PowerShell (Windows):**

```powershell
$env:API_BASE_URL="http://54.234.123.45:8000"
node tests/test-non-motor-backend-connections.js
```

**Bash (Linux/Mac):**

```bash
API_BASE_URL=http://54.234.123.45:8000 node tests/test-non-motor-backend-connections.js
```

### With Authentication Token

**PowerShell (Windows):**

```powershell
$env:AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
node tests/test-non-motor-backend-connections.js

# Or set both:
$env:API_BASE_URL="http://localhost:8000"
$env:AUTH_TOKEN="your_token_here"
node tests/test-non-motor-backend-connections.js
```

**Bash (Linux/Mac):**

```bash
AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... node tests/test-non-motor-backend-connections.js
```

### Clear Environment Variables (PowerShell)

```powershell
Remove-Item Env:API_BASE_URL
Remove-Item Env:AUTH_TOKEN
```

## ✔️ What Gets Tested

| Product                | Line Key               | Key Fields Tested                                |
| ---------------------- | ---------------------- | ------------------------------------------------ |
| Medical Insurance      | MEDICAL                | inpatientLimit, age, preferredUnderwriters       |
| WIBA Insurance         | WIBA                   | company_name, departments, industry              |
| Travel Insurance       | TRAVEL                 | destination, departure_date, return_date         |
| Personal Accident      | PERSONAL_ACCIDENT      | age, cover_limit_id                              |
| Professional Indemnity | PROFESSIONAL_INDEMNITY | business_name, profession, indemnity_limit       |
| Last Expense           | LAST_EXPENSE           | age, cover_limit_id                              |
| Domestic Package       | DOMESTIC_PACKAGE       | property_address, building_value, contents_value |

## 🔍 Verify Results in Django Admin

After successful test run:

1. Open Django Admin: http://localhost:8000/admin
2. Go to **Manual Quotes** section
3. You should see 7 new quote records with status **PENDING_ADMIN_REVIEW**
4. Each quote should have:
   - Unique reference number (MQ-2025-XXXXXX)
   - Correct line_key
   - JSON payload with submitted data
   - Timestamp

## ❌ Common Issues

### Backend Not Running

```
Error: connect ECONNREFUSED 127.0.0.1:8000
```

**Fix**: Start Django backend with `python manage.py runserver`

### Authentication Required

```
⊘ SKIPPED (Authentication Required)
  Status: 401
```

**Fix**: Provide AUTH_TOKEN or configure backend for public testing

### No Reference Returned

```
⚠ WARNING
  Message: Success but no reference returned
```

**Fix**: Check backend ManualQuote serializer returns `reference` field

## 📈 Success Criteria

✅ **All 7 tests PASSED**

- Each product received HTTP 200/201 status
- Each response contains a reference number
- No connection errors
- No validation errors

✅ **Backend Verification**

- 7 ManualQuote records created in database
- All records have status PENDING_ADMIN_REVIEW
- All payloads properly stored as JSON

✅ **No Regressions**

- No existing functionality broken
- All products submit correct data structure
- Error handling works properly

## 🚀 Next Steps After Testing

1. **Verify in Mobile App**

   - Submit quotes through actual React Native app
   - Confirm same behavior as test script

2. **Test Admin Workflow**

   - Admin prices quotes in Django admin
   - Status changes to COMPLETED
   - Agent can proceed to payment

3. **Integration Testing**
   - Test complete quote-to-policy flow
   - Verify payment processing
   - Confirm policy generation

## 📞 Troubleshooting

**Script hangs/timeout:**

- Check backend is responsive: `curl http://localhost:8000/api/v1/public_app/insurance/submit_manual_quote`
- Increase timeout in script (currently 10 seconds)

**All tests fail:**

- Verify endpoint exists: Check Django urls.py
- Check ManualQuote model registered
- Ensure migrations are applied

**Some tests pass, some fail:**

- Check specific product payload requirements
- Verify line_key matches backend expectations
- Check backend validation rules

## 📝 Test Data

Test script uses realistic but fake data:

- Names: "Test Client Medical", "Test WIBA Company Ltd"
- IDs: 12345678
- Phones: 0712345678
- Emails: test.\*@example.com

All data is safe for testing and won't interfere with production.

---

**Need Help?** Check full documentation in `tests/test-non-motor-backend-connections.js` comments.

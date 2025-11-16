# Motor 2 Flow Integration Tests

Comprehensive test suite for verifying the complete Motor 2 insurance flow from category selection to policy creation.

## 🎯 Overview

The test suite validates the following 8-step flow:

1. **Authentication** - User login and token retrieval
2. **Motor Categories** - Fetch available insurance categories
3. **Subcategories** - Fetch products for a category
4. **Pricing Comparison** - Calculate and compare premiums across underwriters
5. **Document Processing** - Upload and extract data from documents
6. **Policy Creation** - Submit complete policy with all details
7. **Policy Retrieval** - Retrieve created policy by policy number
8. **List Policies** - List all policies for the agent

## 🚀 Quick Start

### 1. Start Backend Server

```bash
cd insurance-app
python manage.py runserver
```

### 2. Configure Test User

Edit `motor2_flow_integration_test.py` with valid credentials:

```python
TEST_USER = {
    "phonenumber": "712345678",      # 9 digits without leading 0
    "password": "testpassword123"
}
```

### 3. Run Tests

```bash
python tests/motor2_flow_integration_test.py
```

## 📋 Prerequisites

### Backend Requirements

- ✅ Django backend running on `http://localhost:8000`
- ✅ Database seeded with motor categories and subcategories
- ✅ At least one test user (sales agent) in database
- ✅ Pricing data configured for test products
- ✅ AWS credentials configured (for document processing)

### Test User Setup

Create a test agent in Django admin or via management command:

```bash
python manage.py createsuperuser
# Or create via Django shell
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> user = User.objects.create_user(
...     username='testagent@patabima.com',
...     password='testpassword123',
...     email='testagent@patabima.com',
...     is_agent=True
... )
```

### Optional: Test Documents

For document processing tests, add sample PDFs to `tests/fixtures/`:

- `test_logbook.pdf` - Vehicle logbook
- `test_id.pdf` - National ID
- `test_kra_pin.pdf` - KRA PIN certificate

See `tests/fixtures/README.md` for document requirements.

## 📊 Test Output

### Success Output

```
╔════════════════════════════════════════════════════════════════════╗
║          MOTOR 2 FLOW INTEGRATION TEST SUITE                       ║
║          PataBima Insurance Application                            ║
╚════════════════════════════════════════════════════════════════════╝

Backend URL: http://localhost:8000/api/v1
Test User: testagent@patabima.com
Date: October 21, 2025

======================================================================
                        STEP 1: Authentication
======================================================================

✓ PASS | Authentication
       Token: eyJ0eXAiOiJKV1QiLCJ...

======================================================================
                        STEP 2: Motor Categories
======================================================================

✓ PASS | Get Categories
       Found 6 categories
  • Private (ID: 1)
  • Commercial (ID: 2)
  • PSV (ID: 3)

[... continues ...]

======================================================================
                           TEST SUMMARY
======================================================================

Total Tests: 12
Passed: 11
Failed: 0
Warnings: 1
Duration: 8.45 seconds

✓ ALL TESTS PASSED!
Motor 2 flow is fully functional and properly wired.

Flow Data Summary:
  Created Policy: POL-2025-001234
  Categories Tested: 6
  Subcategories Tested: 7
  Pricing Quotes: 3
```

### Status Indicators

- **✓ PASS** (Green) - Test succeeded
- **✗ FAIL** (Red) - Test failed (critical issue)
- **⚠ WARN** (Yellow) - Warning (non-critical)
- **ℹ INFO** (Blue) - Informational message

## 🔧 Troubleshooting

### Backend Not Running

**Error:**

```
ERROR: Cannot connect to backend at http://localhost:8000/api/v1
```

**Solution:**

```bash
cd insurance-app
python manage.py runserver
```

### Authentication Failed

**Error:**

```
✗ FAIL | Authentication | Status: 401
```

**Solutions:**

- Verify test user exists: `python manage.py shell` → `User.objects.get(username='testagent@patabima.com')`
- Check password is correct
- Verify user is active: `user.is_active = True`
- Check JWT authentication settings

### No Categories Returned

**Error:**

```
✗ FAIL | Get Categories | No categories returned
```

**Solutions:**

```bash
# Run migrations
python manage.py migrate

# Seed motor categories
python manage.py shell
>>> from app.models import MotorCategory
>>> MotorCategory.objects.create(name='Private', code='PRIVATE')
```

### Pricing Failed

**Error:**

```
✗ FAIL | Compare Pricing | Status: 500
```

**Solutions:**

- Check backend logs: `insurance-app/logs/django.log`
- Verify pricing data exists for test subcategory
- Check mandatory levies configured (ITL: 0.25%, PCF: 0.25%, Stamp Duty: KSh 40)

### Policy Creation Failed

**Error:**

```
✗ FAIL | Create Policy | Missing required fields
```

**Solutions:**

- Check serializer validation errors in backend logs
- Verify MotorPolicySubmissionSerializer requirements
- Ensure all required fields present in payload

## 🧪 Test Data

### Sample Vehicle Details

```json
{
  "registration": "KCB123A",
  "make": "Toyota",
  "model": "Corolla",
  "year_of_manufacture": 2020,
  "seating_capacity": 5,
  "engine_cc": 1800
}
```

### Sample Client Details

```json
{
  "fullName": "John Doe Kamau",
  "idNumber": "12345678",
  "phoneNumber": "+254712345678",
  "email": "john.kamau@example.com",
  "kraPin": "A123456789Z"
}
```

### Sample Pricing Inputs

```json
{
  "sum_insured": 800000,
  "start_date": "2025-10-21",
  "cover_period_months": 12
}
```

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Motor 2 Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: "3.9"

      - name: Install Dependencies
        run: |
          cd insurance-app
          pip install -r requirements.txt

      - name: Run Migrations
        run: |
          cd insurance-app
          python manage.py migrate

      - name: Start Backend
        run: |
          cd insurance-app
          python manage.py runserver &
          sleep 5

      - name: Run Integration Tests
        run: python tests/motor2_flow_integration_test.py
```

## 📝 Known Limitations

1. **Document Processing**: Actual S3 upload skipped (presign tested only)
2. **Payment Integration**: Payment gateway not tested
3. **Email Notifications**: Email sending not verified
4. **PDF Generation**: Policy PDF generation not tested
5. **Renewal Flow**: Policy renewal not included
6. **Extension Flow**: Policy extension not included

## 🎯 Next Steps

After successful tests:

1. ✅ Verify backend integration complete
2. ✅ Confirm all endpoints properly wired
3. ✅ Validate data flow end-to-end
4. 🔄 Test on staging environment
5. 🔄 Perform load testing (100+ concurrent requests)
6. 🔄 Test with real scanned documents
7. 🔄 Verify payment integration (M-PESA, DPO Pay)
8. 🔄 Test renewal and extension flows
9. 🔄 Verify SMS/email notifications
10. 🔄 Test offline mode and sync

## 📚 Related Documentation

- **API Endpoints**: `docs/MOTOR_INSURANCE_ENDPOINTS_PLAN.md`
- **Backend Implementation**: `docs/MOTOR2_BACKEND_IMPLEMENTATION_COMPLETE.md`
- **Pricing System**: `docs/COMPREHENSIVE_PRICING_SYSTEM.md`
- **Document Processing**: `docs/DOCUMENT_EXTRACTION_AUTO_FILL_INTEGRATION.md`

## 🤝 Support

For issues or questions:

- Check backend logs: `insurance-app/logs/`
- Review Django admin: `http://localhost:8000/admin/`
- Consult documentation in `docs/` directory

---

© 2025 PataBima. All rights reserved.

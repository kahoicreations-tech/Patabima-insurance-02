# Motor2 Test Suite - Quick Reference

## ✅ Self-Contained Tests - No Setup Required!

**The tests create their own test data** - no database seeding needed. Each test class uses `setUpTestData()` to create categories, subcategories, underwriters, and policies in an isolated test database.

## Running the Tests

### Full Test Suite

```bash
cd insurance-app
python manage.py test app.tests.test_motor2_integration -v 2
```

### Or use the PowerShell script

```powershell
cd insurance-app
.\run_motor2_tests.ps1
```

### Run Specific Test Classes

```bash
# Category tests only
python manage.py test app.tests.test_motor2_integration.Motor2CategoryTestCase -v 2

# Pricing tests only
python manage.py test app.tests.test_motor2_integration.Motor2PricingTestCase -v 2

# Policy creation tests only
python manage.py test app.tests.test_motor2_integration.Motor2PolicyCreationTestCase -v 2

# Policy listing tests only
python manage.py test app.tests.test_motor2_integration.Motor2PolicyListingTestCase -v 2

# Extendible product tests only
python manage.py test app.tests.test_motor2_integration.Motor2ExtendibleProductTestCase -v 2

# DMVIC certificate tests only
python manage.py test app.tests.test_motor2_integration.Motor2DMVICCertificateTestCase -v 2
```

### Run Individual Test Methods

```bash
python manage.py test app.tests.test_motor2_integration.Motor2CategoryTestCase.test_get_motor_categories -v 2
```

---

## Test Coverage

### 1. Motor2CategoryTestCase (3 tests)

- ✅ `test_get_motor_categories` - Verify category listing endpoint
- ✅ `test_get_subcategories_for_private` - Verify subcategory filtering
- ✅ `test_get_field_requirements` - Verify field requirements endpoint

### 2. Motor2PricingTestCase (2 tests)

- ✅ `test_underwriter_comparison_third_party` - Third Party fixed pricing
- ✅ `test_underwriter_comparison_comprehensive` - Comprehensive bracket pricing

### 3. Motor2PolicyCreationTestCase (5 tests)

- ✅ `test_create_third_party_policy_success` - Successful policy creation
- ✅ `test_duplicate_policy_guard` - 409 response for duplicates
- ✅ `test_duplicate_policy_with_force_create` - forceCreate override
- ✅ `test_dmvic_double_insurance_guard` - 409 for active DMVIC cover
- ✅ `test_dmvic_double_insurance_with_allow_proceed` - allowProceed override

### 4. Motor2PolicyListingTestCase (3 tests)

- ✅ `test_list_motor_policies` - List all policies
- ✅ `test_get_single_policy` - Retrieve single policy
- ✅ `test_filter_policies_by_status` - Filter by status

### 5. Motor2ExtendibleProductTestCase (2 tests)

- ✅ `test_create_extendible_policy_with_config` - Extendible config validation
- ✅ `test_extendible_policy_missing_config` - Missing config handling

### 6. Motor2DMVICCertificateTestCase (1 test)

- ✅ `test_download_certificate_pdf` - Certificate PDF download

**Total: 16 comprehensive tests**

---

## Test Data

### Test User

- Username: `testagent`
- Email: `agent@test.com`
- Password: `testpass123`

### Test Policies

- Policy 1: `POL-2025-001` (ACTIVE, Third Party)
- Policy 2: `POL-2025-002` (DRAFT, Comprehensive)
- Policy 3: `POL-2025-CERT-001` (ACTIVE with DMVIC certificate)

### Test Vehicles

- KDA123A - Toyota Corolla (Third Party)
- KDB456B - Honda (Comprehensive)
- KDC789C - Nissan X-Trail (Extendible)
- KDD123D - Mazda (With DMVIC certificate)

---

## Mocked Services

All tests use mocked DMVIC service calls to avoid external dependencies:

- `DMVICService.validate_double_insurance()` - Mocked to return configurable results
- `DMVICService.issue_type_a_certificate()` - Mocked for certificate issuance
- `DMVICService.get_certificate_pdf()` - Mocked to return test PDF bytes

---

## Expected Test Results

### ✅ Passing Tests Should Show:

```
test_create_third_party_policy_success ... ok
test_dmvic_double_insurance_guard ... ok
test_dmvic_double_insurance_with_allow_proceed ... ok
test_duplicate_policy_guard ... ok
test_duplicate_policy_with_force_create ... ok
test_download_certificate_pdf ... ok
test_filter_policies_by_status ... ok
test_get_field_requirements ... ok
test_get_motor_categories ... ok
test_get_single_policy ... ok
test_get_subcategories_for_private ... ok
test_list_motor_policies ... ok
test_underwriter_comparison_comprehensive ... ok
test_underwriter_comparison_third_party ... ok
test_create_extendible_policy_with_config ... ok
test_extendible_policy_missing_config ... ok

Ran 16 tests in X.XXXs
OK
```

---

## Troubleshooting

### Database Errors

```bash
# Reset test database
python manage.py migrate --run-syncdb
```

### Import Errors

```bash
# Verify all dependencies installed
pip install -r requirements.txt
```

### DMVIC Service Not Found

Make sure `app/services/dmvic_service.py` exists with `DMVICService` class.

### Test Discovery Issues

```bash
# List all available tests
python manage.py test --help
python manage.py test app.tests --list-tests
```

---

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml or similar
- name: Run Motor2 Tests
  run: |
    cd insurance-app
    python manage.py test app.tests.test_motor2_integration --parallel
```

---

## Next Steps

1. Run the test suite to verify all Motor2 functionality
2. Add more edge case tests as needed
3. Integrate with coverage.py for test coverage reports:
   ```bash
   pip install coverage
   coverage run --source='app' manage.py test app.tests.test_motor2_integration
   coverage report
   coverage html  # Generate HTML report
   ```

---

**Last Updated:** November 10, 2025  
**Test Suite Version:** 1.0  
**Coverage:** 16 tests across 6 test classes

# Motor 2 Integration Test Suite - Quick Reference

## 📦 Files Created

1. **`motor2_flow_integration_test.py`** - Main test script (Python)
2. **`run_motor2_tests.ps1`** - Windows PowerShell runner
3. **`run_motor2_tests.sh`** - Unix/Linux/Mac bash runner
4. **`MOTOR2_INTEGRATION_TESTS.md`** - Complete documentation
5. **`fixtures/README.md`** - Test document requirements

## 🚀 Quick Start

### Windows (PowerShell)

```powershell
cd tests
.\run_motor2_tests.ps1
```

### Unix/Linux/Mac

```bash
cd tests
chmod +x run_motor2_tests.sh
./run_motor2_tests.sh
```

### Direct Python

```bash
python tests/motor2_flow_integration_test.py
```

## 📋 Prerequisites Checklist

Before running tests:

- [ ] Backend server running (`python manage.py runserver`)
- [ ] Database migrated and seeded with motor categories
- [ ] Test user created (default: `testagent@patabima.com`)
- [ ] Edit test script with correct credentials if needed

## 🎯 What Gets Tested

1. ✅ **Authentication** - JWT token retrieval
2. ✅ **Categories API** - `/api/v1/motor/categories/`
3. ✅ **Subcategories API** - `/api/v1/motor/subcategories/`
4. ✅ **Pricing Comparison** - `/api/v1/public_app/insurance/compare_motor_pricing/`
5. ✅ **Document Processing** - `/api/v1/docs/*` endpoints
6. ✅ **Policy Creation** - `/api/v1/policies/motor/create/`
7. ✅ **Policy Retrieval** - `/api/v1/policies/motor/{policy_number}/`
8. ✅ **List Policies** - `/api/v1/policies/motor/`

## 📊 Expected Output

```
╔════════════════════════════════════════════════════════════════════╗
║          MOTOR 2 FLOW INTEGRATION TEST SUITE                       ║
╚════════════════════════════════════════════════════════════════════╝

✓ PASS | Authentication
✓ PASS | Get Categories (Found 6 categories)
✓ PASS | Get Subcategories (Found 7 subcategories)
✓ PASS | Compare Pricing (Received 3 quotes)
✓ PASS | Document Presign (Job ID: xxx)
✓ PASS | Create Policy (Policy Number: POL-2025-001234)
✓ PASS | Get Policy (Retrieved policy POL-2025-001234)
✓ PASS | List Policies (Found 5 policies)

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
```

## 🔧 Configuration

### Change Backend URL

```bash
# PowerShell
.\run_motor2_tests.ps1 -BackendUrl "http://192.168.1.100:8000"

# Bash
./run_motor2_tests.sh --url "http://192.168.1.100:8000"
```

### Change Test User

Edit `motor2_flow_integration_test.py`:

```python
TEST_USER = {
    "phonenumber": "712345678",       # 9 digits without leading 0
    "password": "your_password"
}
```

## 🐛 Common Issues

### "Cannot connect to backend"

**Solution:** Start Django server

```bash
cd insurance-app
python manage.py runserver
```

### "Authentication failed"

**Solution:** Check test user exists

```bash
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> User.objects.filter(username='testagent@patabima.com')
```

### "No categories returned"

**Solution:** Seed motor categories

```bash
python manage.py migrate
# Then seed data via admin or shell
```

## 📚 Full Documentation

For detailed documentation, see:

- **`MOTOR2_INTEGRATION_TESTS.md`** - Complete guide
- **`fixtures/README.md`** - Test document requirements

## ✅ Success Criteria

All tests should pass with:

- ✓ Authentication successful
- ✓ Categories retrieved
- ✓ Pricing calculated correctly
- ✓ Policy created with policy number
- ✓ Policy retrievable by number

## 🎯 Next Actions

After successful tests:

1. ✅ Verify all endpoints working
2. 🔄 Test with real documents in `fixtures/`
3. 🔄 Run on staging environment
4. 🔄 Perform load testing
5. 🔄 Test payment integration
6. 🔄 Test renewal/extension flows

---

**Need Help?** See full documentation in `MOTOR2_INTEGRATION_TESTS.md`

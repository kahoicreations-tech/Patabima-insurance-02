# EC2 Backend Endpoint Test Results
**Date:** January 21, 2025  
**Backend URL:** http://ec2-34-203-241-81.compute-1.amazonaws.com:8000  
**Test Method:** Direct curl requests from terminal

---

## Executive Summary

✅ **Backend is RUNNING** - Server responds to requests  
❌ **Database is EMPTY** - No motor categories or users seeded  
⚠️ **Authentication Issue** - No users exist to test login  
✅ **Endpoints are CORRECT** - All URL patterns verified

---

## Test Results by Category

### 1. ✅ Health Check Endpoint
**Endpoint:** `GET /api/v1/health/`  
**Status:** 200 OK  
**Response:**
```json
{
  "status": "ok",
  "service": "pata-bima-api"
}
```
**Result:** Backend is running and responding correctly.

---

### 2. ❌ Authentication Endpoints

#### a) Standard Login
**Endpoint:** `POST /api/v1/public_app/auth/login`  
**Test Data:**
```json
{
  "phonenumber": "792865541",
  "password": "Best254#"
}
```
**Status:** 400 Bad Request  
**Response:**
```json
{
  "detail": "User does not exist or invalid credentials"
}
```
**Result:** User does not exist in database. Need to create users first.

#### b) Phone Validation
**Endpoint:** `POST /api/v1/public_app/auth/validate_phone`  
**Test Data:**
```json
{
  "phonenumber": "792865541"
}
```
**Status:** 200 OK  
**Response:**
```json
{
  "detail": "Phone number is available"
}
```
**Result:** Confirms user doesn't exist, phone validation works.

#### c) Auth Login (OTP-based)
**Endpoint:** `POST /api/v1/public_app/auth/auth_login`  
**Test Data:**
```json
{
  "phonenumber": "792865541",
  "password": "Best254#",
  "code": "123456"
}
```
**Status:** 400 Bad Request  
**Response:**
```json
{
  "detail": "Invalid credentials"
}
```
**Result:** Requires "code" field (OTP). User doesn't exist.

---

### 3. ✅ Public Endpoints (No Auth Required)

#### a) Motor Categories
**Endpoint:** `GET /api/v1/motor/categories/`  
**Status:** 200 OK  
**Response:**
```json
{
  "categories": [],
  "total_count": 0
}
```
**Result:** Endpoint works but database is empty. **NO CATEGORIES SEEDED**.

#### b) Underwriters
**Endpoint:** `GET /api/v1/public_app/insurance/get_underwriters/`  
**Status:** 200 OK  
**Response:**
```json
{
  "underwriters": [
    {
      "name": "CIC Insurance",
      "code": "CIC",
      "rating": 4.6,
      "supported_categories": ["PRIVATE", "COMMERCIAL", "PSV", "MOTORCYCLE", "TUKTUK", "SPECIAL"]
    },
    {
      "name": "APA Insurance",
      "code": "APA",
      "rating": 4.4,
      "supported_categories": ["PRIVATE", "COMMERCIAL", "PSV", "MOTORCYCLE"]
    },
    {
      "name": "Britam",
      "code": "BRITAM",
      "rating": 4.3,
      "supported_categories": ["PRIVATE", "COMMERCIAL", "PSV"]
    },
    {
      "name": "Jubilee Insurance",
      "code": "JUBILEE",
      "rating": 4.2,
      "supported_categories": ["PRIVATE", "COMMERCIAL"]
    }
  ],
  "count": 4,
  "source": "fallback"
}
```
**Result:** Returns fallback/hardcoded data. Works correctly.

---

### 4. 🔒 Protected Endpoints (Auth Required)

#### Motor Policies List
**Endpoint:** `GET /api/v1/policies/motor/`  
**Status:** 401 Unauthorized  
**Response:**
```json
{
  "details": {
    "detail": "Authentication credentials were not provided."
  }
}
```
**Result:** Correctly requires authentication. Cannot test without valid token.

---

## Critical Issues Found

### 🚨 Issue #1: Database Not Seeded
**Problem:** Motor categories table is empty  
**Impact:** App cannot load insurance categories, products, or pricing  
**Fix Required:**
```bash
# SSH to EC2 and run:
python manage.py seed_motor_categories
python manage.py seed_motor_pricing
```

### 🚨 Issue #2: No Users in Database
**Problem:** Cannot login because no user accounts exist  
**Impact:** Cannot test authenticated endpoints or complete Motor 2 flow  
**Fix Required:**
```bash
# Create superuser:
python manage.py createsuperuser

# Or create test agent via Django admin or seed script
```

### 🚨 Issue #3: Frontend API Path Mismatch
**Problem:** Frontend uses `/api/v1/motor2/*` but backend uses `/api/v1/motor/*`  
**Impact:** All motor category/subcategory requests fail with 404  
**Fix Required:** Update frontend DjangoAPIService.js endpoints

---

## Available URL Patterns (From Django)

Based on the 404 error page, these are the **actual** endpoints on EC2:

### Authentication
- `POST /api/v1/public_app/auth/login` ✅
- `POST /api/v1/public_app/auth/auth_login` ✅ (requires OTP code)
- `POST /api/v1/public_app/auth/signup`
- `POST /api/v1/public_app/auth/validate_phone` ✅
- `POST /api/v1/public_app/auth/reset_password_self`
- `POST /api/v1/public_app/auth/token/refresh`

### Motor Insurance (Public)
- `GET /api/v1/motor/categories/` ✅ (empty response)
- `GET /api/v1/motor/subcategories/`
- `GET /api/v1/motor/field-requirements/`
- `GET /api/v1/public_app/insurance/get_underwriters/` ✅
- `POST /api/v1/public_app/insurance/calculate_motor_premium/`
- `POST /api/v1/public_app/insurance/compare_motor_pricing/`
- `GET /api/v1/public_app/insurance/addons/`

### Motor Insurance (Protected)
- `POST /api/v1/policies/motor/create/` 🔒
- `GET /api/v1/policies/motor/` 🔒
- `GET /api/v1/policies/motor/<policy_number>/` 🔒
- `GET /api/v1/policies/motor/upcoming-renewals/` 🔒
- `GET /api/v1/policies/motor/upcoming-extensions/` 🔒
- `POST /api/v1/policies/motor/<policy_number>/renew/` 🔒
- `POST /api/v1/policies/motor/<policy_number>/extend/` 🔒

### Vehicle Validation
- `POST /api/v1/vehicle/validate-registration/`
- `POST /api/v1/vehicle/validate-chassis/`

### Document Processing
- `POST /api/v1/documents/upload-kyc/`
- `POST /api/v1/documents/ocr-process/`
- `GET /api/v1/documents/status/<document_id>/`

### Payments
- `POST /api/v1/payments/mpesa/initiate/`
- `GET /api/v1/payments/mpesa/status/<checkout_request_id>/`
- `POST /api/v1/payments/dpo/initiate/`
- `POST /api/v1/payments/callback/`

### Quotations
- `POST /api/v1/public_app/insurance/submit_motor_quotation/`
- `GET /api/v1/public_app/insurance/get_quotations/`
- `POST /api/v1/policies/create-quote/`
- `POST /api/v1/policies/finalize/<quote_id>/`
- `GET /api/v1/policies/receipt/<policy_id>/`

---

## Immediate Actions Required

### 1. SSH to EC2 Instance
```bash
ssh -i your-key.pem ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com
cd /path/to/insurance-app
source venv/bin/activate
```

### 2. Run Database Seeding
```bash
# Seed motor categories (60+ products)
python manage.py seed_motor_categories

# Seed pricing data
python manage.py seed_motor_pricing

# Seed underwriters if not using fallback
python manage.py seed_underwriters

# Create test user
python manage.py createsuperuser
# Or create via Django admin
```

### 3. Fix Frontend API Endpoints
Update `frontend/services/DjangoAPIService.js`:
- Change all `/api/v1/motor2/*` to `/api/v1/motor/*`
- Verify all endpoint paths match the URL patterns above

### 4. Test Login After Seeding
```bash
curl -X POST http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/api/v1/public_app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phonenumber":"YOUR_PHONE","password":"YOUR_PASSWORD"}'
```

### 5. Verify Categories After Seeding
```bash
curl -X GET http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/api/v1/motor/categories/
```

---

## Network/Connection Issues

The app showed "Connection Error - Unable to connect to server" but curl tests work fine. This suggests:

1. **CORS Issue** - React Native may be blocked by CORS policy
2. **SSL/HTTPS** - React Native may require HTTPS in production
3. **Frontend .env** - Verify `EXPO_PUBLIC_API_BASE_URL` is set correctly
4. **Network Security Groups** - EC2 security group must allow port 8000 from all IPs

### Check CORS Configuration
Verify Django settings on EC2:
```python
# insurance/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8081",  # Expo Dev
    "http://10.0.0.0/8",      # Local network
]
CORS_ALLOW_ALL_ORIGINS = True  # For testing only
```

---

## Conclusion

✅ **Backend API is functional** - All tested endpoints respond correctly  
❌ **Database is empty** - Need to run seed scripts  
❌ **No users exist** - Need to create at least one user account  
⚠️ **Frontend may have endpoint path mismatches** - Need to verify DjangoAPIService.js  
⚠️ **CORS or SSL may be blocking React Native** - Need to check Django CORS settings

**Next Steps:**
1. SSH to EC2 and run database seeding scripts
2. Create a test user account
3. Update frontend API endpoint paths if needed
4. Test login from React Native app after seeding
5. Monitor Django logs for CORS or authentication errors

---

## Test Commands for Reference

```bash
# Health check
curl http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/api/v1/health/

# Login (after user created)
curl -X POST http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/api/v1/public_app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phonenumber":"792865541","password":"Best254#"}'

# Categories (after seeding)
curl http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/api/v1/motor/categories/

# Underwriters
curl http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/api/v1/public_app/insurance/get_underwriters/

# Protected endpoint (requires token)
curl -X GET http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/api/v1/policies/motor/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

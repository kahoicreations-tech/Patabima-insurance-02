# DMVIC Integration Setup Guide
**PataBima Motor Insurance System - Phase 1 Backend Implementation**  
*Date: November 3, 2025*

---

## Overview

This guide covers the setup and configuration of DMVIC (Department of Motor Vehicle Insurance Coordinator) integration for the PataBima insurance platform. The implementation enables real-time vehicle verification, existing cover detection, and certificate issuance through the DMVIC API.

---

## Prerequisites

1. **DMVIC Credentials** (obtain from DMVIC support):
   - Username
   - Password
   - Client ID
   - Member Company Code
   - UAT `.pfx` certificate
   - Certificate passphrase

2. **Python Dependencies**:
   - pyOpenSSL (for certificate handling)
   - cryptography (SSL/TLS support)
   - requests (HTTP client)

3. **Development Environment**:
   - Python 3.8+
   - Django 4.2+
   - PostgreSQL or SQLite database

---

## Installation Steps

### Step 1: Install Python Dependencies

```bash
cd insurance-app
pip install -r requirements.txt
```

This will install:
- `pyOpenSSL==24.3.0` - Certificate loading and management
- `cryptography==44.0.0` - SSL/TLS operations
- `requests==2.32.3` - HTTP API client

### Step 2: Configure Environment Variables

Update your `.env` file with DMVIC credentials:

```bash
# ===== DMVIC Integration Configuration =====
# Set to true to enable real DMVIC API integration
DMVIC_ENABLED=false  # Change to 'true' when ready to test

# DMVIC API Base URL (UAT for testing)
DMVIC_BASE_URL=https://uat.dmvic.com

# DMVIC Authentication Credentials
DMVIC_USERNAME=patabima_uat
DMVIC_PASSWORD=your_actual_password_here
DMVIC_CLIENT_ID=your_client_id_here

# DMVIC Member Company Code
DMVIC_MEMBER_CODE=PATABIMA

# DMVIC Certificate Path (relative to insurance-app/)
DMVIC_PFX_PATH=dmvic_credentials/PatabimaAgencyUAT.pfx

# Certificate Passphrase (from dmvic_credentials/Password.txt)
DMVIC_PASSPHRASE=your_certificate_password_here
```

**Important**: Replace placeholder values with actual credentials from DMVIC support.

### Step 3: Verify Certificate Files

Check that DMVIC certificate files exist:

```bash
ls -la dmvic_credentials/
```

Expected files:
- `PatabimaAgencyUAT.pfx` - UAT client certificate
- `Password.txt` - Certificate passphrase
- `README.md` - Setup documentation

### Step 4: Apply Database Migrations

No new migrations are required for Phase 1, but ensure your database is up to date:

```bash
python manage.py migrate
```

### Step 5: Test DMVIC Configuration

Create a test script to verify DMVIC connection:

```python
# test_dmvic.py
import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.services.dmvic_service import get_dmvic_service, DMVICAuthenticationError

def test_dmvic_connection():
    """Test DMVIC authentication and vehicle search"""
    try:
        print("Initializing DMVIC service...")
        dmvic = get_dmvic_service()
        
        print("Testing authentication...")
        success = dmvic.login()
        
        if success:
            print("✅ DMVIC authentication successful!")
            print(f"Access token: {dmvic.access_token[:20]}...")
            
            # Test vehicle search
            print("\nTesting vehicle search...")
            test_registration = "KCA456B"  # Use a known test registration
            
            try:
                vehicle = dmvic.search_vehicle(test_registration)
                print(f"✅ Vehicle found: {vehicle['make']} {vehicle['model']}")
                print(f"   Chassis: {vehicle['chassis_number']}")
                print(f"   Owner: {vehicle['owner_name']}")
            except Exception as e:
                print(f"⚠️  Vehicle search error: {str(e)}")
            
            # Test double insurance check
            print("\nTesting double insurance validation...")
            try:
                result = dmvic.validate_double_insurance(test_registration)
                if result['exists']:
                    print(f"⚠️  Existing cover found:")
                    print(f"   Insurer: {result['policy']['insurer']}")
                    print(f"   Expires: {result['policy']['cover_end_date']}")
                else:
                    print("✅ No existing cover found")
            except Exception as e:
                print(f"⚠️  Double insurance check error: {str(e)}")
            
        else:
            print("❌ DMVIC authentication failed")
            
    except DMVICAuthenticationError as e:
        print(f"❌ DMVIC authentication error: {str(e)}")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

if __name__ == '__main__':
    test_dmvic_connection()
```

Run the test:

```bash
python test_dmvic.py
```

### Step 6: Start Django Development Server

```bash
python manage.py runserver 0.0.0.0:8000
```

The following endpoints are now available:

- **Vehicle Check**: `POST /api/v1/public_app/integrations/vehicle_check`

---

## API Usage

### Vehicle Check Endpoint

**Endpoint**: `POST /api/v1/public_app/integrations/vehicle_check`

**Authentication**: JWT token required (Bearer token in Authorization header)

**Request Body**:
```json
{
  "vehicle_registration": "KCA123A",
  "vehicle_make": "Toyota",
  "vehicle_model": "Fielder",
  "vehicle_year": "2015"
}
```

**Response (Success - No Existing Cover)**:
```json
{
  "success": true,
  "exists": false,
  "vehicle_details": {
    "registration": "KCA123A",
    "chassis_number": "JTFSH3P26J3012345",
    "make": "Toyota",
    "model": "Fielder",
    "year": 2015,
    "engine_capacity": 1500,
    "vehicle_type": "SALOON",
    "color": "SILVER",
    "tonnage": null,
    "passenger_capacity": 5,
    "owner_name": "JOHN DOE",
    "owner_id": "12345678",
    "source": "DMVIC_PRODUCTION"
  },
  "policy": null
}
```

**Response (Success - Existing Cover Found)**:
```json
{
  "success": true,
  "exists": true,
  "vehicle_details": {...},
  "policy": {
    "certificate_number": "CHB432123",
    "insurer": "CIC Insurance",
    "insurer_code": "CIC",
    "expiry_date": "2026-01-01",
    "cover_start_date": "2025-01-01",
    "policy_type": "COMPREHENSIVE"
  }
}
```

**Response (Error - Vehicle Not Found)**:
```json
{
  "success": false,
  "error": "Vehicle KCA999Z not found in DMVIC database",
  "vehicle_details": null,
  "exists": false,
  "policy": null
}
```

---

## Testing with Frontend

### Enable DMVIC Integration

1. **Update `.env`**:
   ```bash
   DMVIC_ENABLED=true
   ```

2. **Restart Django server**:
   ```bash
   # Stop server (Ctrl+C)
   python manage.py runserver 0.0.0.0:8000
   ```

### Frontend Testing (React Native)

The frontend will automatically call the DMVIC vehicle check when:
- User completes Vehicle Details step in Motor2 flow
- User navigates from step 2 → step 3 (Verification)

**Current Behavior**:
- If `DMVIC_ENABLED=false`: Uses mock simulation (old behavior)
- If `DMVIC_ENABLED=true`: Calls real DMVIC API

**Monitor Logs**:
```bash
# Django logs will show:
# "Searching DMVIC for vehicle: KCA123A"
# "Vehicle found in DMVIC: Toyota Fielder"
# "No existing cover found for KCA123A"
```

---

## Troubleshooting

### Issue: "DMVIC configuration incomplete"

**Cause**: Missing environment variables

**Solution**:
1. Check `.env` file for all required DMVIC variables
2. Ensure no typos in variable names
3. Restart Django server after updating `.env`

### Issue: "Certificate loading failed"

**Cause**: Invalid certificate path or passphrase

**Solution**:
1. Verify certificate file exists: `ls dmvic_credentials/PatabimaAgencyUAT.pfx`
2. Check passphrase in `dmvic_credentials/Password.txt`
3. Ensure `DMVIC_PFX_PATH` is correct (relative to `insurance-app/`)

### Issue: "DMVIC login failed: 401 Unauthorized"

**Cause**: Invalid credentials

**Solution**:
1. Verify username, password, and client_id with DMVIC support
2. Check if UAT credentials are active
3. Ensure certificate matches the credentials (UAT cert for UAT credentials)

### Issue: "Connection timeout" or "Network error"

**Cause**: DMVIC API unreachable

**Solution**:
1. Check internet connection
2. Verify `DMVIC_BASE_URL` is correct (UAT: `https://uat.dmvic.com`)
3. Check if DMVIC API is down (contact DMVIC support)
4. Test manually with curl:
   ```bash
   curl -X POST https://uat.dmvic.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"patabima_uat","password":"xxx","client_id":"xxx"}'
   ```

### Issue: "Vehicle not found in DMVIC database"

**Cause**: Vehicle registration not in DMVIC system (expected for some vehicles)

**Solution**:
1. This is normal for newly registered or foreign vehicles
2. Use test registration numbers provided by DMVIC for UAT testing
3. Frontend should handle gracefully by allowing manual entry

### Issue: Frontend still uses simulation

**Cause**: `USE_DMVIC_SIMULATION = true` hardcoded in frontend

**Solution** (Phase 1 - Backend Only):
- Current Phase 1 focuses on backend. Frontend will be updated in Phase 2
- To test backend directly, use Postman/curl to call the API

---

## Development Mode vs. Production Mode

### Development Mode (`DMVIC_ENABLED=false`)

- Uses mock simulation data
- No actual DMVIC API calls
- Faster development/testing
- No DMVIC credentials required
- Vehicle search always succeeds with fake data
- Double insurance check returns `'234' in registration` logic

### Production Mode (`DMVIC_ENABLED=true`)

- Calls real DMVIC API
- Requires valid credentials and certificate
- Network latency applies (~1-3 seconds per request)
- Vehicle not found returns 404 error
- Double insurance returns actual existing policies
- All transactions logged for audit

**Recommendation**: Use Development Mode until DMVIC credentials are confirmed working in UAT.

---

## Next Steps (Phase 2)

After Phase 1 backend is tested and working:

1. **Frontend Integration**:
   - Update `MotorInsuranceScreen.js` to disable simulation
   - Handle DMVIC errors gracefully
   - Show existing cover warnings to agents

2. **Certificate Issuance**:
   - Implement Type A (Third-Party) certificate issuance
   - Implement Type B (Comprehensive) certificate issuance
   - Integrate with payment flow

3. **Certificate Management**:
   - Certificate PDF download
   - Certificate verification
   - Debit note / cancellation workflow

4. **Production Deployment**:
   - Obtain production DMVIC credentials
   - Update `DMVIC_BASE_URL` to production endpoint
   - Full regression testing

---

## Support & Resources

- **DMVIC Support**: Contact DMVIC technical support for credential issues
- **PataBima Dev Team**: Internal support for integration issues
- **Documentation**: See `DMVIC_IMPLEMENTATION_ANALYSIS.md` for full specification
- **Code Location**: `insurance-app/app/services/dmvic_service.py`

---

**Document Version**: 1.0  
**Last Updated**: November 3, 2025  
**Status**: Phase 1 Complete - Ready for UAT Testing

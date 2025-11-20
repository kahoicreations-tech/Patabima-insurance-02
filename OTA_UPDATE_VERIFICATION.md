# OTA Update Verification Guide

**Date:** November 18, 2025  
**Update ID:** 170b8604-5ef2-4c44-b10f-10676d9df53a  
**Backend:** http://44.200.182.180

---

## What to Check After App Installs

### Step 1: Open Backend Switcher
1. On the login screen, **tap the version number 7 times** (bottom of screen: "PataBima - Ver 1.0.0")
2. Backend Switcher modal should appear

### Step 2: Verify OTA Update Loaded

Look for the **gray debug box at the top** - it should show:

```
🔍 OTA Debug Info:
Build: 1.0.2 | [Current timestamp]
Django Service: ✓ Init
Env Loaded: ✓ Yes (GREEN COLOR)
```

**If "Env Loaded: ✓ Yes" shows in GREEN** → OTA update worked! ✅

### Step 3: Check Environment Variables

Below the debug box, check these values:

- **Environment base:** Should show `http://44.200.182.180` (NOT "(none)")
- **Stored override:** Should show `(none)` or `override:http://44.200.182.180`
- **Effective base:** Should show `http://44.200.182.180`

### Step 4: Test Backend Connectivity

1. Click **"Clear Override"** button (if there's any override)
2. Click **"Test Ping"** button
3. Wait a few seconds

**Expected Result:**
```
OK: http://44.200.182.180/api/v1/health/ [200]
```

**If it shows "Failed":**
- The backend might be down
- Network connectivity issue
- HTTPS redirect still blocking (check EC2 settings)

---

## Console Logs to Check

When you open Backend Switcher, check the terminal/console for:

```
🔍 Backend Switcher Debug:
  Environment Base: http://44.200.182.180
  Stored Override: (none)
  Effective Base: http://44.200.182.180
  DjangoAPIService initialized: true
  OTA Update Timestamp: 2025-11-18T...
```

---

## Troubleshooting

### Issue: Environment base shows "(none)"

**Cause:** OTA update didn't apply or env vars not loaded

**Fix:**
1. Force close the app completely
2. Reopen the app
3. Wait 10 seconds for OTA update to download
4. Try Backend Switcher again

**Alternative Fix:**
1. Click "Save Override" with `http://44.200.182.180`
2. This manually sets the backend URL

### Issue: Test Ping shows "Failed"

**Cause:** Backend not responding or HTTPS redirect

**Fix on EC2:**
```bash
# SSH into EC2
ssh ec2-user@44.200.182.180

# Check if Django service is running
sudo systemctl status patabima

# Check environment variable
cat /var/www/patabima/.env | grep SECURE_SSL_REDIRECT

# Should show: SECURE_SSL_REDIRECT=False
# If not, add it and restart:
echo "SECURE_SSL_REDIRECT=False" | sudo tee -a /var/www/patabima/.env
sudo systemctl restart patabima
```

### Issue: "Env Loaded: ✗ No" (RED)

**Cause:** Environment variables not exported in build

**Fix:** Rebuild APK with correct env vars:
```powershell
cd frontend
eas build --profile production-apk --platform android
```

This takes 15-20 minutes but guarantees env vars are baked in.

---

## Success Criteria

✅ **OTA Update Successful When:**
1. Debug box shows "Env Loaded: ✓ Yes" (GREEN)
2. Environment base shows `http://44.200.182.180`
3. Test Ping shows "OK: ..." response
4. Login flow works without network errors

---

## Next Steps After Success

1. **Test Login Flow:**
   - Enter phone: `0790000000` (or your test number)
   - Enter password
   - Verify OTP flow works

2. **Test API Calls:**
   - Check if motor categories load
   - Verify quotations screen loads
   - Test document upload

3. **Monitor Logs:**
   - Watch for any API errors
   - Check response times
   - Verify data loads correctly

---

## EC2 Backend Status Check

From your computer, verify backend is running:

```powershell
# Test health endpoint
curl http://44.200.182.180/api/v1/health/

# Expected response:
{"status": "ok", "service": "pata-bima-api"}

# Test motor categories
curl http://44.200.182.180/api/v1/public_app/insurance/motor_categories

# Should return JSON with categories array
```

---

## OTA Update Timeline

- **1st Update Published:** 12:05 PM (Fix EC2 backend URL)
- **2nd Update Published:** 12:15 PM (Add debug info)
- **Runtime Version:** 1.0.2 (matches APK build)
- **Channel:** production
- **Auto-check:** ON_LOAD (checks on app start)

OTA updates apply automatically when the app is reopened. If the app was already running, force close and reopen to trigger the update check.

---

## Contact Information

**EC2 Instance:** i-0d0f116005d812275  
**Public IP:** 44.200.182.180  
**Region:** us-east-1  
**RDS Database:** patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com

# Backend Switching Guide

Quick guide to switch PataBima frontend between local development and EC2 production backend.

## Quick Start

### Switch to EC2 Backend (Recommended for Testing)

```powershell
cd frontend
.\switch-backend.ps1 -Environment ec2
npm start
# Press 'r' to reload
```

**EC2 Details:**
- URL: `http://44.200.182.180`
- Instance: `i-0d0f116005d812275`
- Region: `us-east-1`
- Database: RDS PostgreSQL (6 categories, 62 subcategories, 8 providers)

---

### Switch to Local Backend (Development)

```powershell
cd frontend
.\switch-backend.ps1 -Environment local

# In another terminal:
cd insurance-app
python manage.py runserver 0.0.0.0:8000
```

**Local Details:**
- URL: `http://10.0.2.2:8000` (Android Emulator)
- URL: `http://localhost:8000` (iOS Simulator)
- Database: Local SQLite or PostgreSQL

---

## Available Environments

| Environment | URL | Use Case | Status |
|------------|-----|----------|--------|
| `local` | http://10.0.2.2:8000 | Local development | ✅ Ready |
| `ec2` | http://44.200.182.180 | EC2 testing (HTTP) | ✅ Ready |
| `staging` | http://44.200.182.180 | Staging environment | ✅ Ready |
| `production` | https://api.patabima.co.ke | Production with SSL | ⏳ Pending DNS/SSL |

---

## Command Reference

### Universal Switcher (Recommended)

```powershell
# Switch to any environment
.\switch-backend.ps1 -Environment [local|ec2|staging|production]
```

### Legacy Scripts (Still Work)

```powershell
# EC2
.\switch-to-ec2.ps1

# Local
.\switch-to-local.ps1
```

---

## How It Works

1. **Environment Files:**
   - `.env.local` - Active environment (auto-updated by scripts)
   - `.env.local.backup` - Backup of previous config
   - `.env.ec2` - EC2 configuration template

2. **API Service:**
   - `services/DjangoAPIService.js` reads `EXPO_PUBLIC_API_BASE_URL`
   - Falls back to `__DEV__` detection if env var missing

3. **Switching Process:**
   ```
   Script → Update .env.local → Expo reads env var → API service uses new URL
   ```

---

## Verification Steps

### After Switching to EC2:

```powershell
# Test API from terminal
curl http://44.200.182.180/api/v1/motor2/categories/

# Expected response:
# {"categories": [...], "total_count": 6}
```

### After Switching to Local:

```powershell
# Ensure Django is running
cd insurance-app
python manage.py runserver 0.0.0.0:8000

# Test API
curl http://localhost:8000/api/v1/motor2/categories/
```

### In React Native App:

1. Open Motor Insurance screen
2. Should see 6 categories load
3. Check console logs for API calls
4. If using EC2, look for: `http://44.200.182.180/api/v1/...`

---

## Troubleshooting

### Issue: "Network request failed"

**Solution:**
```powershell
# Verify backend is running
# For EC2:
curl http://44.200.182.180/api/v1/motor2/categories/

# For Local:
curl http://localhost:8000/api/v1/motor2/categories/
```

### Issue: "Still using old URL after switching"

**Solution:**
```powershell
# 1. Verify .env.local was updated
cat frontend/.env.local

# 2. Restart Expo completely
# Stop Metro (Ctrl+C)
npm start -- --clear  # Clear cache

# 3. Reload app (Press 'r')
```

### Issue: EC2 returning 502 Bad Gateway

**Solution:**
```powershell
# Check EC2 services
aws ec2 describe-instances --instance-ids i-0d0f116005d812275

# SSH to EC2 and check services
ssh ec2-user@44.200.182.180
sudo systemctl status patabima nginx
```

### Issue: CORS errors with EC2

**Solution:**
EC2 backend already has CORS configured for local development:
- `http://localhost:19006` (Expo web)
- `exp://192.168.x.x:19000` (Expo mobile)

If still seeing CORS errors, verify in EC2:
```bash
cd /var/www/patabima
cat insurance/settings.py | grep CORS
```

---

## Environment Variables Reference

### Current `.env.local`:
```bash
# Backend Environment: ec2
# Last updated: 2025-11-16 15:50:50
EXPO_PUBLIC_API_BASE_URL=http://44.200.182.180
```

### DjangoAPIService.js reads:
```javascript
const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};
```

---

## Next Steps: SSL Setup

To use `production` environment with HTTPS:

1. **Configure DNS:**
   ```
   api.patabima.co.ke → 44.200.182.180 (A record)
   ```

2. **Install SSL on EC2:**
   ```bash
   ssh ec2-user@44.200.182.180
   sudo dnf install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.patabima.co.ke
   ```

3. **Switch Frontend:**
   ```powershell
   .\switch-backend.ps1 -Environment production
   ```

4. **Update Backend:**
   ```bash
   # On EC2
   cd /var/www/patabima
   nano .env
   # Set: DEBUG=False
   sudo systemctl restart patabima nginx
   ```

See: `docs/EC2_FRONTEND_INTEGRATION_GUIDE.md` for full SSL setup guide.

---

## Quick Test Script

```powershell
# Test all environments
Write-Host "Testing Local Backend..."
curl http://localhost:8000/api/v1/motor2/categories/

Write-Host "`nTesting EC2 Backend..."
curl http://44.200.182.180/api/v1/motor2/categories/

Write-Host "`nTesting Production Backend (when SSL ready)..."
curl https://api.patabima.co.ke/api/v1/motor2/categories/
```

---

**Last Updated:** November 16, 2025  
**Current Backend:** EC2 (http://44.200.182.180)  
**Status:** ✅ Fully operational

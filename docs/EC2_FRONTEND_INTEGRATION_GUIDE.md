# EC2 Backend Integration Guide for React Native Frontend

**Last Updated:** November 15, 2025  
**EC2 Instance:** i-0d0f116005d812275  
**Public IP:** 44.200.182.180  
**Domain (Pending):** api.patabima.co.ke

---

## Table of Contents

1. [Current Deployment Status](#current-deployment-status)
2. [Frontend Configuration](#frontend-configuration)
3. [API Endpoints Reference](#api-endpoints-reference)
4. [Accessing EC2 Instance](#accessing-ec2-instance)
5. [Backend Management Commands](#backend-management-commands)
6. [Switching Between Local and Production Backend](#switching-between-local-and-production-backend)
7. [Troubleshooting](#troubleshooting)
8. [Next Steps: SSL Setup](#next-steps-ssl-setup)

---

## Current Deployment Status

### ✅ What's Working

- **EC2 Instance:** Running on Amazon Linux 2023, t3.small
- **Public IP:** `44.200.182.180` (accessible via HTTP)
- **Backend Stack:**
  - Django 4.2.16
  - Gunicorn 21.2.0 (3 workers, 2 threads)
  - Nginx 1.28.0 (reverse proxy)
  - PostgreSQL 15.8 (RDS)
- **Database:**
  - 6 Motor Categories
  - 62 Motor Subcategories
  - 8 Insurance Providers
  - 4 Pricing Records (Third Party)
- **API Status:** All endpoints responding correctly

### ⚠️ Temporary Configuration

- **DEBUG Mode:** `True` (bypasses HTTPS security for testing)
- **HTTP Only:** No SSL certificate yet (HTTPS not configured)

### 📋 Pending Tasks

- [ ] DNS configuration (api.patabima.co.ke → 44.200.182.180)
- [ ] SSL certificate installation (Let's Encrypt)
- [ ] Set DEBUG=False for production
- [ ] Static files collection for admin panel

---

## Frontend Configuration

### Quick Switch: Use the Automated Script ⚡ (Recommended)

**Run from project root directory:**

```powershell
# Switch to EC2 staging backend (HTTP)
.\deployment\switch_backend.ps1 -Environment staging

# Switch to local development backend
.\deployment\switch_backend.ps1 -Environment local

# Switch to production backend (HTTPS - after SSL setup)
.\deployment\switch_backend.ps1 -Environment production
```

**What the script does:**

- ✅ Automatically updates `frontend/services/DjangoAPIService.js`
- ✅ Shows current and new backend URL
- ✅ Displays next steps for testing
- ✅ Safe - validates file exists before changes

**Example output:**

```
🔄 Switching Backend Environment...
   Target: staging
   URL: http://44.200.182.180
   Description: EC2 staging server (HTTP)

📍 Current Backend: http://10.0.2.2:8000
✅ Backend switched successfully!

📝 Updated Configuration:
   const API_CONFIG = {
     BASE_URL: 'http://44.200.182.180',
     TIMEOUT: 30000,

💡 Next Steps:
   1. Verify EC2 is running:
      curl http://44.200.182.180/api/v1/motor2/categories/

   2. Start React Native:
      cd frontend
      npm start
```

---

### Manual Method: Update API Base URL

#### Option A: DjangoAPIService.js (Recommended)

**File:** `frontend/services/DjangoAPIService.js`

```javascript
// Find the API_CONFIG constant (around line 10-20)
const API_CONFIG = {
  // PRODUCTION: Use EC2 public IP (temporary until DNS configured)
  BASE_URL: "http://44.200.182.180",

  // STAGING/LOCAL: Use localhost or emulator
  // BASE_URL: 'http://10.0.2.2:8000', // Android emulator
  // BASE_URL: 'http://localhost:8000', // iOS simulator or web

  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};
```

**After DNS/SSL Setup (Future):**

```javascript
const API_CONFIG = {
  BASE_URL: "https://api.patabima.co.ke", // Production with SSL
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};
```

#### Option B: Environment Variables (.env)

**File:** `frontend/.env` or `frontend/.env.production`

```bash
# Production Backend
EXPO_PUBLIC_API_URL=http://44.200.182.180

# Staging/Local Backend
# EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
# EXPO_PUBLIC_API_URL=http://localhost:8000
```

**Usage in code:**

```javascript
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://44.200.182.180";
```

---

### Step 2: Test API Connection

**From React Native app:**

```javascript
// Test endpoint in a component or service
import { DjangoAPIService } from "../services/DjangoAPIService";

async function testBackendConnection() {
  try {
    const response = await DjangoAPIService.makeRequest(
      "/api/v1/motor2/categories/"
    );
    console.log("✅ Backend connected:", response.total_count, "categories");
    return response;
  } catch (error) {
    console.error("❌ Backend connection failed:", error.message);
    throw error;
  }
}
```

**Expected Response:**

```json
{
  "categories": [
    {
      "id": "62035197-a440-415a-8087-009b5ef5d760",
      "code": "PRIVATE",
      "name": "Private",
      "description": "Personal vehicles for private use",
      "icon": "🚗",
      "sort_order": 1,
      "is_active": true
    }
    // ... 5 more categories
  ],
  "total_count": 6
}
```

---

### Step 3: Update Motor Insurance Service

**File:** `frontend/services/MotorInsurancePricingService.js`

Ensure the service uses the centralized DjangoAPIService:

```javascript
import { DjangoAPIService } from "./DjangoAPIService";

class MotorInsurancePricingService {
  async getCategories() {
    try {
      const response = await DjangoAPIService.makeRequest(
        "/api/v1/motor2/categories/"
      );
      return response.categories || [];
    } catch (error) {
      console.error("[MotorPricing] Failed to fetch categories:", error);
      throw error;
    }
  }

  async getSubcategoriesByCategory(categoryCode) {
    try {
      const response = await DjangoAPIService.makeRequest(
        `/api/v1/motor2/subcategories/?category=${categoryCode}`
      );
      return response.subcategories || [];
    } catch (error) {
      console.error("[MotorPricing] Failed to fetch subcategories:", error);
      throw error;
    }
  }

  async compareUnderwritersBySubcategory(subcategoryCode, formData) {
    try {
      const payload = {
        subcategory_code: subcategoryCode,
        cover_start_date: formData.cover_start_date,
        sum_insured: formData.sum_insured || null,
        tonnage: formData.tonnage || null,
        capacity: formData.passengerCapacity || null,
      };

      const response = await DjangoAPIService.makeRequest(
        "/api/v1/motor2/pricing/compare-by-subcategory/",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      return response.comparisons || [];
    } catch (error) {
      console.error("[MotorPricing] Failed to compare underwriters:", error);
      throw error;
    }
  }
}

export default new MotorInsurancePricingService();
```

---

## API Endpoints Reference

### Base URL

- **Production:** `http://44.200.182.180` (temporary, will change to HTTPS)
- **Future:** `https://api.patabima.co.ke` (after SSL setup)

### Motor Insurance Endpoints

| Endpoint                                                             | Method | Description                       | Response                                                    |
| -------------------------------------------------------------------- | ------ | --------------------------------- | ----------------------------------------------------------- |
| `/api/v1/motor2/categories/`                                         | GET    | List all motor categories         | `{ categories: [...], total_count: 6 }`                     |
| `/api/v1/motor2/subcategories/?category=PRIVATE`                     | GET    | List subcategories for a category | `{ category: {...}, subcategories: [...], total_count: 8 }` |
| `/api/v1/motor2/field-requirements/?subcategory=PRIVATE_THIRD_PARTY` | GET    | Get required fields for a product | `{ fields: [...] }`                                         |
| `/api/v1/motor2/pricing/compare-by-subcategory/`                     | POST   | Compare underwriter pricing       | `{ comparisons: [...] }`                                    |
| `/api/v1/motor2/metadata/version/`                                   | GET    | API version info                  | `{ version: "2.0", ... }`                                   |

### Example API Calls

**1. Get Categories:**

```bash
curl -X GET "http://44.200.182.180/api/v1/motor2/categories/"
```

**2. Get Private Subcategories:**

```bash
curl -X GET "http://44.200.182.180/api/v1/motor2/subcategories/?category=PRIVATE"
```

**3. Compare Third Party Pricing:**

```bash
curl -X POST "http://44.200.182.180/api/v1/motor2/pricing/compare-by-subcategory/" \
  -H "Content-Type: application/json" \
  -d '{
    "subcategory_code": "PRIVATE_THIRD_PARTY",
    "cover_start_date": "2025-11-15"
  }'
```

**Response:**

```json
{
  "comparisons": [
    {
      "underwriter_code": "MADISON",
      "underwriter_name": "Madison Insurance",
      "result": {
        "base_premium": 2975.0,
        "pricing_model": "FIXED"
      }
    }
    // ... more underwriters
  ]
}
```

---

## Accessing EC2 Instance

### Method 1: EC2 Instance Connect (Browser-based SSH)

**Steps:**

1. **Open AWS Console:**

   - Navigate to: https://console.aws.amazon.com/ec2/
   - Region: **us-east-1** (N. Virginia)

2. **Find Instance:**

   - Search for instance ID: `i-0d0f116005d812275`
   - Or search by public IP: `44.200.182.180`

3. **Connect via Browser:**

   - Select the instance
   - Click **"Connect"** button (top right)
   - Choose **"EC2 Instance Connect"** tab
   - Username: `ec2-user`
   - Click **"Connect"**

4. **You're In!**
   - Browser terminal opens
   - Navigate to: `cd /var/www/patabima`

### Method 2: SSH from Local Machine (Requires Private Key)

**Requirements:**

- SSH key pair: `aws-eb.pem`
- Location: Should be in `C:\Users\USER\.ssh\aws-eb` (currently not available locally)

**If you have the key:**

```powershell
# Windows PowerShell
ssh -i C:\Users\USER\.ssh\aws-eb ec2-user@44.200.182.180
```

```bash
# Linux/Mac Terminal
chmod 400 ~/.ssh/aws-eb
ssh -i ~/.ssh/aws-eb ec2-user@44.200.182.180
```

**If you don't have the key:**

- Download from AWS Systems Manager Parameter Store (if stored there)
- Or request from team member who created the instance
- Or use EC2 Instance Connect (Method 1)

### Method 3: AWS Systems Manager Session Manager

**Requirements:**

- SSM Agent must be installed on EC2 (currently not registered)
- IAM permissions for SSM

**Command:**

```powershell
aws ssm start-session --target i-0d0f116005d812275 --region us-east-1
```

---

## Backend Management Commands

### Once Connected to EC2:

#### 1. Navigate to Project Directory

```bash
cd /var/www/patabima
source venv/bin/activate
export $(grep -v '^#' .env | xargs)
```

#### 2. Check Service Status

```bash
# Check Gunicorn (Django app server)
sudo systemctl status patabima

# Check Nginx (web server)
sudo systemctl status nginx

# View Gunicorn logs
sudo journalctl -u patabima -f --no-pager

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### 3. Restart Services

```bash
# Restart Django app (after code changes)
sudo systemctl restart patabima

# Restart Nginx (after config changes)
sudo systemctl restart nginx

# Check if services are running
sudo systemctl status patabima nginx
```

#### 4. Django Management Commands

```bash
# Activate virtual environment first
cd /var/www/patabima
source venv/bin/activate
export $(grep -v '^#' .env | xargs)

# Run migrations
python manage.py migrate

# Create superuser (for admin panel)
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput

# Seed motor data
python manage.py seed_comprehensive_motor

# Access Django shell
python manage.py shell

# Check pending migrations
python manage.py showmigrations
```

#### 5. Database Operations

```bash
# Test database connection
python manage.py dbshell

# OR use Django shell
python manage.py shell
>>> from app.models import MotorCategory
>>> MotorCategory.objects.count()
6
```

#### 6. View Application Logs

```bash
# Real-time Gunicorn logs
sudo journalctl -u patabima -f

# Last 100 lines
sudo journalctl -u patabima -n 100

# Filter by today
sudo journalctl -u patabima --since today

# Application error log (if configured)
tail -f /var/www/patabima/logs/error.log
```

#### 7. Test API Endpoints from EC2

```bash
# Test categories endpoint
curl -sS "http://localhost/api/v1/motor2/categories/" | python -m json.tool | head -n 30

# Test subcategories
curl -sS "http://localhost/api/v1/motor2/subcategories/?category=PRIVATE" | python -m json.tool

# Test health check
curl -sS "http://localhost/api/v1/health/"
```

---

## Switching Between Local and Production Backend

### Scenario 1: Development on Local Django + React Native App

**Backend (Django):**

```bash
# In insurance-app directory
cd C:\Users\USER\Desktop\PATABIMA01\insurance-app
python manage.py runserver 0.0.0.0:8000
```

**Frontend (React Native):**

```javascript
// frontend/services/DjangoAPIService.js
const API_CONFIG = {
  BASE_URL: "http://10.0.2.2:8000", // Android emulator
  // BASE_URL: 'http://localhost:8000', // iOS simulator
};
```

---

### Scenario 2: Testing with Production Backend

**Frontend (React Native):**

```javascript
// frontend/services/DjangoAPIService.js
const API_CONFIG = {
  BASE_URL: "http://44.200.182.180", // EC2 production
};
```

**No backend changes needed** - EC2 is always running!

---

### Scenario 3: Environment-based Switching (Recommended)

**File:** `frontend/services/DjangoAPIService.js`

```javascript
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Development mode: Use local backend
    return Platform.select({
      android: "http://10.0.2.2:8000",
      ios: "http://localhost:8000",
      default: "http://localhost:8000",
    });
  } else {
    // Production mode: Use EC2 backend
    return "http://44.200.182.180";
  }
};

const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};
```

**Or use environment variables:**

**File:** `frontend/.env.development`

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
```

**File:** `frontend/.env.production`

```bash
EXPO_PUBLIC_API_URL=http://44.200.182.180
```

**Usage:**

```javascript
const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || "http://44.200.182.180",
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};
```

---

### Scenario 4: Quick Toggle for Testing

**Create a config file:**

**File:** `frontend/config/api.config.js`

```javascript
export const API_ENDPOINTS = {
  local: "http://10.0.2.2:8000",
  staging: "http://44.200.182.180",
  production: "https://api.patabima.co.ke", // Future
};

// Change this to switch backends
export const CURRENT_BACKEND = "staging"; // 'local', 'staging', or 'production'

export const API_BASE_URL = API_ENDPOINTS[CURRENT_BACKEND];
```

**Usage:**

```javascript
import { API_BASE_URL } from "../config/api.config";

const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};
```

---

## Troubleshooting

### Issue 1: "Network request failed" in React Native

**Causes:**

- Wrong IP address or port
- EC2 instance stopped
- Security group blocking port 80
- Backend service down

**Solutions:**

```bash
# 1. Verify EC2 is running
aws ec2 describe-instances --instance-ids i-0d0f116005d812275 --query 'Reservations[0].Instances[0].State.Name'

# 2. Check if Gunicorn is running
ssh ec2-user@44.200.182.180
sudo systemctl status patabima

# 3. Test from browser
# Open: http://44.200.182.180/api/v1/motor2/categories/

# 4. Check security group
# Ensure port 80 is open to 0.0.0.0/0
```

---

### Issue 2: "CORS policy" error

**Cause:** Django CORS settings blocking frontend requests

**Solution on EC2:**

```bash
cd /var/www/patabima
nano insurance/settings.py
```

**Add to settings.py:**

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:19006",  # Expo web
    "exp://192.168.1.x:19000", # Expo mobile (replace with your IP)
]

# Or allow all origins (development only!)
CORS_ALLOW_ALL_ORIGINS = True
```

**Restart service:**

```bash
sudo systemctl restart patabima
```

---

### Issue 3: 502 Bad Gateway

**Cause:** Gunicorn crashed or not responding

**Check Gunicorn:**

```bash
sudo systemctl status patabima
sudo journalctl -u patabima -n 50
```

**Restart Gunicorn:**

```bash
sudo systemctl restart patabima
```

**Check Gunicorn socket:**

```bash
ls -la /var/www/patabima/gunicorn.sock
# Should exist and be owned by ec2-user
```

---

### Issue 4: Empty response or 404 errors

**Cause:** Wrong API endpoint path

**Verify endpoint exists:**

```bash
# On EC2
curl -sS "http://localhost/api/v1/motor2/categories/" | python -m json.tool
```

**Check Django URL patterns:**

```bash
cd /var/www/patabima
python manage.py show_urls | grep motor
```

---

### Issue 5: Database connection errors

**Check RDS connectivity:**

```bash
# On EC2
cd /var/www/patabima
source venv/bin/activate
export $(grep -v '^#' .env | xargs)

python manage.py dbshell
# Should connect to PostgreSQL

# OR check in Django shell
python manage.py shell
>>> from django.db import connection
>>> connection.ensure_connection()
>>> print("✅ Database connected")
```

**Check RDS security group:**

- RDS security group must allow inbound traffic from EC2 security group
- Port 5432 (PostgreSQL)

---

## Next Steps: SSL Setup

### Prerequisites

1. **DNS Configuration:**

   - Create A record: `api.patabima.co.ke` → `44.200.182.180`
   - Wait 5-15 minutes for DNS propagation
   - Verify: `nslookup api.patabima.co.ke`

2. **Install Certbot on EC2:**

```bash
# Connect to EC2
ssh ec2-user@44.200.182.180

# Install Certbot
sudo dnf install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.patabima.co.ke

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect HTTP to HTTPS

# Test auto-renewal
sudo certbot renew --dry-run
```

3. **Update Backend Settings:**

```bash
cd /var/www/patabima
sudo nano .env
```

**Change:**

```bash
DEBUG=False
ALLOWED_HOSTS=api.patabima.co.ke,44.200.182.180,localhost
ENABLE_SSL_REDIRECT=1
```

**Restart services:**

```bash
sudo systemctl restart patabima nginx
```

4. **Update Frontend:**

```javascript
// frontend/services/DjangoAPIService.js
const API_CONFIG = {
  BASE_URL: "https://api.patabima.co.ke", // HTTPS now!
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};
```

5. **Test HTTPS:**

```bash
curl -I https://api.patabima.co.ke/api/v1/motor2/categories/
# Should return 200 OK with HTTPS
```

---

## Quick Reference Commands

### Frontend (React Native)

```bash
# Start Expo development server
cd frontend
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Clear cache and restart
npm start -- --clear
```

### Backend (Local Django)

```powershell
# Start local Django server
cd insurance-app
python manage.py runserver 0.0.0.0:8000

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### Backend (EC2 Production)

```bash
# Connect to EC2
ssh ec2-user@44.200.182.180
# OR use AWS Console → EC2 Instance Connect

# Navigate to project
cd /var/www/patabima

# Restart services
sudo systemctl restart patabima nginx

# View logs
sudo journalctl -u patabima -f
```

### Sync Code to EC2

```powershell
# Option 1: Git (recommended)
git push origin main

# On EC2:
cd /var/www/patabima
git pull origin main
sudo systemctl restart patabima

# Option 2: S3 sync
.\deployment\sync_code_to_ec2.ps1
# Then paste commands in EC2 session
```

---

## Contact & Support

- **AWS Account:** KAHOI-KREATIONS (804686432477)
- **Region:** us-east-1 (N. Virginia)
- **EC2 Instance ID:** i-0d0f116005d812275
- **Public IP:** 44.200.182.180
- **RDS Endpoint:** patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com

---

**Document Version:** 1.0  
**Created:** November 15, 2025  
**Status:** Backend deployed and functional, SSL pending

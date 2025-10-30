# ✅ LOCAL TESTING DEPLOYMENT COMPLETE

**Date**: October 21, 2025
**Status**: READY FOR DEVICE TESTING

---

## 🚀 What's Running

### Backend (Django API)

- **URL**: `http://192.168.0.100:8000`
- **Status**: ✅ Running
- **Health Check**: http://127.0.0.1:8000/api/v1/health/
- **Response**: `{"status": "ok", "service": "pata-bima-api"}`
- **Database**: SQLite (local)
- **Process**: Running in separate PowerShell window

### Frontend (Expo React Native)

- **URL**: Expo Dev Server running
- **API Target**: `http://192.168.0.100:8000`
- **Config File**: `frontend/.env`
- **Process**: Running in separate PowerShell window

---

## 📱 Test on Mobile Device

### Step 1: Open Expo Go App

- Download **Expo Go** from:
  - iOS: App Store
  - Android: Google Play Store

### Step 2: Connect to Same WiFi

- Ensure your phone is on the SAME WiFi network as your computer
- Network: Your local WiFi (192.168.0.x)

### Step 3: Scan QR Code

- Look at the Expo PowerShell window
- Scan the QR code with:
  - **iOS**: Camera app
  - **Android**: Expo Go app scanner

### Step 4: Test Complete Motor 2 Flow

#### Test Credentials

- **Phone**: `079286554`
- **Password**: `test1234`

#### Test Steps

1. ✅ **Login with OTP**

   - Enter phone: 079286554
   - Enter password: test1234
   - Receive OTP code
   - Complete authentication

2. ✅ **Browse Motor Categories**

   - See 6 categories (Private, Commercial, PSV, Motorcycle, TukTuk, Special)
   - Select "Private"

3. ✅ **Select Subcategory**

   - See 4 subcategories
   - Select "Third Party"

4. ✅ **Enter Vehicle Details**

   - Registration: Any (e.g., KCA 123A)
   - Make: Any
   - Model: Any
   - Year: 2020

5. ✅ **Compare Pricing**

   - View 7 underwriter quotes
   - See premium breakdown (base + levies)
   - Select cheapest quote

6. ✅ **Create Policy**

   - Fill client details
   - Submit policy
   - See policy number (POL-2025-XXXXXX)

7. ✅ **View Policies**
   - Navigate to policies list
   - See created policies
   - Check policy details

---

## 🔍 Troubleshooting

### Issue: App can't connect to backend

**Solution**:

```powershell
# Check if backend is running
Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/v1/health/"

# If not running, restart Django:
cd insurance-app
python manage.py runserver 0.0.0.0:8000
```

### Issue: Expo won't start

**Solution**:

```powershell
# Restart Expo
cd frontend
npm start
```

### Issue: Phone can't reach backend

**Cause**: Different WiFi network or firewall blocking
**Solution**:

1. Verify phone and computer on SAME WiFi
2. Check Windows Firewall allows port 8000
3. Try using laptop's IP directly in app

---

## 📊 Backend Integration Test Results

From our previous testing session:

- **Total Tests**: 12
- **Passed**: 8 ✓
- **Failed**: 0 ✗
- **Warnings**: 2 ⚠ (document fixtures)

**Verified Endpoints**:

- ✅ `/api/v1/health/` - Health check
- ✅ `/api/v1/public_app/auth/login` - Request OTP
- ✅ `/api/v1/public_app/auth/auth_login` - Authenticate with OTP
- ✅ `/api/v1/motor/categories/` - Get motor categories (6 found)
- ✅ `/api/v1/motor/subcategories/?category=PRIVATE` - Get subcategories (4 found)
- ✅ `/api/v1/public_app/insurance/compare_motor_pricing` - Compare pricing (7 quotes)
- ✅ `/api/v1/policies/motor/create/` - Create policy (POL-2025-XXXXXX)
- ✅ `/api/v1/policies/motor/` - List policies (working)

---

## 🎯 Next Steps for AWS Deployment

### Current Blocker

Your AWS IAM user `arn:aws:iam::313530061018:user/KahoiKreations` lacks EC2 permissions:

- Cannot create EC2 instances
- Cannot create key pairs
- Cannot list instances
- Cannot use Lightsail

### Solution Options

#### Option 1: Request EC2 Permissions (Recommended)

Contact your AWS account administrator and request:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:RunInstances",
        "ec2:DescribeInstances",
        "ec2:CreateKeyPair",
        "ec2:DescribeKeyPairs",
        "ec2:CreateSecurityGroup",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:CreateTags"
      ],
      "Resource": "*"
    }
  ]
}
```

#### Option 2: Use AWS Console Manually

1. Go to AWS Console → EC2
2. Launch Ubuntu 22.04 instance (t3.micro)
3. Download key pair (.pem file)
4. Run our deployment script:
   ```powershell
   cd scripts
   .\one_time_deploy.ps1 `
     -Host ubuntu@YOUR-EC2-DNS `
     -KeyPath C:\path\to\key.pem `
     -EnvFilePath ..\insurance-app\.env `
     -BuildStatic `
     -Testing
   ```

#### Option 3: Continue Local Testing

- Keep using local setup for development
- Test all features on mobile device via local network
- Deploy to AWS when permissions are available

---

## 🎉 SUCCESS!

✅ Backend is live at `http://192.168.0.100:8000`
✅ Expo dev server is running
✅ Mobile app configured to connect to local backend
✅ Ready for device testing

**Open Expo Go on your phone and scan the QR code to start testing!**

---

_Generated: October 21, 2025_
_Local IP: 192.168.0.100_
_Backend Port: 8000_

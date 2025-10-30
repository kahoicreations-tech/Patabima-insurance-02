# PataBima Project - Quick Start Guide

**Date:** October 19, 2025  
**Project:** PataBima Insurance Agency App

---

## 🚀 How to Start Your Projects

### **1. Start Django Backend (Port 8000)**

```powershell
# Navigate to backend directory
cd "c:\Users\USER\Desktop\PATABIMA\PATABIMA FRONT\PATA BIMA AGENCY - Copy\insurance-app"

# Start Django server
python manage.py runserver 0.0.0.0:8000
```

**Expected Output:**

```
✅ Django server running at http://0.0.0.0:8000/
✅ Admin: http://localhost:8000/admin/
✅ API: http://localhost:8000/api/v1/public_app/
```

---

### **2. Start React Native Frontend (Expo)**

```powershell
# Navigate to frontend directory
cd "c:\Users\USER\Desktop\PATABIMA\PATABIMA FRONT\PATA BIMA AGENCY - Copy\frontend"

# Start Expo development server
npx expo start
```

**Or use shortcuts:**

```powershell
# Start with Android emulator
npx expo start --android

# Start with tunnel (for physical device)
npx expo start --tunnel

# Clear cache and restart
npx expo start --clear
```

**Expected Output:**

```
✅ Metro bundler starting
✅ Expo DevTools at http://localhost:19002/
✅ QR code for mobile app scanning
```

---

## 📱 Connect to Emulator

Your Android emulator is already running:

```powershell
# Check devices
adb devices

# Expected output:
# emulator-5554   device
```

**To launch app on emulator:**

- Press `a` in Expo terminal to open on Android
- Or scan QR code with Expo Go app on physical device

---

## 🗄️ MCP Server (PostgreSQL) Configuration

Your MCP server is already configured in VS Code workspace settings.

**Configuration Location:**

```
C:\Users\USER\AppData\Roaming\Code\Workspaces\1758538514020\workspace.json
```

**Current Setup:**

```json
{
  "patabima-postgres": {
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-postgres@0.6.2",
      "postgresql://localhost:5432/patabima_insurance?user=patabima_user"
    ],
    "type": "stdio"
  }
}
```

**Status:** ✅ Already installed and configured

---

## 🛠️ Common Commands

### **Frontend (React Native Expo)**

```powershell
# Install dependencies
cd frontend
npm install

# Start development server
npx expo start

# Start with specific platform
npx expo start --android
npx expo start --ios
npx expo start --web

# Clear cache
npx expo start --clear

# Update Expo
npx expo upgrade
```

### **Backend (Django)**

```powershell
# Navigate to backend
cd insurance-app

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start server
python manage.py runserver 0.0.0.0:8000

# Check database
python manage.py shell
```

### **Database (PostgreSQL)**

```powershell
# Check connection
cd insurance-app
python check_mcp_status.py

# View schema
python show_database_schema.py

# Generate schema report
python generate_schema_report.py
```

---

## 📊 Project Status

### **Backend (Django) - ✅ RUNNING**

- Server: http://0.0.0.0:8000/
- Database: patabima_insurance (PostgreSQL 17.6)
- Tables: 40 tables, 1,005 records
- API Endpoints: All operational
- Admin Interface: http://localhost:8000/admin/

### **Frontend (React Native) - ✅ STARTING**

- Framework: Expo SDK 53
- Platform: Android emulator (emulator-5554)
- Metro Bundler: Starting...

### **Database (PostgreSQL) - ✅ CONNECTED**

- Database: patabima_insurance
- User: patabima_user
- Host: localhost:5432
- MCP Server: Configured ✅

---

## 🔧 Troubleshooting

### **"npm run start" Error**

❌ **Wrong:** Running `npm run start` in root directory  
✅ **Correct:** Run `npx expo start` in `frontend` directory

```powershell
# Correct way
cd "c:\Users\USER\Desktop\PATABIMA\PATABIMA FRONT\PATA BIMA AGENCY - Copy\frontend"
npx expo start
```

### **MCP Server Not Found**

The LocalPilot MCP server repository doesn't exist. You're using the **official PostgreSQL MCP server** which is already installed:

```powershell
# Already configured in VS Code
npx @modelcontextprotocol/server-postgres
```

### **Port Already in Use**

```powershell
# Check what's using the port
netstat -ano | findstr :8000

# Kill process if needed
taskkill /PID <process_id> /F
```

### **Expo Cache Issues**

```powershell
cd frontend
npx expo start --clear
```

---

## 📝 Important File Locations

### **Configuration Files**

- **Workspace MCP Config:** `C:\Users\USER\AppData\Roaming\Code\Workspaces\1758538514020\workspace.json`
- **Django Settings:** `insurance-app/insurance/settings.py`
- **Frontend App:** `frontend/App.js`
- **Environment:** `.env`, `.env.production`

### **Documentation**

- **Backend Status:** `docs/NON_MOTOR_BACKEND_ACTIVATION_COMPLETE.md`
- **Integration Guide:** `docs/NON_MOTOR_BACKEND_INTEGRATION_STATUS.md`
- **Quick Reference:** `docs/NON_MOTOR_QUICK_REFERENCE.md`
- **Database Schema:** `insurance-app/database_schema.json`

---

## 🎯 Quick Start (All Services)

**Option 1: Manual Start (Recommended)**

```powershell
# Terminal 1: Start Django Backend
cd "c:\Users\USER\Desktop\PATABIMA\PATABIMA FRONT\PATA BIMA AGENCY - Copy\insurance-app"
python manage.py runserver 0.0.0.0:8000

# Terminal 2: Start Expo Frontend
cd "c:\Users\USER\Desktop\PATABIMA\PATABIMA FRONT\PATA BIMA AGENCY - Copy\frontend"
npx expo start --android
```

**Option 2: Using Tasks** (if configured in VS Code)

- Press `Ctrl+Shift+P`
- Type "Tasks: Run Task"
- Select "Start Expo Dev Server"

---

## ✅ System Health Check

Run this to verify everything is working:

```powershell
# 1. Check Django server
curl http://localhost:8000/admin/

# 2. Check database
cd insurance-app
python check_mcp_status.py

# 3. Check Android emulator
adb devices

# 4. Start frontend
cd ../frontend
npx expo start
```

**Expected Results:**

- ✅ Django returns HTML page
- ✅ Database shows 22 manual quotes, 10 policies
- ✅ Emulator shows "emulator-5554 device"
- ✅ Expo starts Metro bundler

---

## 🚀 Ready to Develop!

Your PataBima system is now fully operational:

- ✅ **Backend:** Django REST API running
- ✅ **Frontend:** Expo development server starting
- ✅ **Database:** PostgreSQL connected with MCP
- ✅ **Emulator:** Android device ready

**Start coding!** 🎉

---

**Last Updated:** October 19, 2025  
**System Status:** ✅ OPERATIONAL

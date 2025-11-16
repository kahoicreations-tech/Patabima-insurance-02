# Backend Switching Directory

Centralized location for all backend switching scripts and documentation.

## 📁 Directory Contents

```
backend-switching/
├── README.md                    # ← Complete switching guide (START HERE)
├── switch-backend.ps1           # ← Universal backend switcher (RECOMMENDED)
├── switch-to-ec2.ps1            # Legacy: Switch to EC2
├── switch-to-local.ps1          # Legacy: Switch to local
├── .env.ec2.template            # EC2 environment template
├── .env.local.template          # Local environment template
└── LEGACY_GUIDE.md              # Original documentation
```

## 🚀 Quick Start

### Switch to EC2 Backend

```powershell
# From anywhere in the project:
.\deployment\backend-switching\switch-backend.ps1 -Environment ec2

# Verify:
curl http://44.200.182.180/api/v1/motor2/categories/
```

### Switch to Local Backend

```powershell
# Start Django first:
cd insurance-app
python manage.py runserver 0.0.0.0:8000

# Then switch frontend:
.\deployment\backend-switching\switch-backend.ps1 -Environment local
```

## 📋 Available Environments

| Environment | Command                   | URL                        | Status         |
| ----------- | ------------------------- | -------------------------- | -------------- |
| Local       | `-Environment local`      | http://10.0.2.2:8000       | ✅ Ready       |
| EC2         | `-Environment ec2`        | http://44.200.182.180      | ✅ Ready       |
| Staging     | `-Environment staging`    | http://44.200.182.180      | ✅ Ready       |
| Production  | `-Environment production` | https://api.patabima.co.ke | ⏳ Pending SSL |

## 🔧 How It Works

1. Script updates `frontend/.env.local` with selected backend URL
2. Expo reads `EXPO_PUBLIC_API_BASE_URL` from `.env.local`
3. `DjangoAPIService.js` uses the environment variable
4. All API calls route to the selected backend

## 📚 Related Documentation

- **Complete Guide**: [README.md](./README.md)
- **EC2 Setup**: [../ec2_admin_setup_instructions.md](../ec2_admin_setup_instructions.md)
- **EC2 Integration**: [../../docs/EC2_FRONTEND_INTEGRATION_GUIDE.md](../../docs/EC2_FRONTEND_INTEGRATION_GUIDE.md)
- **Legacy Guide**: [LEGACY_GUIDE.md](./LEGACY_GUIDE.md)

## 🎯 Current Status

**Active Backend:** EC2 (http://44.200.182.180)

Check current backend:

```powershell
cat frontend\.env.local
```

## 💡 Tips

### Create PowerShell Alias

Add to your PowerShell profile (`$PROFILE`):

```powershell
# PataBima backend switcher alias
function Switch-PatabimaBackend {
    param([string]$Env = "ec2")
    & "C:\Users\USER\Desktop\PATABIMA01\deployment\backend-switching\switch-backend.ps1" -Environment $Env
}
Set-Alias -Name pbswitch -Value Switch-PatabimaBackend

# Usage:
# pbswitch local
# pbswitch ec2
```

### Quick Test

```powershell
# Test all backends
foreach ($env in @("local", "ec2")) {
    Write-Host "`nTesting $env backend..." -ForegroundColor Cyan
    .\deployment\backend-switching\switch-backend.ps1 -Environment $env
}
```

---

**Last Updated:** November 16, 2025  
**Maintained By:** PataBima Development Team

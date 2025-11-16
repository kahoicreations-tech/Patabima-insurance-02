# Backend Switching Guide

## Quick Switch Commands

### Method 1: NPM Scripts (Recommended)

```bash
cd frontend

# Switch to LOCAL backend
npm run backend:local

# Switch to EC2 backend
npm run backend:ec2
```

### Method 2: PowerShell Scripts

```powershell
cd frontend

# Switch to LOCAL
.\switch-to-local.ps1

# Switch to EC2
.\switch-to-ec2.ps1
```

### Method 3: Manual Edit

```bash
# Edit frontend/.env
# Change to: EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000  (for local)
# Or to: EXPO_PUBLIC_API_BASE_URL=http://ec2-34-203-241-81.compute-1.amazonaws.com  (for EC2)
```

## Complete Workflow

### Working with LOCAL Backend

1. **Start Django locally**:

   ```bash
   cd insurance-app
   python manage.py runserver
   # Server runs at http://127.0.0.1:8000
   ```

2. **Switch frontend to local**:

   ```bash
   cd frontend
   npm run backend:local
   ```

3. **Reload Expo app**:

   - Press `r` in Metro terminal

4. **Verify connection**:
   ```bash
   curl http://127.0.0.1:8000/api/v1/motor2/categories/
   ```

### Working with EC2 Backend

1. **Switch frontend to EC2**:

   ```bash
   cd frontend
   npm run backend:ec2
   ```

2. **Reload Expo app**:

   - Press `r` in Metro terminal

3. **Verify connection**:
   ```bash
   curl http://ec2-34-203-241-81.compute-1.amazonaws.com/api/v1/motor2/categories/
   ```

## Troubleshooting

### If Local Backend Won't Connect:

- ✅ Check Django is running: `http://127.0.0.1:8000/admin`
- ✅ Check CORS settings in `insurance/settings.py`
- ✅ Try `http://localhost:8000` instead

### If EC2 Backend Won't Connect:

- ✅ Check Gunicorn is running on EC2
- ✅ Check Nginx is running
- ✅ Test endpoint: `curl http://ec2-..../api/v1/motor2/categories/`

### Clear App Cache After Switching:

In your app, you can clear cache programmatically:

```javascript
import DjangoAPIService from "./services/DjangoAPIService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Clear cache
DjangoAPIService.clearCache();
await AsyncStorage.multiRemove(["motor_categories", "api_base_url"]);
```

## Environment Files

- `.env` - Active configuration (don't commit changes)
- `.env.local` - Local backend template
- `.env.ec2` - EC2 backend template
- `.env.example` - Documentation (safe to commit)

## Git Best Practices

Add to `.gitignore`:

```
.env
.env.local
.env.ec2
```

Keep in repo:

```
.env.example
```

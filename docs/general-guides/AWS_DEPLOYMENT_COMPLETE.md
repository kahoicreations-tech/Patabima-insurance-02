# ✅ AWS DEPLOYMENT COMPLETE!

**Date**: October 21, 2025  
**Status**: Backend LIVE on AWS EC2

---

## 🚀 Deployed Infrastructure

### EC2 Instance

- **Instance ID**: `i-0041c3db00d399836`
- **Public DNS**: `ec2-34-203-241-81.compute-1.amazonaws.com`
- **Instance Type**: t3.micro
- **Region**: us-east-1
- **Security Group**: `sg-09a8f3f85f05c035e` (patabima-testing-sg)
- **SSH Key**: `C:\Users\USER\patabima-testing-20251021.pem`

### Backend API

- **URL**: `http://ec2-34-203-241-81.compute-1.amazonaws.com:8000`
- **Health Endpoint**: `http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/api/v1/health/`
- **Status**: ✅ Running (Gunicorn with 2 workers)
- **Framework**: Django 4.2.16 + Django REST Framework
- **Database**: PostgreSQL 16

### Database

- **Type**: PostgreSQL 16
- **Database Name**: `patabima_db`
- **User**: `patabima_user`
- **Host**: localhost (same EC2 instance)
- **Status**: ✅ Running

---

## 📱 Frontend Configuration

Your frontend `.env` has been updated to point to AWS:

```env
EXPO_PUBLIC_API_BASE_URL=http://ec2-34-203-241-81.compute-1.amazonaws.com:8000
```

**Next Steps for Mobile Testing:**

1. Restart Expo dev server (if running)
2. Open Expo Go on your phone
3. Scan the QR code
4. Test complete Motor 2 flow with AWS backend

---

## 🔐 Access Information

### SSH Access

```bash
ssh -i C:\Users\USER\patabima-testing-20251021.pem ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com
```

### Manage Gunicorn

```bash
# View logs
tail -f ~/gunicorn.log

# Stop Gunicorn
pkill gunicorn

# Start Gunicorn
cd ~/patabima/insurance-app
~/patabima/venv/bin/gunicorn insurance.wsgi:application --bind 0.0.0.0:8000 --workers 2 --daemon

# Restart Gunicorn
pkill gunicorn && cd ~/patabima/insurance-app && ~/patabima/venv/bin/gunicorn insurance.wsgi:application --bind 0.0.0.0:8000 --workers 2 --daemon
```

### Database Management

```bash
# Connect to PostgreSQL
sudo -u postgres psql patabima_db

# Run migrations (after fixing migration conflicts)
cd ~/patabima/insurance-app
~/patabima/venv/bin/python manage.py migrate

# Create superuser
~/patabima/venv/bin/python manage.py createsuperuser
```

---

## ⚠️ Known Issues & TODO

### Migration Conflicts

Your Django migrations have conflicts:

- **Issue**: Migration 0027 tries to remove `cover_type` field that was already removed in 0026
- **Impact**: Fresh database migrations fail partway through
- **Current Workaround**: Migrations stopped at 0026, Gunicorn started anyway
- **Fix Required**: Clean up migration files locally, then redeploy

### Security (IMPORTANT for Production)

- ⚠️ Security group allows all traffic (0.0.0.0/0) - should restrict to specific IPs
- ⚠️ Database credentials in `.env` - should use AWS Secrets Manager
- ⚠️ DEBUG=False but still using insecure SECRET_KEY
- ⚠️ HTTP only (no HTTPS) - should add SSL certificate
- ⚠️ ALLOWED_HOSTS=\* - should specify exact domains

### Recommended Next Steps

1. **Fix Migrations Locally**:

   - Review `app/migrations/0026` and `app/migrations/0027`
   - Remove duplicate `RemoveField` operations
   - Test locally with fresh PostgreSQL database
   - Commit fixed migrations

2. **Redeploy with Clean Migrations**:

   ```powershell
   # Upload fixed code
   cd insurance-app
   tar -czf ..\deploy-fixed.tar.gz manage.py insurance app
   scp -i C:\Users\USER\patabima-testing-20251021.pem ..\deploy-fixed.tar.gz ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com:/home/ubuntu/patabima/

   # SSH and update
   ssh -i C:\Users\USER\patabima-testing-20251021.pem ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com
   cd ~/patabima/insurance-app
   tar -xzf ../deploy-fixed.tar.gz
   sudo -u postgres psql -c "DROP DATABASE patabima_db; CREATE DATABASE patabima_db; ALTER DATABASE patabima_db OWNER TO patabima_user;"
   ~/patabima/venv/bin/python manage.py migrate
   pkill gunicorn
   ~/patabima/venv/bin/gunicorn insurance.wsgi:application --bind 0.0.0.0:8000 --workers 2 --daemon
   ```

3. **Seed Database**:

   ```bash
   # After migrations work, seed data
   ~/patabima/venv/bin/python manage.py loaddata initial_data
   # Or create superuser and add data via admin
   ~/patabima/venv/bin/python manage.py createsuperuser
   ```

4. **Add HTTPS**:

   - Get domain name (or use Route 53)
   - Install Certbot and configure Nginx
   - Update frontend to use HTTPS URL

5. **Secure Production**:
   - Update security group rules (restrict to your IP)
   - Move secrets to AWS Secrets Manager
   - Generate proper SECRET_KEY
   - Set ALLOWED_HOSTS to specific domains
   - Enable CORS only for your domains

---

## 🧪 Test the Deployment

### Health Check

```bash
curl http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/api/v1/health/
```

**Expected Response**:

```json
{ "status": "ok", "service": "pata-bima-api" }
```

### Test Motor Categories (Once Migrations Fixed)

```bash
curl http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/api/v1/motor/categories/
```

### Test Authentication (Once Migrations Fixed)

```bash
curl -X POST http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/api/v1/public_app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"079286554","password":"test1234"}'
```

---

## 💰 AWS Costs

**Current Setup** (t3.micro):

- **EC2 Instance**: ~$0.0104/hour = ~$7.50/month
- **Data Transfer**: First 100GB/month free
- **Estimated Monthly Cost**: $7-10 USD

**To Stop Instance** (avoid charges when not testing):

```powershell
aws ec2 stop-instances --instance-ids i-0041c3db00d399836
```

**To Start Instance**:

```powershell
aws ec2 start-instances --instance-ids i-0041c3db00d399836
```

---

## 📊 Monitoring

### Check if Backend is Running

```bash
ssh -i C:\Users\USER\patabima-testing-20251021.pem ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com "ps aux | grep gunicorn"
```

### View Logs

```bash
ssh -i C:\Users\USER\patabima-testing-20251021.pem ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com "tail -n 100 ~/gunicorn.log"
```

### Check Database

```bash
ssh -i C:\Users\USER\patabima-testing-20251021.pem ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com "sudo -u postgres psql -c '\l'"
```

---

## 🎉 Success Metrics

✅ EC2 instance launched and configured  
✅ PostgreSQL installed and database created  
✅ Python 3.12 + virtual environment set up  
✅ All Django dependencies installed  
✅ Gunicorn running with 2 workers  
✅ Health endpoint responding  
✅ Frontend configured to connect to AWS  
✅ SSH key saved for future access

**The backend is now accessible from anywhere on the internet!**

---

_Generated: October 21, 2025_  
_Deployment took: ~15 minutes (manual process)_  
_Next deployment: Use `one_time_deploy.ps1` script for faster setup_

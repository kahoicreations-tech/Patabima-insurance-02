# PataBima Backend Redeployment Guide

## Quick Deployment Steps

### ✅ What Was Done:

1. ✅ Created deployment package: `patabima-backend-20251116-210558.zip` (72 MB)
2. ✅ Uploaded to S3: `s3://patabima-media-prod/deployment/`
3. ✅ Deployment scripts created

---

## Option 1: Deploy via AWS CloudShell (Recommended)

### Step 1: Open AWS CloudShell

1. Go to AWS Console: https://console.aws.amazon.com
2. Click the **CloudShell** icon (terminal icon) in the top navigation bar
3. Wait for CloudShell to initialize

### Step 2: Download Deployment Script

```bash
aws s3 cp s3://patabima-media-prod/deployment/cloudshell-deploy.sh ./ --region us-east-1
chmod +x cloudshell-deploy.sh
```

### Step 3: Run Deployment

```bash
./cloudshell-deploy.sh
```

**That's it!** The script will:

- Download the latest deployment package from S3
- Upload to EC2
- Stop services
- Extract new code
- Install dependencies
- Run migrations
- Restart services
- Test health endpoint

---

## Option 2: Manual CloudShell Deployment

If the script doesn't work, run these commands manually in CloudShell:

```bash
# 1. Download deployment package
aws s3 cp s3://patabima-media-prod/deployment/patabima-backend-20251116-210558.zip ./ --region us-east-1

# 2. Upload to EC2
scp -i ~/.ssh/aws-eb patabima-backend-20251116-210558.zip ec2-user@44.200.182.180:/tmp/

# 3. Connect to EC2
ssh -i ~/.ssh/aws-eb ec2-user@44.200.182.180

# 4. Once connected, run deployment commands:
cd /tmp

# Stop services
sudo systemctl stop patabima
sudo systemctl stop nginx

# Backup current code
sudo mv /var/www/patabima/insurance-app /var/www/patabima/insurance-app.backup.$(date +%Y%m%d_%H%M%S)

# Extract new code
sudo mkdir -p /var/www/patabima/insurance-app
sudo unzip -o patabima-backend-20251116-210558.zip -d /var/www/patabima/insurance-app/

# Set permissions
sudo chown -R ec2-user:ec2-user /var/www/patabima
sudo chmod -R 755 /var/www/patabima

# Install dependencies
cd /var/www/patabima
source venv/bin/activate
pip install -r insurance-app/requirements.txt

# Run migrations
cd insurance-app
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Start services
sudo systemctl start patabima
sudo systemctl start nginx

# Test
curl http://localhost/api/v1/health/
```

---

## Option 3: Wait for SSM Agent (Future)

SSM Agent is not yet registered on the EC2 instance. Once it's ready (usually 10-15 minutes after instance launch), you can use:

```powershell
# From local PowerShell
cd deployment
.\redeploy-via-ssm.ps1 -ZipFile "patabima-backend-20251116-210558.zip"
```

---

## Verification After Deployment

### Test Health Endpoint

```bash
curl http://44.200.182.180/api/v1/health/
```

**Expected Response:**

```json
{ "status": "ok", "service": "pata-bima-api" }
```

### Test Motor Categories

```bash
curl http://44.200.182.180/api/v1/motor2/categories/
```

**Should return:** List of 6 motor insurance categories

### Test from Frontend

Update frontend `.env`:

```env
API_BASE_URL=http://44.200.182.180
```

Then test Motor 2 flow in React Native app.

---

## Troubleshooting

### If SSH key is not found in CloudShell:

```bash
# Upload your local key to CloudShell
aws s3 cp ~/.ssh/aws-eb s3://patabima-media-prod/keys/aws-eb
# Then in CloudShell:
mkdir -p ~/.ssh
aws s3 cp s3://patabima-media-prod/keys/aws-eb ~/.ssh/
chmod 400 ~/.ssh/aws-eb
```

### If services don't start:

```bash
# Check logs
sudo journalctl -u patabima -n 50
sudo tail -f /var/www/patabima/insurance-app/logs/error.log
```

### If health check fails:

```bash
# Check Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Check Gunicorn
sudo systemctl status patabima
```

---

## What Changed in This Deployment

📦 **Package:** `patabima-backend-20251116-210558.zip` (72.12 MB)

### Changes Included:

- ✅ Latest insurance-app code (all recent commits)
- ✅ Updated dependencies (requirements.txt)
- ✅ Database migrations
- ✅ Static files
- ✅ All Motor 2 endpoints
- ✅ OTP service changes (if any)
- ✅ DMVIC integration updates

### Excluded (for performance):

- ❌ `venv/` (14,192 files - will be recreated on EC2)
- ❌ `__pycache__/` (cache files)
- ❌ `.git/` (version control)
- ❌ `staticfiles/` (regenerated with collectstatic)
- ❌ `db.sqlite3` (local database)
- ❌ Backup files

---

## Next Steps After Deployment

1. ✅ Verify API is responding
2. ✅ Test Motor 2 endpoints
3. ✅ Update frontend .env to point to EC2
4. ✅ Test full Motor 2 flow from React Native app
5. 🔒 Configure HTTPS (SSL certificate)
6. 🌐 Set up custom domain (api.patabima.co.ke)

---

**Deployment Created:** November 16, 2025 21:05:58  
**S3 Location:** `s3://patabima-media-prod/deployment/patabima-backend-20251116-210558.zip`  
**EC2 Instance:** `i-0d0f116005d812275` (44.200.182.180)

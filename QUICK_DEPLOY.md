# 🚀 Quick CloudShell Deployment Guide

**Updated:** November 16, 2025  
**Method:** Session Manager (No SSH key needed)

---

## 📋 Prerequisites

✅ Backend ZIP created: `patabima-backend.zip` (290 MB)  
✅ AWS credentials configured in GitHub secrets  
✅ EC2 instance running: i-07a424fd876416ad0

---

## 🎯 Deployment Steps (5 Minutes)

### Step 1: Upload Backend to S3 (2 minutes)

**Option A - AWS Console (Easiest):**

1. Go to: https://s3.console.aws.amazon.com/s3/buckets/patabima-media-prod
2. Click **Upload**
3. Drag `C:\Users\USER\Desktop\PATABIMA01\patabima-backend.zip`
4. Click **Upload** and wait

**Option B - AWS CLI:**

```powershell
# From your local PowerShell
cd C:\Users\USER\Desktop\PATABIMA01
aws s3 cp patabima-backend.zip s3://patabima-media-prod/deployment/patabima-backend.zip
```

---

### Step 2: Open AWS CloudShell

1. **Go to:** https://console.aws.amazon.com/cloudshell/home?region=us-east-1
2. **Wait** for CloudShell to initialize (30 seconds)
3. You should see a terminal prompt

---

### Step 3: Download & Run Deployment Script

**Copy and paste these commands** in CloudShell:

```bash
# Download deployment script
curl -o deploy.sh https://raw.githubusercontent.com/kahoicreations-tech/Patabima-insurance-02/main/scripts/cloudshell-deploy.sh

# Make it executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

**Or manually paste the script:**

```bash
cat > deploy.sh << 'EOFSCRIPT'
#!/bin/bash
set -e

echo "🚀 PataBima Backend Deployment"
echo "=============================="

INSTANCE_ID="i-07a424fd876416ad0"
S3_BUCKET="patabima-media-prod"

# Download from S3
echo "📥 Downloading backend..."
aws s3 cp s3://$S3_BUCKET/deployment/patabima-backend.zip /tmp/patabima-backend.zip

# Upload to staging
echo "📤 Uploading to EC2 staging..."
aws s3 cp /tmp/patabima-backend.zip s3://$S3_BUCKET/deployment/staging/patabima-backend.zip

# Deploy via Session Manager
echo "🚀 Deploying to EC2..."
COMMAND_ID=$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=[
    "aws s3 cp s3://'$S3_BUCKET'/deployment/staging/patabima-backend.zip /tmp/patabima-backend.zip",
    "sudo mkdir -p /var/www/patabima/backups",
    "if [ -d /var/www/patabima/insurance-app ]; then sudo tar -czf /var/www/patabima/backups/backup-$(date +%Y%m%d_%H%M%S).tar.gz -C /var/www/patabima insurance-app; fi",
    "sudo rm -rf /tmp/insurance-app-new",
    "unzip -q /tmp/patabima-backend.zip -d /tmp/insurance-app-new",
    "sudo rm -rf /var/www/patabima/insurance-app",
    "sudo mv /tmp/insurance-app-new /var/www/patabima/insurance-app",
    "sudo chown -R ec2-user:ec2-user /var/www/patabima/insurance-app",
    "cd /var/www/patabima && source venv/bin/activate",
    "pip install -q -r insurance-app/requirements.txt",
    "cd insurance-app && python manage.py migrate --noinput",
    "python manage.py collectstatic --noinput",
    "sudo systemctl restart patabima",
    "sudo systemctl restart nginx",
    "echo \"✅ Deployment Complete!\""
  ]' \
  --output text \
  --query "Command.CommandId")

echo "Command ID: $COMMAND_ID"
echo "⏳ Waiting for deployment..."

aws ssm wait command-executed --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID"

aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" \
  --query "StandardOutputContent" \
  --output text

echo "✅ DEPLOYMENT SUCCESSFUL!"
echo "🌐 Test: curl http://44.210.245.82/api/motor2/categories/"
EOFSCRIPT

chmod +x deploy.sh
./deploy.sh
```

---

### Step 4: Verify Deployment

**Test the API:**

```bash
# In CloudShell
curl http://44.210.245.82/api/motor2/categories/
```

**Expected response:**

```json
{
  "categories": [
    {"code": "PRIVATE", "name": "Private"},
    {"code": "COMMERCIAL", "name": "Commercial"},
    ...
  ]
}
```

---

## 🔧 If Deployment Fails

### Check SSM Agent Status

```bash
# See if instance is registered with SSM
aws ssm describe-instance-information \
  --filters "Key=InstanceIds,Values=i-07a424fd876416ad0"
```

**If empty output:** SSM agent not ready. Wait 5 minutes and try again.

### Check Command Status

```bash
# List recent commands
aws ssm list-commands --instance-id i-07a424fd876416ad0 --max-results 5

# Get error details (replace COMMAND_ID)
aws ssm get-command-invocation \
  --command-id COMMAND_ID \
  --instance-id i-07a424fd876416ad0 \
  --query "StandardErrorContent" \
  --output text
```

### Alternative: Manual Session Manager

```bash
# Connect to EC2 directly
aws ssm start-session --target i-07a424fd876416ad0

# Then run commands manually:
cd /var/www/patabima
aws s3 cp s3://patabima-media-prod/deployment/patabima-backend.zip /tmp/
# ... rest of deployment commands
```

---

## 📊 Post-Deployment Checks

### View Application Logs

```bash
# Connect via Session Manager
aws ssm start-session --target i-07a424fd876416ad0

# View Django logs
sudo tail -f /var/www/patabima/logs/error.log

# View service logs
sudo journalctl -u patabima -n 50 -f
```

### Check Service Status

```bash
# Check if services are running
sudo systemctl status patabima
sudo systemctl status nginx
```

---

## 🎯 Summary

**What this does:**

1. ✅ Downloads backend ZIP from S3
2. ✅ Creates backup of current version
3. ✅ Deploys new version
4. ✅ Installs Python dependencies
5. ✅ Runs database migrations
6. ✅ Collects static files
7. ✅ Restarts services

**Time Required:** ~5 minutes total

- S3 upload: 2-3 minutes
- Deployment: 2-3 minutes

**No SSH key needed** - Uses AWS Session Manager! 🎉

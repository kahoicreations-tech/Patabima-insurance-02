# PataBima CloudShell Deployment - Step by Step

**Date:** November 16, 2025  
**EC2 Instance:** i-07a424fd876416ad0 (44.210.245.82)  
**S3 Bucket:** patabima-media-prod

---

## 📦 Step 1: Upload Backend ZIP to S3

### Option A: Upload via AWS Console (Easiest)

1. **Open S3 Console:**

   - Go to: https://s3.console.aws.amazon.com/s3/buckets/patabima-media-prod
   - Login with KAHOI-KREATIONS account

2. **Upload the ZIP:**

   - Click **"Upload"** button
   - Drag and drop: `C:\Users\USER\Desktop\PATABIMA01\patabima-backend.zip`
   - Click **"Upload"**
   - Wait for upload to complete (290 MB)

3. **Verify Upload:**
   - File should appear at: `s3://patabima-media-prod/patabima-backend.zip`

### Option B: Upload via AWS CLI (Alternative)

```powershell
# From your local machine
cd C:\Users\USER\Desktop\PATABIMA01

aws s3 cp patabima-backend.zip s3://patabima-media-prod/deployment/patabima-backend.zip

# Verify
aws s3 ls s3://patabima-media-prod/deployment/
```

---

## ☁️ Step 2: Open AWS CloudShell

1. **Go to AWS Console:**

   - https://console.aws.amazon.com/cloudshell/home?region=us-east-1

2. **Wait for CloudShell to initialize** (30-60 seconds)

3. **Verify you're in the right account:**

   ```bash
   aws sts get-caller-identity
   ```

   Should show:

   ```json
   {
     "UserId": "...",
     "Account": "804686432477",
     "Arn": "arn:aws:iam::804686432477:user/KAHOI-KREATIONS"
   }
   ```

---

## 🔑 Step 3: Setup SSH Key in CloudShell

```bash
# Create .ssh directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Create the SSH key file
cat > ~/.ssh/aws-eb << 'EOF'
-----BEGIN RSA PRIVATE KEY-----
[PASTE YOUR PRIVATE KEY HERE]
-----END RSA PRIVATE KEY-----
EOF

# Set correct permissions
chmod 400 ~/.ssh/aws-eb

# Verify key exists
ls -la ~/.ssh/aws-eb
```

**Note:** You'll need to paste your actual `aws-eb` private key content. If you don't have it, we'll need to create a new key pair.

---

## 🚀 Step 4: Run Deployment Commands

Copy and paste these commands **one section at a time** in CloudShell:

### 4.1 Download Backend from S3

```bash
# Create deployment directory
mkdir -p ~/patabima-deploy
cd ~/patabima-deploy

# Download backend ZIP
aws s3 cp s3://patabima-media-prod/deployment/patabima-backend.zip .

# Verify download
ls -lh patabima-backend.zip
```

### 4.2 Connect to EC2 Instance

```bash
# Test SSH connection
ssh -i ~/.ssh/aws-eb -o StrictHostKeyChecking=no ec2-user@44.210.245.82 "echo '✅ SSH connection successful!'"
```

If this fails, you may need to:

- Check security group allows SSH from CloudShell IP
- Verify the SSH key is correct
- Use Session Manager instead (see Alternative below)

### 4.3 Upload Backend to EC2

```bash
# Copy ZIP to EC2
scp -i ~/.ssh/aws-eb patabima-backend.zip ec2-user@44.210.245.82:/tmp/

echo "✅ Backend uploaded to EC2"
```

### 4.4 Deploy on EC2

```bash
# SSH into EC2 and run deployment
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82 << 'ENDSSH'

# Navigate to app directory
cd /var/www/patabima

# Backup current version
sudo cp -r insurance-app insurance-app.backup.$(date +%Y%m%d_%H%M%S)

# Extract new version
cd /tmp
unzip -o patabima-backend.zip -d /tmp/insurance-app-new

# Replace old with new
sudo rm -rf /var/www/patabima/insurance-app
sudo mv /tmp/insurance-app-new /var/www/patabima/insurance-app

# Set ownership
sudo chown -R ec2-user:ec2-user /var/www/patabima/insurance-app

# Activate virtual environment
cd /var/www/patabima
source venv/bin/activate

# Install/update dependencies
pip install -r insurance-app/requirements.txt

# Run migrations
cd insurance-app
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput

# Restart services
sudo systemctl restart patabima
sudo systemctl restart nginx

# Check status
sudo systemctl status patabima --no-pager | head -n 10

echo ""
echo "✅ Deployment complete!"
echo "🌐 Application URL: http://44.210.245.82"

ENDSSH
```

---

## ✅ Step 5: Verify Deployment

### 5.1 Test API Endpoints

```bash
# From CloudShell
curl -s http://44.210.245.82/api/motor2/categories/ | jq '.categories[].name'

# Expected output: List of motor categories
# PRIVATE, COMMERCIAL, PSV, etc.
```

### 5.2 Check Application Logs

```bash
# SSH into EC2
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82

# View Django logs
sudo tail -f /var/www/patabima/logs/error.log

# View Gunicorn logs
sudo journalctl -u patabima -n 50 -f

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### 5.3 Check Service Status

```bash
# Check Gunicorn status
sudo systemctl status patabima

# Check Nginx status
sudo systemctl status nginx

# If services failed, restart them
sudo systemctl restart patabima
sudo systemctl restart nginx
```

---

## 🔧 Troubleshooting

### SSH Connection Fails

**Error:** `Permission denied (publickey)`

**Solution 1:** Use AWS Session Manager instead

```bash
# Install Session Manager plugin (if not already installed)
curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/linux_64bit/session-manager-plugin.rpm" -o "session-manager-plugin.rpm"
sudo yum install -y session-manager-plugin.rpm

# Connect via Session Manager
aws ssm start-session --target i-07a424fd876416ad0
```

**Solution 2:** Add CloudShell IP to security group

```bash
# Get CloudShell public IP
CLOUDSHELL_IP=$(curl -s http://checkip.amazonaws.com)
echo "CloudShell IP: $CLOUDSHELL_IP"

# Add SSH access for CloudShell IP
aws ec2 authorize-security-group-ingress \
  --group-id sg-029645a9f7a7907c3 \
  --protocol tcp \
  --port 22 \
  --cidr $CLOUDSHELL_IP/32
```

### Services Fail to Restart

**Error:** Gunicorn or Nginx fails to start

**Check logs:**

```bash
sudo journalctl -u patabima -n 100 --no-pager
sudo tail -n 100 /var/log/nginx/error.log
```

**Common issues:**

- Missing environment variables in `/etc/systemd/system/patabima.service`
- Python dependencies missing
- Database connection errors

**Fix:**

```bash
# Reload systemd
sudo systemctl daemon-reload

# Check environment variables
sudo cat /etc/systemd/system/patabima.service | grep Environment

# Test Django manually
cd /var/www/patabima
source venv/bin/activate
cd insurance-app
python manage.py check
```

### Database Connection Errors

**Error:** `django.db.utils.OperationalError: could not connect to server`

**Check RDS endpoint:**

```bash
# Verify RDS is accessible
nc -zv patabima-production-db.ca5qwoi4lxw.us-east-1.rds.amazonaws.com 5432

# Check environment variables
echo $RDS_HOSTNAME
echo $RDS_PORT
echo $RDS_DB_NAME
```

**Fix:** Ensure RDS security group allows connections from EC2 security group

---

## 📊 Quick Reference

**EC2 Instance:** i-07a424fd876416ad0  
**Public IP:** 44.210.245.82  
**SSH:** `ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82`  
**App Directory:** `/var/www/patabima`  
**Service Name:** `patabima`  
**Logs:** `/var/www/patabima/logs/error.log`

**API Endpoints:**

- Health: http://44.210.245.82/api/health/
- Categories: http://44.210.245.82/api/motor2/categories/
- Admin: http://44.210.245.82/admin/

**Environment Variables Location:**

- Systemd service: `/etc/systemd/system/patabima.service`
- Nginx config: `/etc/nginx/conf.d/patabima.conf`

---

## 🎯 Next Steps After Deployment

1. **Configure Domain Name:**

   - Point `api.patabima.co.ke` to `44.210.245.82`
   - Update `ALLOWED_HOSTS` in Django settings

2. **Setup SSL Certificate:**

   - Install Certbot
   - Get Let's Encrypt certificate
   - Configure Nginx for HTTPS

3. **Enable Monitoring:**

   - Setup CloudWatch agent
   - Configure log streaming
   - Set up alarms

4. **Backup Strategy:**

   - RDS automated backups
   - Database snapshots
   - Application code backups

5. **CI/CD Pipeline:**
   - GitHub Actions for automated deployment
   - Automated testing before deployment
   - Rollback mechanism

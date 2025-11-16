# PataBima Fresh CloudShell Deployment Guide

**Date:** November 14, 2025  
**AWS Account:** KAHOI-KREATIONS (804686432477)  
**Region:** us-east-1

## Prerequisites Verification

Before starting, ensure these resources exist:

- ✅ EC2 Instance ID: `i-07a424fd876416ad0`
- ✅ Public IP: `44.210.245.82`
- ✅ RDS Endpoint: `patabima-production-db.ca5qwoi4lxw.us-east-1.rds.amazonaws.com`
- ✅ S3 Bucket: `patabima-media-prod`
- ✅ SSH Key: `aws-eb`
- ✅ Security Group: `sg-029645a9f7a7907c3` (Ports 22, 80, 443 open)

---

## Step 1: Open AWS CloudShell

1. Log into AWS Console: https://console.aws.amazon.com/
2. Click the **CloudShell icon** (terminal icon) in the top navigation bar
3. Wait for CloudShell to initialize (~30 seconds)

---

## Step 2: Verify AWS Credentials

Run this command to verify you're using the correct account:

```bash
aws sts get-caller-identity
```

**Expected Output:**

```json
{
  "UserId": "...",
  "Account": "804686432477",
  "Arn": "arn:aws:iam::804686432477:user/KAHOI-KREATIONS"
}
```

---

## Step 3: Verify EC2 Instance Status

Check that your EC2 instance is running:

```bash
aws ec2 describe-instances \
  --instance-ids i-07a424fd876416ad0 \
  --query 'Reservations[0].Instances[0].[State.Name,PublicIpAddress]' \
  --output text
```

**Expected Output:**

```
running    44.210.245.82
```

---

## Step 4: Verify RDS Database Status

Check that your RDS database is available:

```bash
aws rds describe-db-instances \
  --db-instance-identifier patabima-production-db \
  --query 'DBInstances[0].[DBInstanceStatus,Endpoint.Address]' \
  --output text
```

**Expected Output:**

```
available    patabima-production-db.ca5qwoi4lxw.us-east-1.rds.amazonaws.com
```

---

## Step 5: Set Up SSH Key in CloudShell

Download the SSH private key to CloudShell:

```bash
# Create SSH directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Download the key from S3 (if you uploaded it earlier)
# OR create it manually (paste the private key content)
cat > ~/.ssh/aws-eb << 'EOF'
-----BEGIN RSA PRIVATE KEY-----
[PASTE YOUR aws-eb PRIVATE KEY CONTENT HERE]
-----END RSA PRIVATE KEY-----
EOF

# Set correct permissions
chmod 400 ~/.ssh/aws-eb
```

**Note:** If you don't have the private key content, you'll need to:

1. Generate a new key pair in EC2 console
2. Attach it to the instance (requires instance stop/start)
3. OR use EC2 Instance Connect instead of SSH

---

## Step 6: Create Deployment Workspace

```bash
cd ~
mkdir -p patabima-deploy
cd patabima-deploy
```

---

## Step 7: Download Deployment Files from S3

```bash
# Download all deployment files
aws s3 cp s3://patabima-media-prod/deployment/ . --recursive

# Verify files downloaded
ls -lh

# Make scripts executable
chmod +x ec2_setup.sh deploy_to_ec2.sh
```

**Expected Files:**

- `ec2_setup.sh` - Initial server setup
- `deploy_to_ec2.sh` - Full application deployment
- `patabima-backend.zip` - Application code
- `systemd/patabima.service` - Gunicorn service config
- `nginx/patabima.conf` - Nginx config

---

## Step 8: Test SSH Connection

```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82 "echo 'SSH connection successful!'"
```

**Expected Output:**

```
SSH connection successful!
```

**If SSH Fails:**

- Check security group allows port 22 from your IP
- Verify key permissions: `ls -l ~/.ssh/aws-eb` (should show `-r--------`)
- Try EC2 Instance Connect from AWS Console instead

---

## Step 9: Upload Files to EC2

```bash
# Create deployment directory on EC2
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82 "mkdir -p ~/deployment"

# Upload all files
scp -i ~/.ssh/aws-eb -r * ec2-user@44.210.245.82:~/deployment/

# Verify upload
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82 "ls -lh ~/deployment/"
```

---

## Step 10: Run Initial Server Setup

```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82 << 'ENDSSH'
cd ~/deployment
sudo chmod +x ec2_setup.sh
sudo ./ec2_setup.sh
ENDSSH
```

**This will install:**

- Python 3.11
- PostgreSQL client
- Nginx web server
- System dependencies
- Python virtual environment at `/var/www/patabima/venv`

**Duration:** ~3-5 minutes

---

## Step 11: Deploy Application Code

```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82 << 'ENDSSH'
cd ~/deployment

# Unzip application code
unzip -q patabima-backend.zip -d /var/www/patabima/

# Copy deployment files
sudo cp systemd/patabima.service /etc/systemd/system/
sudo cp nginx/patabima.conf /etc/nginx/conf.d/

# Set permissions
sudo chown -R ec2-user:ec2-user /var/www/patabima
cd /var/www/patabima

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install -r requirements.txt

echo "Application deployment complete!"
ENDSSH
```

**Duration:** ~5-10 minutes (installing Python packages)

---

## Step 12: Set Environment Variables & Run Migrations

```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82 << 'ENDSSH'
cd /var/www/patabima
source venv/bin/activate

# Set environment variables
export DEBUG=False
export SECRET_KEY="JqBr7F59HcizXuTdh4s5rMYRUxtPegb3l_UQ1EvL3C5MwUz_oqin1Tjs9QV8LwHwd5vmmNBKOpR4QYz3KfIbwg"
export ALLOWED_HOSTS="44.210.245.82,api.patabima.co.ke"
export RDS_HOSTNAME="patabima-production-db.ca5qwoi4lxw.us-east-1.rds.amazonaws.com"
export RDS_PORT="5432"
export RDS_DB_NAME="patabimadb"
export RDS_USERNAME="patabimaadmin"
export RDS_PASSWORD="PataB1ma2025Secure"
export USE_S3_MEDIA="1"
export AWS_STORAGE_BUCKET_NAME="patabima-media-prod"
export AWS_S3_REGION_NAME="us-east-1"

# Test database connection
echo "Testing database connection..."
python manage.py check --database default

# Run migrations
echo "Running migrations..."
python manage.py migrate

# Create superuser (interactive)
echo "Creating superuser..."
python manage.py createsuperuser

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

ENDSSH
```

**You'll be prompted to create superuser credentials during this step.**

---

## Step 13: Start Gunicorn Service

```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82 << 'ENDSSH'
# Reload systemd
sudo systemctl daemon-reload

# Enable and start Gunicorn service
sudo systemctl enable patabima
sudo systemctl start patabima

# Check status
sudo systemctl status patabima
ENDSSH
```

**Expected Output:** `Active: active (running)`

---

## Step 14: Configure and Start Nginx

```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82 << 'ENDSSH'
# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Check status
sudo systemctl status nginx
ENDSSH
```

---

## Step 15: Verify Deployment

### Test from CloudShell:

```bash
# Test Nginx is serving
curl http://44.210.245.82

# Test Django API endpoint
curl http://44.210.245.82/api/motor2/categories/
```

### Test from Browser:

1. Open: `http://44.210.245.82`
2. Open: `http://44.210.245.82/admin/`
3. Open: `http://44.210.245.82/api/motor2/categories/`

---

## Step 16: Check Logs (If Issues Occur)

```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82 << 'ENDSSH'
# Gunicorn logs
sudo journalctl -u patabima -n 50

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f /var/www/patabima/logs/error.log
ENDSSH
```

---

## Troubleshooting

### Issue: SSH Connection Refused

**Solution:**

```bash
# Check security group allows SSH from your IP
aws ec2 describe-security-groups \
  --group-ids sg-029645a9f7a7907c3 \
  --query 'SecurityGroups[0].IpPermissions[?FromPort==`22`]'

# Add your CloudShell IP if needed
aws ec2 authorize-security-group-ingress \
  --group-id sg-029645a9f7a7907c3 \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0
```

### Issue: Database Connection Failed

**Solution:**

```bash
# Verify RDS security group allows connection from EC2
aws rds describe-db-instances \
  --db-instance-identifier patabima-production-db \
  --query 'DBInstances[0].VpcSecurityGroups'

# Check if EC2 security group is authorized
aws rds modify-db-instance \
  --db-instance-identifier patabima-production-db \
  --vpc-security-group-ids sg-029645a9f7a7907c3 \
  --apply-immediately
```

### Issue: Gunicorn Service Failed

**Solution:**

```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82
cd /var/www/patabima
source venv/bin/activate

# Test Gunicorn manually
gunicorn --bind 0.0.0.0:8000 insurance-app.wsgi:application

# Check for errors
sudo journalctl -u patabima -n 100
```

---

## Next Steps (After Successful Deployment)

### 1. Set Up SSL Certificate (Let's Encrypt)

```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.patabima.co.ke
```

### 2. Configure DNS

Point `api.patabima.co.ke` to `44.210.245.82` in your domain registrar.

### 3. Set Up Automated Backups

```bash
# Create backup script
aws backup create-backup-plan --backup-plan file://backup-plan.json
```

### 4. Enable CloudWatch Monitoring

```bash
# Install CloudWatch agent
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82
sudo dnf install -y amazon-cloudwatch-agent
```

---

## Quick Reference Commands

### Restart Services:

```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82
sudo systemctl restart patabima
sudo systemctl restart nginx
```

### View Logs:

```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82
sudo journalctl -u patabima -f
```

### Update Application Code:

```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82
cd /var/www/patabima
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart patabima
```

---

## Support

If you encounter issues during deployment, check:

1. CloudWatch Logs (if agent is installed)
2. `/var/log/nginx/error.log`
3. `sudo journalctl -u patabima -n 100`
4. `/var/www/patabima/logs/error.log`

---

**Last Updated:** November 14, 2025

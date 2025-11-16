# EC2 Direct Deployment Guide - PataBima Insurance Backend

**Date:** November 14, 2025  
**AWS Account:** KAHOI-KREATIONS (804686432477)  
**Region:** us-east-1  
**Approach:** Direct EC2 + Nginx + Gunicorn (Simpler than Elastic Beanstalk)

---

## Why EC2 Direct Deployment?

**Advantages over Elastic Beanstalk:**

- ✅ **Faster setup** - No platform-specific configuration issues
- ✅ **Direct control** - Full access to server configuration
- ✅ **Easier debugging** - Direct SSH access and logs
- ✅ **Cost-effective** - No additional EB management fees
- ✅ **Simpler** - Standard Django deployment pattern

**When to use:**

- Production deployments where you need full control
- When EB deployment keeps failing
- For learning DevOps fundamentals

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Internet Gateway                     │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│              Elastic IP (Optional)                      │
│              44.210.245.82                              │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                   EC2 Instance                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Amazon Linux 2023 (t3.medium)                   │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │  Nginx (Reverse Proxy)                     │  │   │
│  │  │  Port 80/443                               │  │   │
│  │  └────────────────┬───────────────────────────┘  │   │
│  │                   │                              │   │
│  │  ┌────────────────▼───────────────────────────┐  │   │
│  │  │  Gunicorn (WSGI Server)                    │  │   │
│  │  │  Port 8000 (Unix Socket)                   │  │   │
│  │  └────────────────┬───────────────────────────┘  │   │
│  │                   │                              │   │
│  │  ┌────────────────▼───────────────────────────┐  │   │
│  │  │  Django Application                        │  │   │
│  │  │  insurance-app                             │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │                                  │
         │ RDS Connection                   │ S3 Access
         ▼                                  ▼
┌─────────────────┐               ┌──────────────┐
│  RDS PostgreSQL │               │   S3 Bucket  │
│  Multi-AZ       │               │  (Media)     │
│  db.t3.medium   │               └──────────────┘
└─────────────────┘
```

---

## Prerequisites

### 1. AWS Resources Already Created

- ✅ **RDS Database:** patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com
- ✅ **S3 Bucket:** patabima-media-prod
- ✅ **IAM Credentials:** KAHOI-KREATIONS user configured

### 2. Local Requirements

- AWS CLI installed and configured
- SSH client (built into Windows 10+)
- Git for version control

---

## Step-by-Step Deployment

### Step 1: Terminate Elastic Beanstalk Environment (Cleanup)

```powershell
# Navigate to insurance-app
cd C:\Users\USER\Desktop\PATABIMA01\insurance-app

# Add EB CLI to PATH
$env:Path += ";C:\Users\USER\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts"

# Terminate EB environment
eb terminate patabima-production --force

# This will delete:
# - Load balancer
# - Auto Scaling group
# - EC2 instances
# - Security groups
# But KEEPS: RDS database, S3 bucket
```

**Expected Duration:** 5-10 minutes

---

### Step 2: Launch EC2 Instance

```powershell
# Get latest Amazon Linux 2023 AMI
$AMI_ID = aws ec2 describe-images `
  --owners amazon `
  --filters "Name=name,Values=al2023-ami-2023.*-x86_64" `
  --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' `
  --output text

Write-Host "Latest AMI: $AMI_ID"

# Create security group
$SG_ID = aws ec2 create-security-group `
  --group-name patabima-backend-sg `
  --description "Security group for PataBima backend server" `
  --query 'GroupId' `
  --output text

# Add inbound rules
aws ec2 authorize-security-group-ingress `
  --group-id $SG_ID `
  --protocol tcp --port 22 --cidr 0.0.0.0/0  # SSH

aws ec2 authorize-security-group-ingress `
  --group-id $SG_ID `
  --protocol tcp --port 80 --cidr 0.0.0.0/0  # HTTP

aws ec2 authorize-security-group-ingress `
  --group-id $SG_ID `
  --protocol tcp --port 443 --cidr 0.0.0.0/0  # HTTPS

# Launch EC2 instance
$INSTANCE_ID = aws ec2 run-instances `
  --image-id $AMI_ID `
  --instance-type t3.medium `
  --key-name aws-eb `
  --security-group-ids $SG_ID `
  --query 'Instances[0].InstanceId' `
  --output text

Write-Host "Instance ID: $INSTANCE_ID"

# Wait for instance to be running
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP
$PUBLIC_IP = aws ec2 describe-instances `
  --instance-ids $INSTANCE_ID `
  --query 'Reservations[0].Instances[0].PublicIpAddress' `
  --output text

Write-Host "Public IP: $PUBLIC_IP"
```

**Save these values:**

```
INSTANCE_ID: i-xxxxxxxxxxxxx
PUBLIC_IP: x.x.x.x
SECURITY_GROUP_ID: sg-xxxxxxxxxxxxx
```

---

### Step 3: Connect to EC2 Instance

**Option A: Using SSH Key (Recommended)**

```powershell
# SSH into EC2 instance
ssh -i ~/.ssh/aws-eb ec2-user@$PUBLIC_IP
```

**Option B: Using EC2 Instance Connect (Browser-based)**

1. Go to AWS Console → EC2
2. Select your instance
3. Click **Connect** → **EC2 Instance Connect**
4. Click **Connect**

---

### Step 4: Install System Packages

Run these commands **on the EC2 instance:**

```bash
#!/bin/bash
# Update system
sudo dnf update -y

# Install Python 3.11
sudo dnf install -y python3.11 python3.11-pip python3.11-devel

# Install PostgreSQL client
sudo dnf install -y postgresql15

# Install Nginx
sudo dnf install -y nginx

# Install system dependencies
sudo dnf install -y git gcc gcc-c++ make

# Install development libraries (for Pillow, psycopg, etc.)
sudo dnf install -y \
  postgresql-devel \
  libjpeg-turbo-devel \
  zlib-devel \
  libpng-devel \
  freetype-devel

# Verify installations
python3.11 --version
psql --version
nginx -v
```

---

### Step 5: Set Up Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/patabima
sudo chown -R ec2-user:ec2-user /var/www/patabima

# Create Python virtual environment
cd /var/www/patabima
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip
```

---

### Step 6: Upload Application Code

**From your local machine (PowerShell):**

```powershell
# Navigate to backend directory
cd C:\Users\USER\Desktop\PATABIMA01

# Create ZIP file (exclude unnecessary files)
Compress-Archive -Path insurance-app\* -DestinationPath patabima-backend.zip -Force

# Upload to S3
aws s3 cp patabima-backend.zip s3://patabima-media-prod/deployment/

# Or use SCP directly to EC2
scp -i ~/.ssh/aws-eb patabima-backend.zip ec2-user@${PUBLIC_IP}:/var/www/patabima/
```

**Back on EC2 instance:**

```bash
# Download from S3 (if uploaded there)
cd /var/www/patabima
aws s3 cp s3://patabima-media-prod/deployment/patabima-backend.zip .

# Extract
unzip -q patabima-backend.zip

# Remove zip file
rm patabima-backend.zip

# Set permissions
sudo chown -R ec2-user:ec2-user /var/www/patabima
```

---

### Step 7: Install Python Dependencies

```bash
cd /var/www/patabima
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Verify Django installation
python -c "import django; print(django.get_version())"
# Expected: 4.2.16
```

---

### Step 8: Configure Environment Variables

Create environment file:

```bash
cat > /var/www/patabima/.env << 'EOF'
# Django Core
SECRET_KEY=y4TfsQDZdrmdqMmRXv7Gr5mrEvHfop3nfhb40UjjIufjzNrw-6eiPCga4AF6eVlN6tPdGW2OcUqmwKN_v5Lyb1knWN3vYhCGT_8j
DEBUG=False
ALLOWED_HOSTS=44.210.245.82,api.patabima.co.ke
DJANGO_SETTINGS_MODULE=insurance.settings

# Database (RDS PostgreSQL)
RDS_HOSTNAME=patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_DB_NAME=patabimadb
RDS_USERNAME=patabimaadmin
RDS_PASSWORD=PataB1ma2025Secure

# AWS Services
USE_S3_MEDIA=1
AWS_STORAGE_BUCKET_NAME=patabima-media-prod
AWS_S3_REGION_NAME=us-east-1

# DMVIC Integration
DMVIC_BASE_URL=https://uat-api.dmvic.com
DMVIC_MEMBER_CODE=PATABIMA

# CORS
CORS_ALLOWED_ORIGINS=https://app.patabima.co.ke,https://www.patabima.co.ke
EOF

# Secure the file
chmod 600 /var/www/patabima/.env
```

---

### Step 9: Test Database Connection

```bash
cd /var/www/patabima
source venv/bin/activate

# Load environment variables
export $(cat .env | xargs)

# Test database connection
python manage.py check --database default

# Expected output:
# System check identified no issues (0 silenced).
```

**If connection fails:**

```bash
# Test PostgreSQL connection manually
psql -h $RDS_HOSTNAME -U $RDS_USERNAME -d $RDS_DB_NAME

# Check RDS security group allows EC2 instance
```

---

### Step 10: Run Database Migrations

```bash
cd /var/www/patabima
source venv/bin/activate
export $(cat .env | xargs)

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
# Username: admin
# Email: admin@patabima.co.ke
# Password: [your secure password]

# Collect static files
python manage.py collectstatic --noinput
```

---

### Step 11: Configure Gunicorn Service

Create systemd service file:

```bash
sudo tee /etc/systemd/system/patabima.service > /dev/null << 'EOF'
[Unit]
Description=PataBima Insurance Gunicorn Service
After=network.target

[Service]
Type=notify
User=ec2-user
Group=ec2-user
WorkingDirectory=/var/www/patabima
Environment="PATH=/var/www/patabima/venv/bin"
EnvironmentFile=/var/www/patabima/.env
ExecStart=/var/www/patabima/venv/bin/gunicorn \
    --bind unix:/var/www/patabima/gunicorn.sock \
    --workers 3 \
    --threads 2 \
    --timeout 120 \
    --access-logfile /var/www/patabima/logs/access.log \
    --error-logfile /var/www/patabima/logs/error.log \
    --log-level info \
    insurance.wsgi:application

ExecReload=/bin/kill -s HUP $MAINPID
KillMode=mixed
TimeoutStopSec=5
PrivateTmp=true
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create logs directory
mkdir -p /var/www/patabima/logs

# Reload systemd
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable patabima
sudo systemctl start patabima

# Check status
sudo systemctl status patabima
```

**Expected output:**

```
● patabima.service - PataBima Insurance Gunicorn Service
   Loaded: loaded (/etc/systemd/system/patabima.service; enabled)
   Active: active (running) since Thu 2025-11-14 10:00:00 UTC; 5s ago
```

---

### Step 12: Configure Nginx

Create Nginx configuration:

```bash
sudo tee /etc/nginx/conf.d/patabima.conf > /dev/null << 'EOF'
upstream patabima_app {
    server unix:/var/www/patabima/gunicorn.sock fail_timeout=0;
}

server {
    listen 80;
    server_name 44.210.245.82 api.patabima.co.ke;

    client_max_body_size 50M;

    access_log /var/log/nginx/patabima_access.log;
    error_log /var/log/nginx/patabima_error.log;

    location /static/ {
        alias /var/www/patabima/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /var/www/patabima/media/;
        expires 7d;
    }

    location / {
        proxy_pass http://patabima_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;

        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
}
EOF

# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Check status
sudo systemctl status nginx
```

---

### Step 13: Test Deployment

**From your local machine:**

```powershell
# Test HTTP access
curl http://$PUBLIC_IP

# Test API endpoint
curl http://$PUBLIC_IP/api/motor2/categories/

# Test admin panel
curl http://$PUBLIC_IP/admin/
```

**From browser:**

- `http://44.210.245.82/` - Should show Django response
- `http://44.210.245.82/admin/` - Django admin login
- `http://44.210.245.82/api/motor2/categories/` - API endpoint

---

## Common Commands

### Restart Services

```bash
# Restart Gunicorn
sudo systemctl restart patabima

# Restart Nginx
sudo systemctl restart nginx

# Restart both
sudo systemctl restart patabima nginx
```

### View Logs

```bash
# Gunicorn logs
sudo journalctl -u patabima -f

# Application logs
tail -f /var/www/patabima/logs/error.log

# Nginx logs
sudo tail -f /var/log/nginx/patabima_error.log
```

### Update Application Code

```bash
cd /var/www/patabima
source venv/bin/activate

# Pull latest code (if using Git)
git pull origin main

# Or upload new ZIP and extract

# Install new dependencies
pip install -r requirements.txt

# Run migrations
export $(cat .env | xargs)
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Restart Gunicorn
sudo systemctl restart patabima
```

---

## SSL/HTTPS Setup (Optional)

### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo dnf install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.patabima.co.ke

# Follow prompts:
# - Enter email
# - Agree to terms
# - Redirect HTTP to HTTPS: Yes

# Test auto-renewal
sudo certbot renew --dry-run
```

**Certbot will automatically:**

- Obtain SSL certificate
- Update Nginx configuration
- Set up auto-renewal cron job

---

## Monitoring & Maintenance

### CloudWatch Agent (Optional)

```bash
# Install CloudWatch agent
sudo dnf install -y amazon-cloudwatch-agent

# Configure agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard
```

### Automated Backups

```bash
# Create backup script
cat > /home/ec2-user/backup_db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/patabima"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

pg_dump -h patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com \
  -U patabimaadmin -d patabimadb > $BACKUP_DIR/backup_$DATE.sql

# Upload to S3
aws s3 cp $BACKUP_DIR/backup_$DATE.sql s3://patabima-media-prod/backups/

# Keep only last 7 days locally
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x /home/ec2-user/backup_db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ec2-user/backup_db.sh") | crontab -
```

---

## Troubleshooting

### Issue: Gunicorn Not Starting

```bash
# Check logs
sudo journalctl -u patabima -n 100

# Test Gunicorn manually
cd /var/www/patabima
source venv/bin/activate
export $(cat .env | xargs)
gunicorn --bind 0.0.0.0:8000 insurance.wsgi:application
```

### Issue: Database Connection Failed

```bash
# Test PostgreSQL connection
psql -h patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com \
  -U patabimaadmin -d patabimadb

# Check RDS security group
aws rds describe-db-instances \
  --db-instance-identifier patabima-production-db \
  --query 'DBInstances[0].VpcSecurityGroups'
```

### Issue: 502 Bad Gateway

```bash
# Check Gunicorn socket
ls -l /var/www/patabima/gunicorn.sock

# Check Nginx error logs
sudo tail -f /var/log/nginx/patabima_error.log

# Verify Gunicorn is running
sudo systemctl status patabima
```

---

## Cost Estimate

### Monthly Costs (us-east-1)

| Service        | Configuration         | Monthly Cost (USD) |
| -------------- | --------------------- | ------------------ |
| EC2 Instance   | t3.medium             | $30.37             |
| RDS PostgreSQL | db.t3.medium Multi-AZ | $130               |
| EBS Storage    | 30 GB GP3             | $2.40              |
| S3 Storage     | 100 GB + requests     | $3                 |
| Data Transfer  | 100 GB outbound       | $9                 |
| **Total**      |                       | **~$175/month**    |

**Savings vs Elastic Beanstalk:** ~$50/month (no EB management fees, no ALB)

---

## Security Checklist

- [ ] RDS database not publicly accessible
- [ ] EC2 security group allows only necessary ports
- [ ] SSH key-based authentication only (no passwords)
- [ ] Django SECRET_KEY is secure (50+ random characters)
- [ ] DEBUG=False in production
- [ ] HTTPS/SSL configured (Let's Encrypt)
- [ ] Regular security updates: `sudo dnf update -y`
- [ ] CloudWatch monitoring enabled
- [ ] Automated database backups configured
- [ ] `.env` file permissions set to 600

---

## Next Steps After Deployment

1. **Point Domain to EC2:**

   - Create A record: `api.patabima.co.ke` → EC2 Public IP
   - Install SSL certificate with Let's Encrypt

2. **Set Up CI/CD:**

   - GitHub Actions for automated deployments
   - Deploy on push to `main` branch

3. **Enable Monitoring:**

   - CloudWatch agent for metrics
   - Set up alerts for high CPU/memory
   - Log aggregation

4. **Implement Rate Limiting:**

   - Use Nginx rate limiting
   - Or implement Django throttling

5. **Optimize Performance:**
   - Enable Django caching (Redis/Memcached)
   - Configure database connection pooling
   - Optimize Nginx caching

---

**Deployment Complete! 🎉**

Your Django application is now running on:

- **HTTP:** `http://44.210.245.82/`
- **Admin:** `http://44.210.245.82/admin/`
- **API:** `http://44.210.245.82/api/motor2/categories/`

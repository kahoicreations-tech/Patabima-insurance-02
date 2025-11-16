# CloudShell Fresh Start - PataBima EC2 Deployment

**Date:** November 16, 2025  
**AWS Account:** KAHOI-KREATIONS (804686432477)  
**Region:** us-east-1  
**Deployment Method:** EC2 + SSM Session Manager (No SSH keys needed!)

---

## 🎯 What We're Doing

Deploying the PataBima Django backend to EC2 using **AWS Systems Manager Session Manager** - a secure way to connect to EC2 instances directly from CloudShell without managing SSH keys.

---

## 📋 Prerequisites Check

### AWS Resources (Should Already Exist)

```bash
# Open AWS CloudShell and verify resources exist
aws rds describe-db-instances --db-instance-identifier patabima-production-db --query 'DBInstances[0].[DBInstanceIdentifier,DBInstanceStatus,Endpoint.Address]' --output table

aws s3 ls s3://patabima-media-prod/

aws ec2 describe-instances --filters "Name=tag:Name,Values=PataBima-Production" --query 'Reservations[0].Instances[0].[InstanceId,State.Name,PublicIpAddress]' --output table
```

**Expected Results:**
- ✅ RDS: `patabima-production-db` - Status: `available`
- ✅ S3: `patabima-media-prod` - Files present
- ✅ EC2: Instance running with public IP

---

## 🚀 Step 1: Launch Fresh EC2 Instance

If you don't have an EC2 instance yet, or want to start fresh:

```bash
# Set your AWS region
export AWS_REGION=us-east-1

# Create security group
SG_ID=$(aws ec2 create-security-group \
  --group-name PataBima-WebServer-SG \
  --description "Security group for PataBima web server" \
  --query 'GroupId' \
  --output text)

echo "Security Group ID: $SG_ID"

# Add security group rules
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

# Get latest Amazon Linux 2023 AMI
AMI_ID=$(aws ec2 describe-images \
  --owners amazon \
  --filters "Name=name,Values=al2023-ami-2023*-x86_64" \
  --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
  --output text)

echo "AMI ID: $AMI_ID"

# Create IAM role for EC2 (needed for SSM and S3 access)
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
  --role-name PataBima-EC2-Role \
  --assume-role-policy-document file://trust-policy.json

# Attach managed policies
aws iam attach-role-policy \
  --role-name PataBima-EC2-Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore

aws iam attach-role-policy \
  --role-name PataBima-EC2-Role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess

# Create instance profile
aws iam create-instance-profile \
  --instance-profile-name PataBima-EC2-InstanceProfile

aws iam add-role-to-instance-profile \
  --instance-profile-name PataBima-EC2-InstanceProfile \
  --role-name PataBima-EC2-Role

# Wait a few seconds for IAM to propagate
sleep 10

# Launch EC2 instance
INSTANCE_ID=$(aws ec2 run-instances \
  --image-id $AMI_ID \
  --instance-type t3.medium \
  --security-group-ids $SG_ID \
  --iam-instance-profile Name=PataBima-EC2-InstanceProfile \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=PataBima-Production}]' \
  --user-data '#!/bin/bash
yum update -y
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent' \
  --query 'Instances[0].InstanceId' \
  --output text)

echo "Instance ID: $INSTANCE_ID"

# Wait for instance to be running
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "Public IP: $PUBLIC_IP"
echo "Instance is ready! Waiting 2 minutes for SSM agent to register..."
sleep 120
```

---

## 🔌 Step 2: Connect to EC2 via Session Manager

**No SSH keys needed!** Session Manager uses IAM authentication.

```bash
# Check if instance is registered with SSM
aws ssm describe-instance-information \
  --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
  --query 'InstanceInformationList[0].[InstanceId,PingStatus,AgentVersion]' \
  --output table

# Start interactive session
aws ssm start-session --target $INSTANCE_ID
```

**Expected:** You'll get a shell prompt like `sh-5.2$`

---

## 📦 Step 3: Install System Dependencies

Once connected via Session Manager:

```bash
# Switch to bash for better shell
bash

# Update system
sudo dnf update -y

# Install Python 3.11
sudo dnf install -y python3.11 python3.11-pip python3.11-devel

# Install PostgreSQL client
sudo dnf install -y postgresql15

# Install Nginx
sudo dnf install -y nginx

# Install development tools
sudo dnf install -y git gcc gcc-c++ make \
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

## 🏗️ Step 4: Set Up Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/patabima
sudo chown -R ssm-user:ssm-user /var/www/patabima

# Create virtual environment
cd /var/www/patabima
python3.11 -m venv venv

# Activate venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip
```

---

## 📥 Step 5: Download Application Code

### Option A: From S3 (Recommended)

```bash
# First, upload from your local machine (in CloudShell)
# Exit the SSM session (Ctrl+D), then run:
cd ~
git clone https://github.com/kahoicreations-tech/Patabima-insurance-02.git
cd Patabima-insurance-02/insurance-app

# Create clean ZIP
zip -r ../patabima-backend.zip . -x "*.pyc" "__pycache__/*" "*.sqlite3" ".env" "venv/*"

# Upload to S3
aws s3 cp ../patabima-backend.zip s3://patabima-media-prod/deployment/

# Now reconnect to instance
aws ssm start-session --target $INSTANCE_ID

# Back in instance, download and extract
cd /var/www/patabima
aws s3 cp s3://patabima-media-prod/deployment/patabima-backend.zip .
unzip -q patabima-backend.zip
rm patabima-backend.zip
```

### Option B: Direct Git Clone

```bash
cd /var/www/patabima
git clone https://github.com/kahoicreations-tech/Patabima-insurance-02.git temp
mv temp/insurance-app/* .
rm -rf temp
```

---

## 🐍 Step 6: Install Python Dependencies

```bash
cd /var/www/patabima
source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Verify Django
python -c "import django; print(django.get_version())"
```

---

## ⚙️ Step 7: Configure Environment Variables

```bash
cat > /var/www/patabima/.env << 'EOF'
# Django Core
SECRET_KEY=y4TfsQDZdrmdqMmRXv7Gr5mrEvHfop3nfhb40UjjIufjzNrw-6eiPCga4AF6eVlN6tPdGW2OcUqmwKN_v5Lyb1knWN3vYhCGT_8j
DEBUG=False
ALLOWED_HOSTS=*
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

chmod 600 /var/www/patabima/.env
```

---

## 🗄️ Step 8: Run Database Migrations

```bash
cd /var/www/patabima
source venv/bin/activate

# Load environment variables
set -a
source .env
set +a

# Test database connection
python manage.py check --database default

# Run migrations
python manage.py migrate

# Create superuser (interactive)
python manage.py createsuperuser

# Collect static files
python manage.py collectstatic --noinput
```

---

## 🦄 Step 9: Configure Gunicorn

```bash
# Create Gunicorn systemd service
sudo tee /etc/systemd/system/patabima.service > /dev/null << 'EOF'
[Unit]
Description=PataBima Gunicorn daemon
After=network.target

[Service]
User=ssm-user
Group=ssm-user
WorkingDirectory=/var/www/patabima
EnvironmentFile=/var/www/patabima/.env
ExecStart=/var/www/patabima/venv/bin/gunicorn \
  --workers 3 \
  --bind unix:/var/www/patabima/gunicorn.sock \
  insurance.wsgi:application

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Start Gunicorn
sudo systemctl start patabima

# Enable on boot
sudo systemctl enable patabima

# Check status
sudo systemctl status patabima
```

---

## 🌐 Step 10: Configure Nginx

```bash
# Create Nginx configuration
sudo tee /etc/nginx/conf.d/patabima.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 100M;

    location = /favicon.ico { access_log off; log_not_found off; }

    location /static/ {
        alias /var/www/patabima/staticfiles/;
    }

    location /media/ {
        alias /var/www/patabima/media/;
    }

    location / {
        proxy_pass http://unix:/var/www/patabima/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Test Nginx config
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

---

## ✅ Step 11: Verify Deployment

From CloudShell (not SSM session):

```bash
# Get instance public IP
PUBLIC_IP=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=PataBima-Production" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text)

echo "Testing API at http://$PUBLIC_IP/api/"

# Test API endpoint
curl -I http://$PUBLIC_IP/api/

# Test health check
curl http://$PUBLIC_IP/api/health/
```

**Expected:** HTTP 200 responses

---

## 🔍 Troubleshooting

### Check Logs

```bash
# Gunicorn logs
sudo journalctl -u patabima -n 50 --no-pager

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### Restart Services

```bash
# Restart Gunicorn
sudo systemctl restart patabima

# Restart Nginx
sudo systemctl restart nginx
```

### Check SSM Agent

```bash
# If Session Manager not working
sudo systemctl status amazon-ssm-agent
sudo systemctl restart amazon-ssm-agent
```

---

## 🎉 Next Steps

1. **SSL Certificate:** Set up Let's Encrypt for HTTPS
2. **Domain:** Point api.patabima.co.ke to the public IP
3. **CloudWatch:** Enable logs and monitoring
4. **Backups:** Configure RDS automated backups
5. **CI/CD:** Set up GitHub Actions for automated deployments

---

## 📝 Quick Reference

```bash
# Instance ID (replace with yours)
INSTANCE_ID=i-0xxxxxxxxx

# Connect to instance
aws ssm start-session --target $INSTANCE_ID

# Restart application
sudo systemctl restart patabima nginx

# View logs
sudo journalctl -u patabima -f
```

---

## ⚠️ Important Notes

1. **SSM Agent:** Amazon Linux 2023 has SSM pre-installed, but needs 2-3 minutes to register
2. **IAM Role:** The instance MUST have `AmazonSSMManagedInstanceCore` policy attached
3. **Security Group:** Port 80/443 must be open for web access
4. **RDS Security Group:** Must allow connections from EC2 security group
5. **S3 Access:** Instance needs `AmazonS3ReadOnlyAccess` to download deployment files

---

**Ready to deploy? Start with Step 1 in AWS CloudShell!** 🚀

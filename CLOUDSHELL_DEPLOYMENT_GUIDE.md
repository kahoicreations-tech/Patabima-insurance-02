# AWS CloudShell Deployment Guide for PataBima

This guide provides a fresh, step-by-step process to deploy the PataBima backend to your EC2 instance using AWS CloudShell.

## Prerequisites

- **EC2 Instance:** `i-07a424fd876416ad0` (Running)
- **Public IP:** `44.210.245.82`
- **S3 Bucket:** `patabima-media-prod` (Contains deployment files)
- **SSH Key:** `aws-eb` (Available in CloudShell)

## Step 1: Open CloudShell & Prepare SSH Key

1.  Open **AWS CloudShell** in the `us-east-1` (N. Virginia) region.
2.  Verify your SSH key exists and has correct permissions:

```bash
ls -l ~/.ssh/aws-eb
# If permissions are not -r-------- (400), fix them:
chmod 400 ~/.ssh/aws-eb
```

## Step 2: Connect to EC2 Instance

Connect to your instance using the SSH key:

```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82
```

_Type `yes` if asked to confirm the fingerprint._

## Step 3: Download Deployment Files

Once inside the EC2 instance (you'll see `[ec2-user@ip-... ~]$`), run these commands to download the setup scripts from S3:

```bash
# Create a temporary directory
mkdir -p ~/deploy
cd ~/deploy

# Download files from S3
aws s3 cp s3://patabima-media-prod/deployment/ec2_setup.sh .
aws s3 cp s3://patabima-media-prod/deployment/deploy_to_ec2.sh .
aws s3 cp s3://patabima-media-prod/deployment/patabima-backend.zip .
aws s3 cp s3://patabima-media-prod/deployment/systemd/patabima.service .
aws s3 cp s3://patabima-media-prod/deployment/nginx/patabima.conf .

# Make scripts executable
chmod +x ec2_setup.sh deploy_to_ec2.sh
```

## Step 4: Run Initial Server Setup

This script installs Python 3.11, PostgreSQL, Nginx, and sets up the project directory.

```bash
sudo ./ec2_setup.sh
```

_Wait for the installation to complete._

## Step 5: Deploy Application

This script installs dependencies, runs migrations, and configures Gunicorn/Nginx.

```bash
sudo ./deploy_to_ec2.sh
```

## Step 6: Verify Deployment

Check if the services are running:

```bash
# Check Gunicorn status
sudo systemctl status patabima

# Check Nginx status
sudo systemctl status nginx
```

## Step 7: Create Superuser (Optional)

To access the Django admin:

```bash
source /var/www/patabima/venv/bin/activate
cd /var/www/patabima
python manage.py createsuperuser
```

## Troubleshooting

If something goes wrong, check the logs:

```bash
# Application logs
sudo tail -f /var/www/patabima/logs/django.log

# Gunicorn logs
sudo journalctl -u patabima -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

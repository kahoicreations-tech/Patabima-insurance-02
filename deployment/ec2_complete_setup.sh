#!/bin/bash
# PataBima EC2 Complete Setup and Deployment Script
# Run this script on a fresh Amazon Linux 2023 EC2 instance

set -e  # Exit on error

echo "======================================"
echo "  PataBima Backend Deployment"
echo "  $(date)"
echo "======================================"
echo ""

# Update system
echo "[1/10] Updating system packages..."
sudo dnf update -y

# Install Python 3.11
echo "[2/10] Installing Python 3.11..."
sudo dnf install -y python3.11 python3.11-pip python3.11-devel

# Install PostgreSQL client
echo "[3/10] Installing PostgreSQL client..."
sudo dnf install -y postgresql15

# Install Nginx
echo "[4/10] Installing Nginx..."
sudo dnf install -y nginx

# Install system dependencies
echo "[5/10] Installing system dependencies..."
sudo dnf install -y git gcc gcc-c++ make
sudo dnf install -y postgresql-devel libjpeg-turbo-devel zlib-devel libpng-devel freetype-devel

# Create application directory
echo "[6/10] Creating application directory..."
sudo mkdir -p /var/www/patabima
sudo chown -R ec2-user:ec2-user /var/www/patabima

# Create Python virtual environment
echo "[7/10] Setting up Python virtual environment..."
cd /var/www/patabima
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip

# Download application code from S3
echo "[8/10] Downloading application code..."
aws s3 cp s3://patabima-media-prod/deployment/patabima-backend.zip .
unzip -q patabima-backend.zip
rm patabima-backend.zip

# Install Python dependencies
echo "[9/10] Installing Python dependencies..."
pip install -r requirements.txt

# Create logs directory
mkdir -p logs

echo ""
echo "======================================"
echo "  Setup Complete!"
echo "======================================"
echo ""
echo "Python version: $(python --version)"
echo "Django version: $(python -c 'import django; print(django.get_version())')"
echo "PostgreSQL client: $(psql --version)"
echo "Nginx version: $(nginx -v 2>&1)"
echo ""
echo "Next steps:"
echo "1. Configure environment variables (.env file)"
echo "2. Run database migrations"
echo "3. Configure Gunicorn and Nginx"
echo "4. Start services"
echo ""

#!/bin/bash
set -e

echo "=== PataBima Backend Setup Script ==="
echo "Starting at $(date)"

# Update system
echo "Updating system packages..."
sudo dnf update -y

# Install Python 3.11
echo "Installing Python 3.11..."
sudo dnf install -y python3.11 python3.11-pip python3.11-devel

# Install PostgreSQL client
echo "Installing PostgreSQL client..."
sudo dnf install -y postgresql15

# Install system dependencies
echo "Installing system dependencies..."
sudo dnf install -y gcc gcc-c++ make git nginx

# Install development libraries
sudo dnf install -y libjpeg-turbo-devel zlib-devel libpng-devel freetype-devel

# Create application directory
echo "Creating application directory..."
sudo mkdir -p /var/www/patabima
sudo chown -R ec2-user:ec2-user /var/www/patabima
cd /var/www/patabima

# Create virtual environment
echo "Creating Python virtual environment..."
python3.11 -m venv venv
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

echo "=== Setup complete! ==="
echo "Next steps:"
echo "1. Upload your Django app to /var/www/patabima/"
echo "2. Install requirements: pip install -r requirements.txt"
echo "3. Configure environment variables"
echo "4. Run migrations and collectstatic"
echo "5. Configure Gunicorn and Nginx"

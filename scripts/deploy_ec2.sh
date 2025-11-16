#!/bin/bash
# EC2 Deployment Script - Run this on your EC2 instance
# This script pulls latest code from GitHub and restarts services

set -e  # Exit on error

echo "🚀 PataBima EC2 Deployment Script"
echo "=================================="

# Configuration
APP_DIR="/var/www/patabima"
REPO_URL="https://github.com/kahoicreations-tech/Patabima-insurance-02.git"
BRANCH="main"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root or with sudo"
    exit 1
fi

# Navigate to app directory
cd "$APP_DIR" || {
    echo "❌ App directory not found. Run setup script first."
    exit 1
}

echo ""
echo "📥 Pulling latest code from GitHub..."
sudo -u ec2-user git pull origin "$BRANCH"

echo ""
echo "📦 Installing/updating dependencies..."
source venv/bin/activate
pip install -r insurance-app/requirements.txt --quiet

echo ""
echo "🔄 Running database migrations..."
cd insurance-app
python manage.py migrate --noinput

echo ""
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

echo ""
echo "🔄 Restarting Gunicorn service..."
systemctl restart patabima

echo ""
echo "🔄 Restarting Nginx..."
systemctl restart nginx

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Service Status:"
systemctl status patabima --no-pager | head -n 5
echo ""
echo "🌐 Application should be accessible at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"

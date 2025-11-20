#!/bin/bash
# Quick CORS Fix - Update settings.py only
# Run this on EC2 via CloudShell

set -e

echo "🔄 Downloading updated settings.py from S3..."
aws s3 cp s3://patabima-media-prod/deployment/settings.py /tmp/settings.py

echo "📦 Backing up current settings..."
sudo cp /var/www/patabima/insurance-app/insurance/settings.py \
        /var/www/patabima/insurance-app/insurance/settings.py.backup.$(date +%Y%m%d-%H%M%S)

echo "📝 Replacing settings.py..."
sudo cp /tmp/settings.py /var/www/patabima/insurance-app/insurance/settings.py
sudo chown ec2-user:ec2-user /var/www/patabima/insurance-app/insurance/settings.py

echo "🔄 Restarting Django service..."
sudo systemctl restart patabima

echo "⏳ Waiting for service to start..."
sleep 3

echo "✅ Testing health endpoint..."
curl -I http://localhost/api/v1/health/

echo ""
echo "🎉 CORS fix deployed! Service restarted."
echo ""
echo "Test from your phone now!"

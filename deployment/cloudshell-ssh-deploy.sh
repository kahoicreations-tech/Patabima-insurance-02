#!/bin/bash
# SSH-based deployment for AWS CloudShell
# Run this in CloudShell after uploading your SSH private key

set -e

# Configuration
EC2_IP="44.200.182.180"
S3_BUCKET="patabima-media-prod"
ZIP_FILE="patabima-backend-20251116-210558.zip"
SSH_KEY="~/.ssh/patabima-key.pem"

echo ""
echo "🚀 PataBima Backend SSH Deployment"
echo "===================================="
echo ""

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found at $SSH_KEY"
    echo ""
    echo "📝 Please upload your SSH private key:"
    echo "   1. In CloudShell, click Actions > Upload file"
    echo "   2. Upload your .pem key file (aws-eb.pem or patabima-ec2-key.pem)"
    echo "   3. Run: mkdir -p ~/.ssh && mv ~/uploaded-key.pem ~/.ssh/patabima-key.pem && chmod 400 ~/.ssh/patabima-key.pem"
    echo "   4. Re-run this script"
    echo ""
    exit 1
fi

# Download deployment package from S3
echo "☁️  Downloading deployment package from S3..."
if ! aws s3 cp "s3://$S3_BUCKET/deployment/$ZIP_FILE" ./ --region us-east-1; then
    echo "❌ Failed to download from S3!"
    echo "   Check if file exists: s3://$S3_BUCKET/deployment/$ZIP_FILE"
    exit 1
fi
echo "✅ Downloaded $ZIP_FILE"

# Create deployment script for EC2
echo ""
echo "📝 Creating deployment script..."
cat > deploy-on-ec2.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

ZIP_FILE="$1"
echo ""
echo "🚀 Deploying PataBima Backend"
echo "============================="

# Stop services
echo ""
echo "⏸️  Stopping services..."
sudo systemctl stop patabima 2>/dev/null || echo "   (patabima not running)"
sudo systemctl stop nginx 2>/dev/null || echo "   (nginx not running)"

# Backup current deployment
echo ""
echo "💾 Backing up current deployment..."
if [ -d /var/www/patabima/insurance-app ]; then
    BACKUP="/var/www/patabima/backup-$(date +%Y%m%d-%H%M%S)"
    sudo cp -r /var/www/patabima/insurance-app "$BACKUP"
    echo "   ✅ Backup created: $BACKUP"
else
    echo "   (no previous deployment)"
fi

# Extract new code
echo ""
echo "📂 Extracting new deployment..."
sudo mkdir -p /var/www/patabima/insurance-app
sudo unzip -qo "/tmp/$ZIP_FILE" -d /var/www/patabima/insurance-app/
sudo chown -R ec2-user:ec2-user /var/www/patabima

# Install Python dependencies
echo ""
echo "📦 Installing dependencies..."
cd /var/www/patabima

if [ ! -d venv ]; then
    echo "   Creating virtual environment..."
    python3.11 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip > /dev/null
pip install -r insurance-app/requirements.txt > /dev/null
echo "   ✅ Dependencies installed"

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
cd insurance-app
python manage.py migrate --noinput

# Collect static files
echo ""
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear > /dev/null
echo "   ✅ Static files collected"

# Start services
echo ""
echo "▶️  Starting services..."
sudo systemctl daemon-reload
sudo systemctl start patabima
sudo systemctl start nginx

# Wait and check
sleep 3
echo ""
echo "✅ Service Status:"
echo "   Patabima: $(sudo systemctl is-active patabima)"
echo "   Nginx:    $(sudo systemctl is-active nginx)"

# Health check
echo ""
echo "🏥 Health check..."
sleep 2
if curl -sf http://localhost/api/v1/health/ > /dev/null; then
    echo "   ✅ API is responding!"
else
    echo "   ⚠️  API not responding yet (may need time to start)"
fi

# Cleanup
rm -f "/tmp/$ZIP_FILE"

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "🌐 API URL: http://44.200.182.180/api/v1/"
echo ""
DEPLOY_SCRIPT

chmod +x deploy-on-ec2.sh

# Test SSH connection
echo ""
echo "🔑 Testing SSH connection..."
if ! ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -i "$SSH_KEY" "ec2-user@$EC2_IP" "echo 'SSH OK'"; then
    echo "❌ SSH connection failed!"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check if EC2 security group allows SSH from CloudShell IP"
    echo "  2. Verify the SSH key is correct"
    echo "  3. Try: ssh -i $SSH_KEY ec2-user@$EC2_IP"
    exit 1
fi
echo "✅ SSH connection OK"

# Upload files
echo ""
echo "📤 Uploading deployment package..."
scp -o StrictHostKeyChecking=no -i "$SSH_KEY" "$ZIP_FILE" "ec2-user@$EC2_IP:/tmp/"
echo "✅ Package uploaded"

echo ""
echo "📤 Uploading deployment script..."
scp -o StrictHostKeyChecking=no -i "$SSH_KEY" deploy-on-ec2.sh "ec2-user@$EC2_IP:/tmp/"
echo "✅ Script uploaded"

# Execute deployment
echo ""
echo "🚀 Executing deployment on EC2..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "ec2-user@$EC2_IP" "bash /tmp/deploy-on-ec2.sh $ZIP_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo ""
echo "🌐 Your API endpoints:"
echo "   Health:     http://$EC2_IP/api/v1/health/"
echo "   Motor:      http://$EC2_IP/api/v1/motor2/categories/"
echo "   Admin:      http://$EC2_IP/admin/"
echo ""

# Cleanup CloudShell
rm -f "$ZIP_FILE" deploy-on-ec2.sh

echo "🎉 All done!"
echo ""

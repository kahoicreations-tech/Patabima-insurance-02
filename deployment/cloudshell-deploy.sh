#!/bin/bash
# Run this script in AWS CloudShell to deploy the latest backend

set -e

# Configuration
EC2_INSTANCE_ID="i-0d0f116005d812275"
EC2_IP="44.200.182.180"
S3_BUCKET="patabima-media-prod"
ZIP_FILE="patabima-backend-20251116-210558.zip"

echo ""
echo "🚀 PataBima Backend Deployment via CloudShell"
echo "=============================================="
echo ""

# Check if ZIP is in S3
echo "☁️  Checking S3..."
if aws s3 ls "s3://$S3_BUCKET/deployment/$ZIP_FILE" --region us-east-1 > /dev/null 2>&1; then
    echo "✅ Deployment package found in S3"
else
    echo "❌ Deployment package not found in S3!"
    echo "   Expected: s3://$S3_BUCKET/deployment/$ZIP_FILE"
    exit 1
fi

# Download to CloudShell
echo ""
echo "⬇️  Downloading deployment package to CloudShell..."
aws s3 cp "s3://$S3_BUCKET/deployment/$ZIP_FILE" ./ --region us-east-1

# Create deployment script
echo ""
echo "📝 Creating deployment script..."
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e

ZIP_FILE="$1"

echo ""
echo "🚀 PataBima Backend Deployment"
echo "=============================="

# Stop services
echo ""
echo "⏸️  Stopping services..."
sudo systemctl stop patabima 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true

# Backup current deployment
echo ""
echo "💾 Creating backup..."
if [ -d /var/www/patabima/insurance-app ]; then
    BACKUP_DIR="/var/www/patabima/insurance-app.backup.$(date +%Y%m%d_%H%M%S)"
    sudo mv /var/www/patabima/insurance-app "$BACKUP_DIR"
    echo "   Backed up to: $BACKUP_DIR"
fi

# Extract new deployment
echo ""
echo "📂 Extracting deployment..."
sudo mkdir -p /var/www/patabima/insurance-app
sudo unzip -qo "/tmp/$ZIP_FILE" -d /var/www/patabima/insurance-app/

# Set permissions
echo ""
echo "🔒 Setting permissions..."
sudo chown -R ec2-user:ec2-user /var/www/patabima
sudo chmod -R 755 /var/www/patabima

# Install dependencies
echo ""
echo "📦 Installing Python dependencies..."
cd /var/www/patabima

if [ ! -d venv ]; then
    echo "   Creating virtual environment..."
    python3.11 -m venv venv
fi

source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r insurance-app/requirements.txt

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
cd insurance-app
python manage.py migrate --noinput

# Collect static files
echo ""
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear

# Start services
echo ""
echo "▶️  Starting services..."
sudo systemctl start patabima
sudo systemctl start nginx

# Wait for services to start
sleep 3

# Check service status
echo ""
echo "✅ Service Status:"
PATABIMA_STATUS=$(sudo systemctl is-active patabima)
NGINX_STATUS=$(sudo systemctl is-active nginx)

echo "   Patabima: $PATABIMA_STATUS"
echo "   Nginx: $NGINX_STATUS"

# Health check
echo ""
echo "🏥 Running health check..."
sleep 2
HEALTH_RESPONSE=$(curl -s http://localhost/api/v1/health/)

if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "   ✅ Health check passed!"
    echo "   Response: $HEALTH_RESPONSE"
else
    echo "   ⚠️  Health check response: $HEALTH_RESPONSE"
fi

# Cleanup
echo ""
echo "🧹 Cleaning up..."
rm -f "/tmp/$ZIP_FILE"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your API is live at:"
echo "   http://44.200.182.180/api/v1/health/"
echo ""

EOF

chmod +x deploy.sh

# Check if EC2 instance is accessible
echo ""
echo "🔍 Checking EC2 instance..."
INSTANCE_STATE=$(aws ec2 describe-instances \
    --instance-ids "$EC2_INSTANCE_ID" \
    --region us-east-1 \
    --query 'Reservations[0].Instances[0].State.Name' \
    --output text)

echo "   Instance state: $INSTANCE_STATE"

if [ "$INSTANCE_STATE" != "running" ]; then
    echo "❌ EC2 instance is not running!"
    exit 1
fi

# Get SSH key from EC2
echo ""
echo "🔑 Retrieving SSH key..."
aws ec2 describe-key-pairs --key-names patabima-ec2-key --region us-east-1 > /dev/null 2>&1 || {
    echo "⚠️  SSH key 'patabima-ec2-key' not found. Using aws-eb instead..."
}

# Try to copy files to EC2
echo ""
echo "📤 Uploading deployment package to EC2..."
echo "   (If this fails, you may need to configure SSH key access)"

# Upload deployment package
scp -o StrictHostKeyChecking=no -i ~/.ssh/aws-eb "$ZIP_FILE" "ec2-user@$EC2_IP:/tmp/" || {
    echo ""
    echo "❌ SSH upload failed!"
    echo ""
    echo "💡 Alternative: Use AWS Session Manager (SSM)"
    echo "   Wait for SSM agent to be ready, then run:"
    echo "   aws ssm start-session --target $EC2_INSTANCE_ID"
    echo ""
    exit 1
}

# Upload deployment script
scp -o StrictHostKeyChecking=no -i ~/.ssh/aws-eb deploy.sh "ec2-user@$EC2_IP:/tmp/"

# Execute deployment
echo ""
echo "🚀 Executing deployment on EC2..."
echo "="*50

ssh -o StrictHostKeyChecking=no -i ~/.ssh/aws-eb "ec2-user@$EC2_IP" "chmod +x /tmp/deploy.sh && /tmp/deploy.sh $ZIP_FILE"

echo ""
echo "="*50
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo ""
echo "🌐 Your API is now live:"
echo "   Health: http://$EC2_IP/api/v1/health/"
echo "   Motor Categories: http://$EC2_IP/api/v1/motor2/categories/"
echo ""

# Cleanup CloudShell
echo "🧹 Cleaning up CloudShell..."
rm -f "$ZIP_FILE" deploy.sh

echo ""
echo "🎉 Deployment complete!"
echo ""

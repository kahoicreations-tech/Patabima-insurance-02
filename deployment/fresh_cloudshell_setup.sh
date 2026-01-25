#!/bin/bash
# Fresh Deployment Script for CloudShell
# This script sets up a fresh EC2 instance with PataBima backend

set -e

# Configuration
EC2_IP="44.210.245.82"
S3_BUCKET="patabima-media-prod"
SSH_KEY_PATH="$HOME/.ssh/aws-eb"

echo "🚀 PataBima Fresh Deployment"
echo "============================"
echo "Target EC2: $EC2_IP"
echo "S3 Bucket:  $S3_BUCKET"
echo ""

# 1. Check SSH Key
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "❌ SSH key not found at $SSH_KEY_PATH"
    echo "Please upload your 'aws-eb' private key to CloudShell."
    echo "1. Click Actions > Upload file"
    echo "2. Select your .pem file"
    echo "3. Run: mkdir -p ~/.ssh && mv ~/aws-eb ~/.ssh/aws-eb && chmod 400 ~/.ssh/aws-eb"
    exit 1
fi

# 2. Download artifacts from S3
echo "📥 Downloading deployment artifacts from S3..."
mkdir -p deploy_temp
cd deploy_temp

aws s3 cp s3://$S3_BUCKET/deployment/patabima-backend.zip .
aws s3 cp s3://$S3_BUCKET/deployment/ec2_setup.sh .
aws s3 cp s3://$S3_BUCKET/deployment/patabima.service .
aws s3 cp s3://$S3_BUCKET/deployment/patabima.conf .

# 3. Upload to EC2
echo "📤 Uploading files to EC2..."
scp -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ec2_setup.sh patabima.service patabima.conf patabima-backend.zip ec2-user@$EC2_IP:/tmp/

# 4. Execute Setup on EC2
echo "🔧 Executing setup on EC2..."
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" ec2-user@$EC2_IP << 'EOF'
    set -e
    
    # 1. Run System Setup
    echo "   Running system setup..."
    chmod +x /tmp/ec2_setup.sh
    /tmp/ec2_setup.sh

    # 2. Setup Nginx
    echo "   Configuring Nginx..."
    sudo mv /tmp/patabima.conf /etc/nginx/conf.d/
    sudo systemctl enable nginx
    sudo systemctl restart nginx

    # 3. Setup Systemd Service
    echo "   Configuring Systemd..."
    sudo mv /tmp/patabima.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable patabima

    # 4. Deploy Code
    echo "   Deploying code..."
    sudo mkdir -p /var/www/patabima/insurance-app
    sudo unzip -qo /tmp/patabima-backend.zip -d /var/www/patabima/insurance-app/
    sudo chown -R ec2-user:ec2-user /var/www/patabima

    # 5. Install Dependencies & Migrate
    echo "   Installing dependencies & migrating..."
    cd /var/www/patabima
    source venv/bin/activate
    pip install -r insurance-app/requirements.txt
    
    # Export env vars for migration (same as in service file)
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
    export DMVIC_BASE_URL="https://uat-api.dmvic.com"
    export DMVIC_MEMBER_CODE="PATABIMA"

    cd insurance-app
    python manage.py migrate --noinput
    python manage.py collectstatic --noinput

    # 6. Start Application
    echo "   Starting application..."
    sudo systemctl restart patabima
    
    echo "✅ Setup Complete on EC2!"
EOF

echo ""
echo "🎉 Deployment Finished!"
echo "API URL: http://$EC2_IP/api/v1/"

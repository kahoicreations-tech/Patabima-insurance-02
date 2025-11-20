#!/bin/bash
# Fix DMVIC Configuration on EC2
# Run this script to add DMVIC environment variables and upload certificate

set -e

echo "=== Fixing DMVIC Configuration on EC2 ==="

# EC2 Details
EC2_IP="44.200.182.180"
APP_DIR="/var/www/patabima"
SERVICE_FILE="/etc/systemd/system/patabima.service"

# DMVIC Configuration
DMVIC_ENABLED="true"
DMVIC_BASE_URL="https://uat-api.dmvic.com"
DMVIC_USERNAME="patabimaagencyapi@dmvic.info"
DMVIC_PASSWORD="6te224oIUP3l"
DMVIC_CLIENT_ID="097C69C262EF4350B89E6163E1CEB397"
DMVIC_MEMBER_CODE="PATABIMA"
DMVIC_PFX_PATH="dmvic_credentials/PatabimaAgencyUAT.pfx"
DMVIC_PASSPHRASE="UPfUvocVVOANLqPn"

echo "Step 1: Creating DMVIC credentials directory on EC2..."
ssh -i ~/.ssh/aws-eb ec2-user@$EC2_IP << 'EOF'
cd /var/www/patabima/insurance-app
sudo mkdir -p dmvic_credentials
sudo chown ec2-user:ec2-user dmvic_credentials
chmod 755 dmvic_credentials
EOF

echo "Step 2: Uploading PFX certificate..."
scp -i ~/.ssh/aws-eb \
  ../insurance-app/dmvic_credentials/PatabimaAgencyUAT.pfx \
  ec2-user@$EC2_IP:/var/www/patabima/insurance-app/dmvic_credentials/

echo "Step 3: Setting correct permissions..."
ssh -i ~/.ssh/aws-eb ec2-user@$EC2_IP << 'EOF'
cd /var/www/patabima/insurance-app/dmvic_credentials
chmod 600 PatabimaAgencyUAT.pfx
ls -la
EOF

echo "Step 4: Updating systemd service file with DMVIC environment variables..."
ssh -i ~/.ssh/aws-eb ec2-user@$EC2_IP << EOF
sudo tee -a $SERVICE_FILE > /dev/null << 'SERVICEEOF'

# DMVIC Integration
Environment="DMVIC_ENABLED=$DMVIC_ENABLED"
Environment="DMVIC_BASE_URL=$DMVIC_BASE_URL"
Environment="DMVIC_USERNAME=$DMVIC_USERNAME"
Environment="DMVIC_PASSWORD=$DMVIC_PASSWORD"
Environment="DMVIC_CLIENT_ID=$DMVIC_CLIENT_ID"
Environment="DMVIC_MEMBER_CODE=$DMVIC_MEMBER_CODE"
Environment="DMVIC_PFX_PATH=$DMVIC_PFX_PATH"
Environment="DMVIC_PASSPHRASE=$DMVIC_PASSPHRASE"
SERVICEEOF

echo "Updated service file:"
sudo cat $SERVICE_FILE
EOF

echo "Step 5: Reloading systemd and restarting service..."
ssh -i ~/.ssh/aws-eb ec2-user@$EC2_IP << 'EOF'
sudo systemctl daemon-reload
sudo systemctl restart patabima
sleep 3
sudo systemctl status patabima --no-pager
EOF

echo "Step 6: Testing DMVIC endpoint..."
sleep 2
curl -X POST http://$EC2_IP/api/insurance/dmvic/search-vehicle/ \
  -H "Content-Type: application/json" \
  -d '{"registration_number": "KDA123A"}' | jq .

echo ""
echo "=== DMVIC Configuration Complete! ==="
echo "API should now be working at: http://$EC2_IP/api/insurance/dmvic/search-vehicle/"

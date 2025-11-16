#!/bin/bash
# PataBima CloudShell Quick Deployment Script
# Run this script in AWS CloudShell to deploy the backend automatically

set -e  # Exit on error

echo "======================================"
echo "  PataBima Backend Deployment Script"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
EC2_INSTANCE_ID="i-07a424fd876416ad0"
EC2_PUBLIC_IP="44.210.245.82"
S3_BUCKET="patabima-media-prod"
SSH_KEY_NAME="aws-eb"
RDS_ENDPOINT="patabima-production-db.ca5qwoi4lxw.us-east-1.rds.amazonaws.com"

echo -e "${YELLOW}Step 1: Verifying AWS Account${NC}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✓ AWS Account: $ACCOUNT_ID"
echo ""

echo -e "${YELLOW}Step 2: Checking EC2 Instance Status${NC}"
INSTANCE_STATE=$(aws ec2 describe-instances \
  --instance-ids $EC2_INSTANCE_ID \
  --query 'Reservations[0].Instances[0].State.Name' \
  --output text)

if [ "$INSTANCE_STATE" != "running" ]; then
  echo -e "${RED}✗ EC2 instance is not running (Status: $INSTANCE_STATE)${NC}"
  echo "  Please start the instance first."
  exit 1
fi
echo "✓ EC2 Instance: $INSTANCE_STATE"
echo ""

echo -e "${YELLOW}Step 3: Checking RDS Database Status${NC}"
RDS_STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier patabima-production-db \
  --query 'DBInstances[0].DBInstanceStatus' \
  --output text)

if [ "$RDS_STATUS" != "available" ]; then
  echo -e "${RED}✗ RDS database is not available (Status: $RDS_STATUS)${NC}"
  echo "  Please wait for the database to become available."
  exit 1
fi
echo "✓ RDS Database: $RDS_STATUS"
echo ""

echo -e "${YELLOW}Step 4: Creating Deployment Workspace${NC}"
mkdir -p ~/patabima-deploy
cd ~/patabima-deploy
echo "✓ Workspace created: ~/patabima-deploy"
echo ""

echo -e "${YELLOW}Step 5: Downloading Deployment Files from S3${NC}"
aws s3 cp s3://$S3_BUCKET/deployment/ . --recursive
chmod +x *.sh 2>/dev/null || true
echo "✓ Files downloaded"
ls -lh
echo ""

echo -e "${YELLOW}Step 6: SSH Key Setup${NC}"
echo ""
echo -e "${RED}IMPORTANT: SSH Key Required!${NC}"
echo ""
echo "You need to provide the private key content for '$SSH_KEY_NAME'."
echo ""
echo "Option 1: If you have the key file locally, paste it when prompted"
echo "Option 2: Use EC2 Instance Connect instead (recommended for quick start)"
echo ""
read -p "Do you have the SSH private key? (y/n): " HAS_KEY

if [ "$HAS_KEY" = "y" ] || [ "$HAS_KEY" = "Y" ]; then
  mkdir -p ~/.ssh
  chmod 700 ~/.ssh
  
  echo ""
  echo "Please paste the ENTIRE private key content (including BEGIN/END lines)."
  echo "Press Ctrl+D when done:"
  cat > ~/.ssh/$SSH_KEY_NAME
  
  chmod 400 ~/.ssh/$SSH_KEY_NAME
  echo "✓ SSH key configured"
  
  # Test SSH connection
  echo ""
  echo -e "${YELLOW}Testing SSH connection...${NC}"
  if ssh -o StrictHostKeyChecking=no -i ~/.ssh/$SSH_KEY_NAME ec2-user@$EC2_PUBLIC_IP "echo 'SSH OK'" 2>/dev/null; then
    echo "✓ SSH connection successful"
    USE_SSH=true
  else
    echo -e "${RED}✗ SSH connection failed${NC}"
    echo "  Falling back to EC2 Instance Connect"
    USE_SSH=false
  fi
else
  echo "Using EC2 Instance Connect instead of SSH key"
  USE_SSH=false
fi
echo ""

if [ "$USE_SSH" = true ]; then
  echo -e "${GREEN}======================================${NC}"
  echo -e "${GREEN}  SSH Access Configured Successfully!${NC}"
  echo -e "${GREEN}======================================${NC}"
  echo ""
  echo "Next steps:"
  echo ""
  echo "1. Connect to EC2:"
  echo "   ssh -i ~/.ssh/$SSH_KEY_NAME ec2-user@$EC2_PUBLIC_IP"
  echo ""
  echo "2. Upload deployment files:"
  echo "   scp -i ~/.ssh/$SSH_KEY_NAME -r ~/patabima-deploy/* ec2-user@$EC2_PUBLIC_IP:~/deployment/"
  echo ""
  echo "3. Run setup script on EC2:"
  echo "   ssh -i ~/.ssh/$SSH_KEY_NAME ec2-user@$EC2_PUBLIC_IP"
  echo "   cd ~/deployment"
  echo "   sudo ./ec2_setup.sh"
  echo ""
  echo "4. Deploy application:"
  echo "   sudo ./deploy_to_ec2.sh"
  echo ""
else
  echo -e "${YELLOW}======================================${NC}"
  echo -e "${YELLOW}  Use EC2 Instance Connect${NC}"
  echo -e "${YELLOW}======================================${NC}"
  echo ""
  echo "To complete deployment using AWS Console:"
  echo ""
  echo "1. Go to EC2 Console: https://console.aws.amazon.com/ec2/"
  echo "2. Select instance: $EC2_INSTANCE_ID"
  echo "3. Click 'Connect' → 'EC2 Instance Connect'"
  echo "4. Click 'Connect' to open browser-based terminal"
  echo ""
  echo "5. In the EC2 terminal, run:"
  echo ""
  echo "   # Download deployment files"
  echo "   mkdir -p ~/deployment"
  echo "   cd ~/deployment"
  echo "   aws s3 cp s3://$S3_BUCKET/deployment/ . --recursive"
  echo ""
  echo "   # Run setup"
  echo "   chmod +x ec2_setup.sh deploy_to_ec2.sh"
  echo "   sudo ./ec2_setup.sh"
  echo ""
  echo "   # Deploy application"
  echo "   sudo ./deploy_to_ec2.sh"
  echo ""
fi

echo -e "${GREEN}CloudShell preparation complete!${NC}"
echo ""
echo "Deployment files location: ~/patabima-deploy"
echo "EC2 Instance: $EC2_PUBLIC_IP"
echo "RDS Endpoint: $RDS_ENDPOINT"
echo ""

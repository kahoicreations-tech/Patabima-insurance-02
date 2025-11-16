#!/bin/bash
# PataBima OTP Production Deployment Script
# Sets up AWS SNS, DynamoDB, and IAM for production OTP system

set -e  # Exit on error

echo "=========================================="
echo "PataBima OTP AWS Infrastructure Setup"
echo "=========================================="

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="804686432477"
DYNAMODB_TABLE="patabima-otp-tokens"
IAM_POLICY_NAME="PataBima-OTP-Policy"
EC2_ROLE_NAME=""  # Will be detected automatically

echo ""
echo "📋 Step 1: Creating DynamoDB Table for OTP Storage"
echo "---------------------------------------------------"

# Check if table already exists
if aws dynamodb describe-table --table-name $DYNAMODB_TABLE --region $AWS_REGION &>/dev/null; then
    echo "✅ DynamoDB table '$DYNAMODB_TABLE' already exists"
else
    echo "Creating DynamoDB table..."
    aws dynamodb create-table \
        --table-name $DYNAMODB_TABLE \
        --attribute-definitions \
            AttributeName=phone_number,AttributeType=S \
        --key-schema \
            AttributeName=phone_number,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region $AWS_REGION \
        --tags Key=Project,Value=PataBima Key=Environment,Value=Production

    echo "Waiting for table to be active..."
    aws dynamodb wait table-exists --table-name $DYNAMODB_TABLE --region $AWS_REGION
    
    echo "Enabling TTL for automatic OTP cleanup..."
    aws dynamodb update-time-to-live \
        --table-name $DYNAMODB_TABLE \
        --time-to-live-specification Enabled=true,AttributeName=expiry_time \
        --region $AWS_REGION

    echo "✅ DynamoDB table created successfully"
fi

echo ""
echo "📱 Step 2: Configuring AWS SNS for SMS"
echo "---------------------------------------"

echo "Setting SNS SMS attributes..."
aws sns set-sms-attributes \
    --attributes \
        DefaultSMSType=Transactional,\
        MonthlySpendLimit=500,\
        DeliveryStatusSuccessSamplingRate=100 \
    --region $AWS_REGION

echo "✅ SNS configured for transactional SMS (monthly limit: $500)"

echo ""
echo "Verifying SNS SMS configuration..."
aws sns get-sms-attributes --region $AWS_REGION

echo ""
echo "🔐 Step 3: Setting Up IAM Permissions"
echo "--------------------------------------"

# Check if policy already exists
POLICY_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${IAM_POLICY_NAME}"
if aws iam get-policy --policy-arn $POLICY_ARN &>/dev/null; then
    echo "✅ IAM policy '$IAM_POLICY_NAME' already exists"
else
    echo "Creating IAM policy from JSON file..."
    
    # Get the script directory to find the policy file
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    POLICY_FILE="${SCRIPT_DIR}/../aws-config/policies/patabima-otp-policy.json"
    
    if [ ! -f "$POLICY_FILE" ]; then
        echo "❌ Error: Policy file not found at $POLICY_FILE"
        exit 1
    fi
    
    aws iam create-policy \
        --policy-name $IAM_POLICY_NAME \
        --policy-document file://$POLICY_FILE \
        --description "Permissions for PataBima OTP service (SNS + DynamoDB)" \
        --tags Key=Project,Value=PataBima Key=Component,Value=OTP
    
    echo "✅ IAM policy created successfully"
fi

echo ""
echo "🖥️  Step 4: Detecting EC2 Instance Role"
echo "----------------------------------------"

# Get EC2 instance metadata to find the IAM role
echo "Detecting IAM role from EC2 instance metadata..."

# This command will only work if run from the EC2 instance
if command -v ec2-metadata &> /dev/null; then
    INSTANCE_ID=$(ec2-metadata --instance-id | cut -d " " -f 2)
    echo "Instance ID: $INSTANCE_ID"
    
    # Get IAM role from instance profile
    EC2_ROLE_NAME=$(aws ec2 describe-instances \
        --instance-ids $INSTANCE_ID \
        --region $AWS_REGION \
        --query 'Reservations[0].Instances[0].IamInstanceProfile.Arn' \
        --output text | cut -d '/' -f 2)
else
    echo "⚠️  Not running on EC2 instance. Please specify the EC2 role name manually."
    read -p "Enter EC2 IAM role name: " EC2_ROLE_NAME
fi

if [ -z "$EC2_ROLE_NAME" ]; then
    echo "❌ Error: Could not determine EC2 IAM role. Skipping role attachment."
    echo "   Please attach the policy manually:"
    echo "   aws iam attach-role-policy --role-name <YOUR_EC2_ROLE> --policy-arn $POLICY_ARN"
else
    echo "EC2 Role Name: $EC2_ROLE_NAME"
    
    echo ""
    echo "Attaching policy to EC2 role..."
    aws iam attach-role-policy \
        --role-name $EC2_ROLE_NAME \
        --policy-arn $POLICY_ARN || echo "⚠️  Policy may already be attached"
    
    echo "✅ IAM policy attached to EC2 role"
fi

echo ""
echo "✅ Step 5: Verifying Setup"
echo "-------------------------"

echo "Testing DynamoDB access..."
aws dynamodb describe-table --table-name $DYNAMODB_TABLE --region $AWS_REGION --query 'Table.[TableName,TableStatus,ItemCount]' --output table

echo ""
echo "Testing SNS SMS attributes..."
aws sns get-sms-attributes --region $AWS_REGION --query 'attributes.{SMSType:DefaultSMSType,SpendLimit:MonthlySpendLimit}' --output table

echo ""
echo "=========================================="
echo "✅ AWS Infrastructure Setup Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. SSH to EC2 instance: ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82"
echo "2. Update Django settings.py:"
echo "   ENABLE_SMS = True"
echo "   AWS_REGION = 'us-east-1'"
echo "   DYNAMODB_OTP_TABLE = 'patabima-otp-tokens'"
echo "3. Install boto3: pip install boto3==1.35.23"
echo "4. Restart Django: sudo systemctl restart patabima"
echo "5. Test with: python test_otp_endpoints.py"
echo ""
echo "Production Configuration:"
echo "- DynamoDB Table: $DYNAMODB_TABLE"
echo "- SNS SMS Type: Transactional"
echo "- Monthly SMS Limit: \$500"
echo "- IAM Policy: $IAM_POLICY_NAME"
echo "- EC2 Role: ${EC2_ROLE_NAME:-<MANUAL ATTACHMENT REQUIRED>}"
echo ""
echo "⚠️  IMPORTANT: Remember to set ENABLE_SMS=True in production!"
echo "=========================================="

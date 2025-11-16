# PataBima OTP Production Deployment Script (PowerShell)
# Sets up AWS SNS, DynamoDB, and IAM for production OTP system

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "PataBima OTP AWS Infrastructure Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Configuration
$AwsRegion = "us-east-1"
$AwsAccountId = "804686432477"
$DynamoDbTable = "patabima-otp-tokens"
$IamPolicyName = "PataBima-OTP-Policy"
$Ec2RoleName = ""  # Will be detected or provided

Write-Host ""
Write-Host "📋 Step 1: Creating DynamoDB Table for OTP Storage" -ForegroundColor Yellow
Write-Host "---------------------------------------------------"

# Check if table already exists
try {
    $tableCheck = aws dynamodb describe-table --table-name $DynamoDbTable --region $AwsRegion 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ DynamoDB table '$DynamoDbTable' already exists" -ForegroundColor Green
    }
}
catch {
    Write-Host "Creating DynamoDB table..." -ForegroundColor Yellow
    
    aws dynamodb create-table `
        --table-name $DynamoDbTable `
        --attribute-definitions AttributeName=phone_number, AttributeType=S `
        --key-schema AttributeName=phone_number, KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --region $AwsRegion `
        --tags Key=Project, Value=PataBima Key=Environment, Value=Production

    Write-Host "Waiting for table to be active..." -ForegroundColor Yellow
    aws dynamodb wait table-exists --table-name $DynamoDbTable --region $AwsRegion
    
    Write-Host "Enabling TTL for automatic OTP cleanup..." -ForegroundColor Yellow
    aws dynamodb update-time-to-live `
        --table-name $DynamoDbTable `
        --time-to-live-specification Enabled=true, AttributeName=expiry_time `
        --region $AwsRegion

    Write-Host "✅ DynamoDB table created successfully" -ForegroundColor Green
}

Write-Host ""
Write-Host "📱 Step 2: Configuring AWS SNS for SMS" -ForegroundColor Yellow
Write-Host "---------------------------------------"

Write-Host "Setting SNS SMS attributes..." -ForegroundColor Yellow
aws sns set-sms-attributes `
    --attributes DefaultSMSType=Transactional, MonthlySpendLimit=500, DeliveryStatusSuccessSamplingRate=100 `
    --region $AwsRegion

Write-Host "✅ SNS configured for transactional SMS (monthly limit: `$500)" -ForegroundColor Green

Write-Host ""
Write-Host "Verifying SNS SMS configuration..." -ForegroundColor Yellow
aws sns get-sms-attributes --region $AwsRegion

Write-Host ""
Write-Host "🔐 Step 3: Setting Up IAM Permissions" -ForegroundColor Yellow
Write-Host "--------------------------------------"

# Check if policy already exists
$PolicyArn = "arn:aws:iam::${AwsAccountId}:policy/${IamPolicyName}"
try {
    aws iam get-policy --policy-arn $PolicyArn 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ IAM policy '$IamPolicyName' already exists" -ForegroundColor Green
    }
}
catch {
    Write-Host "Creating IAM policy from JSON file..." -ForegroundColor Yellow
    
    # Get the script directory to find the policy file
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $PolicyFile = Join-Path $ScriptDir "..\aws-config\policies\patabima-otp-policy.json"
    
    if (-not (Test-Path $PolicyFile)) {
        Write-Host "❌ Error: Policy file not found at $PolicyFile" -ForegroundColor Red
        exit 1
    }
    
    aws iam create-policy `
        --policy-name $IamPolicyName `
        --policy-document "file://$PolicyFile" `
        --description "Permissions for PataBima OTP service (SNS + DynamoDB)" `
        --tags Key=Project, Value=PataBima Key=Component, Value=OTP
    
    Write-Host "✅ IAM policy created successfully" -ForegroundColor Green
}

Write-Host ""
Write-Host "🖥️  Step 4: Attaching Policy to EC2 Role" -ForegroundColor Yellow
Write-Host "----------------------------------------"

# Prompt for EC2 role name
Write-Host "⚠️  Please provide the EC2 IAM role name for your Django instance" -ForegroundColor Yellow
Write-Host "   (You can find this in EC2 Console → Instance → Security → IAM Role)"
$Ec2RoleName = Read-Host "Enter EC2 IAM role name (press Enter to skip)"

if ($Ec2RoleName) {
    Write-Host "EC2 Role Name: $Ec2RoleName" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "Attaching policy to EC2 role..." -ForegroundColor Yellow
    try {
        aws iam attach-role-policy `
            --role-name $Ec2RoleName `
            --policy-arn $PolicyArn
        Write-Host "✅ IAM policy attached to EC2 role" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠️  Policy may already be attached or role name is incorrect" -ForegroundColor Yellow
    }
}
else {
    Write-Host "⚠️  Skipping role attachment. Please attach manually:" -ForegroundColor Yellow
    Write-Host "   aws iam attach-role-policy --role-name <YOUR_EC2_ROLE> --policy-arn $PolicyArn" -ForegroundColor White
}

Write-Host ""
Write-Host "✅ Step 5: Verifying Setup" -ForegroundColor Yellow
Write-Host "-------------------------"

Write-Host "Testing DynamoDB access..." -ForegroundColor Yellow
aws dynamodb describe-table --table-name $DynamoDbTable --region $AwsRegion --query 'Table.[TableName,TableStatus,ItemCount]' --output table

Write-Host ""
Write-Host "Testing SNS SMS attributes..." -ForegroundColor Yellow
aws sns get-sms-attributes --region $AwsRegion --query 'attributes.{SMSType:DefaultSMSType,SpendLimit:MonthlySpendLimit}' --output table

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "✅ AWS Infrastructure Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. SSH to EC2 instance: ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82" -ForegroundColor White
Write-Host "2. Update Django settings.py:" -ForegroundColor White
Write-Host "   ENABLE_SMS = True" -ForegroundColor Yellow
Write-Host "   AWS_REGION = 'us-east-1'" -ForegroundColor Yellow
Write-Host "   DYNAMODB_OTP_TABLE = 'patabima-otp-tokens'" -ForegroundColor Yellow
Write-Host "3. Install boto3: pip install boto3==1.35.23" -ForegroundColor White
Write-Host "4. Restart Django: sudo systemctl restart patabima" -ForegroundColor White
Write-Host "5. Test with: python test_otp_endpoints.py" -ForegroundColor White
Write-Host ""
Write-Host "Production Configuration:" -ForegroundColor Cyan
Write-Host "- DynamoDB Table: $DynamoDbTable" -ForegroundColor White
Write-Host "- SNS SMS Type: Transactional" -ForegroundColor White
Write-Host "- Monthly SMS Limit: `$500" -ForegroundColor White
Write-Host "- IAM Policy: $IamPolicyName" -ForegroundColor White
Write-Host "- EC2 Role: $(if ($Ec2RoleName) { $Ec2RoleName } else { '<MANUAL ATTACHMENT REQUIRED>' })" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Remember to set ENABLE_SMS=True in production!" -ForegroundColor Red
Write-Host "==========================================" -ForegroundColor Green

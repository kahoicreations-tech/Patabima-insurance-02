# PataBima OTP Production Deployment Guide

## Overview

This guide provides step-by-step instructions to deploy the production AWS SNS OTP system for PataBima insurance app.

**Status**: Ready for production deployment  
**Last Updated**: 2025-01-XX  
**Author**: PataBima Development Team

---

## Prerequisites

✅ **Completed Development Phase:**

- [x] Backend OTP service created with AWS SNS integration
- [x] Frontend OTP screens (LoginScreen with 2-step flow)
- [x] Phone validation for Kenyan formats (0712345678, 254712345678)
- [x] Local testing with console logging complete
- [x] All 6 OTP endpoint tests passing

✅ **AWS Requirements:**

- [x] AWS Account: KAHOI-KREATIONS (804686432477)
- [x] AWS Region: us-east-1
- [x] EC2 instance running Django (44.210.245.82)
- [x] AWS CLI configured with appropriate credentials
- [x] IAM role attached to EC2 instance

✅ **Technical Requirements:**

- [x] boto3 Python library (version 1.35.23 or higher)
- [x] Django 4.2.16
- [x] PostgreSQL database
- [x] SSH access to EC2 instance

---

## Phase 1: AWS Infrastructure Setup (30 minutes)

### Step 1.1: Open AWS CloudShell

**Option A: AWS Console (Recommended)**

1. Log in to AWS Console: https://console.aws.amazon.com
2. Click the CloudShell icon (terminal icon in top navigation bar)
3. Wait for CloudShell to initialize (~30 seconds)
4. Verify region is set to `us-east-1` (top-right corner)

**Option B: SSH to EC2 Instance**

```powershell
# From your local machine
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82
```

### Step 1.2: Run Infrastructure Setup Script

**If using CloudShell (Recommended):**

```bash
# Download the setup script
curl -O https://raw.githubusercontent.com/YOUR_REPO/deployment/setup_otp_infrastructure.sh

# Make executable
chmod +x setup_otp_infrastructure.sh

# Run the script
./setup_otp_infrastructure.sh
```

**Manual Setup (if script fails):**

#### 1.2.1: Create DynamoDB Table

```bash
# Create OTP storage table with pay-per-request billing
aws dynamodb create-table \
    --table-name patabima-otp-tokens \
    --attribute-definitions AttributeName=phone_number,AttributeType=S \
    --key-schema AttributeName=phone_number,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1 \
    --tags Key=Project,Value=PataBima Key=Environment,Value=Production

# Wait for table to be active
aws dynamodb wait table-exists --table-name patabima-otp-tokens --region us-east-1

# Enable TTL for automatic OTP cleanup (expires after 5 minutes)
aws dynamodb update-time-to-live \
    --table-name patabima-otp-tokens \
    --time-to-live-specification Enabled=true,AttributeName=expiry_time \
    --region us-east-1

# Verify table created
aws dynamodb describe-table --table-name patabima-otp-tokens --region us-east-1
```

**Expected Output:**

```json
{
  "Table": {
    "TableName": "patabima-otp-tokens",
    "TableStatus": "ACTIVE",
    "ItemCount": 0,
    "BillingModeSummary": {
      "BillingMode": "PAY_PER_REQUEST"
    }
  }
}
```

#### 1.2.2: Configure AWS SNS for SMS

```bash
# Set SNS attributes for transactional SMS
aws sns set-sms-attributes \
    --attributes \
        DefaultSMSType=Transactional,\
        MonthlySpendLimit=500,\
        DeliveryStatusSuccessSamplingRate=100 \
    --region us-east-1

# Verify configuration
aws sns get-sms-attributes --region us-east-1
```

**Expected Output:**

```json
{
  "attributes": {
    "DefaultSMSType": "Transactional",
    "MonthlySpendLimit": "500",
    "DeliveryStatusSuccessSamplingRate": "100"
  }
}
```

**Cost Estimate:**

- Transactional SMS to Kenya: ~$0.06 per message
- 10,000 OTPs/month = ~$600/month
- Monthly limit set to $500 to prevent overspending

#### 1.2.3: Create IAM Policy for OTP Service

```bash
# Create policy JSON file
cat > /tmp/patabima-otp-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SNSSendSMS",
      "Effect": "Allow",
      "Action": [
        "sns:Publish",
        "sns:SetSMSAttributes",
        "sns:GetSMSAttributes"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "sns:Protocol": "sms"
        }
      }
    },
    {
      "Sid": "DynamoDBOTPAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:804686432477:table/patabima-otp-tokens"
    },
    {
      "Sid": "CloudWatchLogsAccess",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:804686432477:log-group:/aws/patabima/*"
    }
  ]
}
EOF

# Create the IAM policy
aws iam create-policy \
    --policy-name PataBima-OTP-Policy \
    --policy-document file:///tmp/patabima-otp-policy.json \
    --description "Permissions for PataBima OTP service (SNS + DynamoDB)" \
    --tags Key=Project,Value=PataBima Key=Component,Value=OTP

# Get policy ARN
POLICY_ARN=$(aws iam list-policies --query 'Policies[?PolicyName==`PataBima-OTP-Policy`].Arn' --output text)
echo "Policy ARN: $POLICY_ARN"
```

#### 1.2.4: Attach Policy to EC2 IAM Role

```bash
# Find your EC2 instance's IAM role
INSTANCE_ID="i-07a424fd876416ad0"  # Your EC2 instance ID
ROLE_NAME=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region us-east-1 \
    --query 'Reservations[0].Instances[0].IamInstanceProfile.Arn' \
    --output text | cut -d '/' -f 2)

echo "EC2 IAM Role: $ROLE_NAME"

# Attach policy to role
aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::804686432477:policy/PataBima-OTP-Policy

# Verify attachment
aws iam list-attached-role-policies --role-name $ROLE_NAME
```

**Expected Output:**

```json
{
  "AttachedPolicies": [
    {
      "PolicyName": "PataBima-OTP-Policy",
      "PolicyArn": "arn:aws:iam::804686432477:policy/PataBima-OTP-Policy"
    }
  ]
}
```

---

## Phase 2: Django Backend Deployment (20 minutes)

### Step 2.1: SSH to EC2 Instance

```powershell
# From your local machine (Windows PowerShell)
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82
```

### Step 2.2: Backup Current Code

```bash
# Navigate to Django project
cd /home/ec2-user/insurance-app

# Create backup
sudo cp app/services/otp_service.py app/services/otp_service.py.backup.$(date +%Y%m%d)
sudo cp insurance/settings.py insurance/settings.py.backup.$(date +%Y%m%d)

# List backups
ls -lh app/services/otp_service.py.backup* insurance/settings.py.backup*
```

### Step 2.3: Install boto3 (AWS SDK for Python)

```bash
# Activate virtual environment (if using one)
source .venv/bin/activate  # Adjust path if needed

# Install boto3
pip install boto3==1.35.23

# Verify installation
python -c "import boto3; print(f'boto3 version: {boto3.__version__}')"
```

**Expected Output:**

```
boto3 version: 1.35.23
```

### Step 2.4: Update Django Settings

```bash
# Edit settings.py
sudo nano insurance/settings.py
```

**Add these lines (should already be present from local development):**

```python
# ===== OTP CONFIGURATION =====
OTP_LENGTH = int(os.getenv('OTP_LENGTH', 6))
OTP_EXPIRY_MINUTES = int(os.getenv('OTP_EXPIRY_MINUTES', 5))
OTP_MAX_ATTEMPTS = int(os.getenv('OTP_MAX_ATTEMPTS', 3))
OTP_RATE_LIMIT_WINDOW = int(os.getenv('OTP_RATE_LIMIT_WINDOW', 5))
ENABLE_SMS = os.getenv('ENABLE_SMS', 'False').lower() == 'true'

# AWS OTP Configuration
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
DYNAMODB_OTP_TABLE = os.getenv('DYNAMODB_OTP_TABLE', 'patabima-otp-tokens')
```

### Step 2.5: Set Production Environment Variables

```bash
# Create environment file
sudo nano /etc/environment
```

**Add these lines:**

```bash
ENABLE_SMS=true
AWS_REGION=us-east-1
DYNAMODB_OTP_TABLE=patabima-otp-tokens
```

**OR set in systemd service file (Recommended):**

```bash
# Edit systemd service
sudo nano /etc/systemd/system/patabima.service
```

**Add environment variables in [Service] section:**

```ini
[Service]
Environment="ENABLE_SMS=true"
Environment="AWS_REGION=us-east-1"
Environment="DYNAMODB_OTP_TABLE=patabima-otp-tokens"
```

### Step 2.6: Deploy Updated OTP Service Code

The updated `otp_service.py` (with AWS SNS integration) should be deployed via git:

```bash
# Pull latest code from repository
cd /home/ec2-user/insurance-app
git pull origin main  # Or your production branch

# Verify OTP service has AWS SNS code
grep -A 5 "boto3" app/services/otp_service.py
```

**Expected to see:**

```python
import boto3
from botocore.exceptions import ClientError
```

### Step 2.7: Restart Django Application

```bash
# Reload systemd daemon (if you edited service file)
sudo systemctl daemon-reload

# Restart Django
sudo systemctl restart patabima

# Check status
sudo systemctl status patabima

# Check logs for any errors
sudo journalctl -u patabima -n 50 --no-pager
```

**Expected Output:**

```
● patabima.service - PataBima Django Application
   Loaded: loaded (/etc/systemd/system/patabima.service; enabled)
   Active: active (running) since...
```

---

## Phase 3: Testing & Validation (15 minutes)

### Step 3.1: Verify AWS SDK Integration

```bash
# SSH to EC2 (if not already)
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82

# Test AWS credentials and permissions
cd /home/ec2-user/insurance-app

# Test DynamoDB access
aws dynamodb describe-table --table-name patabima-otp-tokens --region us-east-1

# Test SNS SMS sending (dry run - no actual SMS sent)
aws sns publish \
    --phone-number "+254712345678" \
    --message "Test message from PataBima OTP service" \
    --message-attributes '{"AWS.SNS.SMS.SMSType":{"DataType":"String","StringValue":"Transactional"}}' \
    --region us-east-1 \
    --dry-run 2>&1 || echo "Dry run test completed"
```

### Step 3.2: Test OTP Endpoint with Real Phone Number

**Use the existing test script but with a REAL Kenyan phone number:**

```bash
# Edit test script to use your phone number
cd /home/ec2-user/insurance-app
nano test_otp_endpoints.py
```

**Update phone number in script:**

```python
# Replace test phone with your REAL Kenyan number
PHONE_NUMBER = "0712345678"  # Change to your actual number
```

**Run test:**

```bash
python test_otp_endpoints.py
```

**Expected Behavior:**

1. Script sends OTP request to backend
2. Backend uses AWS SNS to send SMS to your phone
3. You receive SMS on your actual phone: "Your PataBima verification code: 123456"
4. Script verifies OTP code
5. DynamoDB stores OTP record

**Check your phone for SMS!** 📱

### Step 3.3: Verify DynamoDB Storage

```bash
# Check DynamoDB for OTP records
aws dynamodb scan \
    --table-name patabima-otp-tokens \
    --region us-east-1 \
    --query 'Items[*].[phone_number.S, otp_code.S, purpose.S]' \
    --output table
```

**Expected Output:**

```
------------------------------------------
|               Scan                     |
+--------------+----------+------------+
|  0712345678  |  123456  |   LOGIN    |
+--------------+----------+------------+
```

### Step 3.4: Monitor CloudWatch Logs

```bash
# Check Django application logs
sudo journalctl -u patabima -f --no-pager | grep OTP

# Check for SNS delivery status
aws logs tail /aws/patabima/otp --follow --region us-east-1
```

**Expected Log Entries:**

```
INFO: ✅ SMS sent to +254712345678 via SNS (MessageId: 12345-abcde-67890)
INFO: ✅ OTP verified successfully for 0712345678 (LOGIN)
```

---

## Phase 4: Frontend Configuration (10 minutes)

### Step 4.1: Update Frontend Environment

**On your local development machine:**

```powershell
# Edit frontend .env file
cd C:\Users\USER\Desktop\PATABIMA01
notepad frontend\.env
```

**Ensure production API endpoint is set:**

```env
# Production EC2 endpoint
API_BASE_URL=http://44.210.245.82/api/insurance

# OR use domain if you have one
# API_BASE_URL=https://api.patabima.com/api/insurance
```

### Step 4.2: No Code Changes Required

The frontend code is already production-ready! It will automatically:

- Send OTP requests to production API
- NOT receive `otp_code` in response (security)
- Handle rate limiting errors
- Show countdown timer for resend

**Key Frontend Files (already complete):**

- ✅ `frontend/services/OTPService.js` - Production-ready
- ✅ `frontend/screens/auth/LoginScreen.js` - 2-step OTP flow
- ✅ `frontend/screens/auth/SignupScreen.js` - Phone validation

### Step 4.3: Build and Deploy Frontend

```powershell
# Build production Expo app
cd frontend
npm run build

# OR deploy via EAS (Expo Application Services)
eas build --platform android --profile production
eas build --platform ios --profile production
```

---

## Phase 5: Production Monitoring & Alerts (Optional but Recommended)

### Step 5.1: Create CloudWatch Alarms

```bash
# Alarm for high SMS spend (>$400/month)
aws cloudwatch put-metric-alarm \
    --alarm-name patabima-otp-sms-high-spend \
    --alarm-description "Alert when SMS spend exceeds $400" \
    --metric-name SMSMonthToDateSpentUSD \
    --namespace AWS/SNS \
    --statistic Sum \
    --period 86400 \
    --threshold 400 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1 \
    --region us-east-1

# Alarm for DynamoDB throttling
aws cloudwatch put-metric-alarm \
    --alarm-name patabima-otp-dynamodb-throttle \
    --alarm-description "Alert on DynamoDB throttling" \
    --metric-name UserErrors \
    --namespace AWS/DynamoDB \
    --statistic Sum \
    --period 300 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --dimensions Name=TableName,Value=patabima-otp-tokens \
    --region us-east-1
```

### Step 5.2: Setup SNS Email Notifications

```bash
# Create SNS topic for alerts
aws sns create-topic --name patabima-otp-alerts --region us-east-1

# Subscribe your email
aws sns subscribe \
    --topic-arn arn:aws:sns:us-east-1:804686432477:patabima-otp-alerts \
    --protocol email \
    --notification-endpoint your-email@example.com \
    --region us-east-1

# Confirm subscription via email link!
```

---

## Phase 6: Production Checklist

### ✅ Pre-Deployment Checklist

- [ ] AWS DynamoDB table created (`patabima-otp-tokens`)
- [ ] AWS SNS configured for transactional SMS
- [ ] IAM policy created and attached to EC2 role
- [ ] boto3 installed on EC2 instance
- [ ] Django settings.py updated with AWS config
- [ ] Environment variables set: `ENABLE_SMS=true`, `AWS_REGION=us-east-1`
- [ ] Django application restarted
- [ ] OTP endpoints tested with real phone number
- [ ] DynamoDB storage verified
- [ ] CloudWatch logs configured
- [ ] Frontend .env updated with production API endpoint

### ✅ Post-Deployment Verification

- [ ] Send OTP to real Kenyan number - SMS received ✅
- [ ] Verify OTP code - authentication successful ✅
- [ ] Test rate limiting - 3 OTPs within 5 min blocked ✅
- [ ] Test OTP expiry - code expires after 5 minutes ✅
- [ ] Test wrong OTP - rejected with error message ✅
- [ ] Check DynamoDB - OTP records visible ✅
- [ ] Check CloudWatch - logs show SMS delivery ✅
- [ ] Frontend login flow - complete without errors ✅
- [ ] Monitor AWS costs - SMS charges appearing ✅

### ✅ Security Checklist

- [ ] `ENABLE_SMS=False` on local development machines
- [ ] `otp_code` NOT returned in production API responses
- [ ] Rate limiting active (max 3 OTPs per 5 min per phone)
- [ ] OTP expiry enforced (5 minutes)
- [ ] Max attempts enforced (3 tries per OTP)
- [ ] DynamoDB TTL enabled (auto-cleanup after expiry)
- [ ] SNS monthly spend limit set ($500)
- [ ] CloudWatch alarms configured for overspending
- [ ] IAM policy follows least-privilege principle
- [ ] Phone validation prevents abuse (Kenyan numbers only)

---

## Rollback Procedure (If Issues Occur)

### Quick Rollback to Development Mode

```bash
# SSH to EC2
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82

# Disable SMS (revert to console logging)
sudo nano /etc/systemd/system/patabima.service

# Change ENABLE_SMS to false
Environment="ENABLE_SMS=false"

# Restart Django
sudo systemctl daemon-reload
sudo systemctl restart patabima

# Verify logs show console OTP codes
sudo journalctl -u patabima -n 20 | grep OTP
```

### Full Rollback to Backup

```bash
# Restore backup files
cd /home/ec2-user/insurance-app
sudo cp app/services/otp_service.py.backup.YYYYMMDD app/services/otp_service.py
sudo cp insurance/settings.py.backup.YYYYMMDD insurance/settings.py

# Restart Django
sudo systemctl restart patabima
```

---

## Cost Monitoring

### Expected AWS Costs (Monthly)

| Service                    | Usage               | Unit Cost     | Monthly Cost    |
| -------------------------- | ------------------- | ------------- | --------------- |
| SNS SMS (Kenya)            | 10,000 messages     | $0.06/msg     | **$600**        |
| DynamoDB (PAY_PER_REQUEST) | 50,000 reads/writes | $0.25/million | **$0.01**       |
| CloudWatch Logs            | 1 GB                | $0.50/GB      | **$0.50**       |
| **Total**                  |                     |               | **~$600/month** |

**Cost Optimization Tips:**

- Set SNS monthly spend limit ($500 recommended)
- Use DynamoDB TTL to auto-delete expired OTPs (saves storage)
- Monitor CloudWatch for unusual OTP request patterns (abuse detection)
- Consider SMS alternatives for high-volume scenarios (e.g., WhatsApp Business API)

---

## Troubleshooting

### Issue: "boto3 not found" Error

**Solution:**

```bash
# Ensure boto3 is installed in the correct Python environment
cd /home/ec2-user/insurance-app
source .venv/bin/activate  # Activate venv
pip install boto3==1.35.23
python -c "import boto3; print('boto3 OK')"
```

### Issue: "Access Denied" when sending SMS

**Solution:**

```bash
# Verify IAM role has correct policy
aws iam list-attached-role-policies --role-name YOUR_EC2_ROLE_NAME

# Should show PataBima-OTP-Policy
# If not, re-attach:
aws iam attach-role-policy \
    --role-name YOUR_EC2_ROLE_NAME \
    --policy-arn arn:aws:iam::804686432477:policy/PataBima-OTP-Policy
```

### Issue: SMS not received on phone

**Possible Causes:**

1. Phone number format incorrect (must be +254XXXXXXXXX for Kenya)
2. SNS monthly spend limit reached ($500)
3. AWS account in SMS sandbox mode (requires verification)

**Solution:**

```bash
# Check SNS spend
aws cloudwatch get-metric-statistics \
    --namespace AWS/SNS \
    --metric-name SMSMonthToDateSpentUSD \
    --dimensions Name=SMSType,Value=Transactional \
    --start-time $(date -u -d '1 month ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 86400 \
    --statistics Sum \
    --region us-east-1

# Check if in sandbox mode
aws sns get-sms-sandbox-account-status --region us-east-1

# If in sandbox, verify phone number first:
aws sns create-sms-sandbox-phone-number --phone-number +254712345678 --region us-east-1
```

### Issue: DynamoDB "Table does not exist"

**Solution:**

```bash
# Verify table exists
aws dynamodb list-tables --region us-east-1

# If missing, create it:
aws dynamodb create-table \
    --table-name patabima-otp-tokens \
    --attribute-definitions AttributeName=phone_number,AttributeType=S \
    --key-schema AttributeName=phone_number,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

---

## Support & Contact

**Issues or Questions?**

- Check CloudWatch Logs: `aws logs tail /aws/patabima/otp --follow`
- Check Django Logs: `sudo journalctl -u patabima -f`
- Review AWS SNS Console: https://console.aws.amazon.com/sns
- Review DynamoDB Console: https://console.aws.amazon.com/dynamodb

**Emergency Rollback:**
Set `ENABLE_SMS=false` and restart Django to revert to development mode.

---

## Summary

**What We Deployed:**

1. ✅ AWS DynamoDB table for OTP storage with TTL auto-cleanup
2. ✅ AWS SNS configured for transactional SMS to Kenya (+254)
3. ✅ IAM policy granting EC2 access to SNS and DynamoDB
4. ✅ Django OTP service with boto3 AWS SDK integration
5. ✅ Production environment variables (`ENABLE_SMS=true`)
6. ✅ Tested with real SMS delivery to Kenyan phone numbers

**What Changed:**

- **Development Mode**: OTP codes logged to console, no SMS sent
- **Production Mode**: OTP codes sent via AWS SNS SMS, stored in DynamoDB

**Next Steps:**

1. Monitor AWS costs for first month
2. Set up CloudWatch alarms for SMS overspending
3. Consider implementing CAPTCHA for signup (prevent abuse)
4. Plan for WhatsApp Business API integration (lower SMS costs)

---

**Deployment Status**: ✅ READY FOR PRODUCTION

**Date**: 2025-01-XX  
**Deployed By**: PataBima DevOps Team

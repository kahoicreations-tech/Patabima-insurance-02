# 🚀 PataBima OTP Production Deployment - Quick Reference

## ⏱️ Total Time: ~75 minutes

---

## 📋 Phase 1: AWS Infrastructure (30 min)

### Option A: Automated Setup (Recommended)

```powershell
# Windows PowerShell - Run deployment script
cd C:\Users\USER\Desktop\PATABIMA01\deployment
.\setup_otp_infrastructure.ps1
```

### Option B: Manual Setup (CloudShell)

```bash
# 1. DynamoDB Table
aws dynamodb create-table \
  --table-name patabima-otp-tokens \
  --attribute-definitions AttributeName=phone_number,AttributeType=S \
  --key-schema AttributeName=phone_number,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# 2. Enable TTL
aws dynamodb update-time-to-live \
  --table-name patabima-otp-tokens \
  --time-to-live-specification Enabled=true,AttributeName=expiry_time \
  --region us-east-1

# 3. Configure SNS
aws sns set-sms-attributes \
  --attributes DefaultSMSType=Transactional,MonthlySpendLimit=500 \
  --region us-east-1

# 4. Create IAM Policy
aws iam create-policy \
  --policy-name PataBima-OTP-Policy \
  --policy-document file://aws-config/policies/patabima-otp-policy.json

# 5. Attach to EC2 Role (replace YOUR_EC2_ROLE_NAME)
aws iam attach-role-policy \
  --role-name YOUR_EC2_ROLE_NAME \
  --policy-arn arn:aws:iam::804686432477:policy/PataBima-OTP-Policy
```

---

## 🖥️ Phase 2: Django Backend (20 min)

```bash
# SSH to EC2
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82

# Backup current code
cd /home/ec2-user/insurance-app
sudo cp app/services/otp_service.py app/services/otp_service.py.backup.$(date +%Y%m%d)

# Install boto3
source .venv/bin/activate
pip install boto3==1.35.23

# Pull latest code (with AWS SNS integration)
git pull origin main

# Set environment variables
sudo nano /etc/systemd/system/patabima.service

# Add these lines in [Service] section:
Environment="ENABLE_SMS=true"
Environment="AWS_REGION=us-east-1"
Environment="DYNAMODB_OTP_TABLE=patabima-otp-tokens"

# Restart Django
sudo systemctl daemon-reload
sudo systemctl restart patabima
sudo systemctl status patabima
```

---

## ✅ Phase 3: Testing (15 min)

```bash
# Test DynamoDB access
aws dynamodb describe-table --table-name patabima-otp-tokens --region us-east-1

# Test OTP with YOUR REAL PHONE NUMBER
cd /home/ec2-user/insurance-app
nano test_otp_endpoints.py  # Change PHONE_NUMBER to your number
python test_otp_endpoints.py

# Check your phone for SMS! 📱

# Verify DynamoDB storage
aws dynamodb scan --table-name patabima-otp-tokens --region us-east-1

# Check logs
sudo journalctl -u patabima -n 50 | grep OTP
```

---

## 📱 Phase 4: Frontend (10 min)

```powershell
# Update .env on local machine
cd C:\Users\USER\Desktop\PATABIMA01\frontend
notepad .env

# Ensure production endpoint:
API_BASE_URL=http://44.210.245.82/api/insurance

# No code changes needed - already production-ready!
```

---

## 🔧 Quick Troubleshooting

### SMS Not Received?

```bash
# Check SNS spend limit
aws sns get-sms-attributes --region us-east-1

# Check Django logs
sudo journalctl -u patabima -f | grep OTP

# Check DynamoDB
aws dynamodb scan --table-name patabima-otp-tokens --region us-east-1
```

### boto3 Not Found?

```bash
cd /home/ec2-user/insurance-app
source .venv/bin/activate
pip install boto3==1.35.23
sudo systemctl restart patabima
```

### Access Denied?

```bash
# Verify IAM policy attached
aws iam list-attached-role-policies --role-name YOUR_EC2_ROLE_NAME

# Should show: PataBima-OTP-Policy
```

---

## 🚨 Emergency Rollback

```bash
# Disable SMS (revert to console logging)
sudo nano /etc/systemd/system/patabima.service

# Change to:
Environment="ENABLE_SMS=false"

# Restart
sudo systemctl daemon-reload
sudo systemctl restart patabima
```

---

## 💰 Cost Estimate

| Service                        | Monthly Cost    |
| ------------------------------ | --------------- |
| SNS SMS (10k messages @ $0.06) | $600            |
| DynamoDB (PAY_PER_REQUEST)     | $0.01           |
| CloudWatch Logs                | $0.50           |
| **Total**                      | **~$600/month** |

**Limit set**: $500/month to prevent overspending

---

## ✅ Deployment Checklist

### AWS Infrastructure

- [ ] DynamoDB table created: `patabima-otp-tokens`
- [ ] SNS configured: Transactional, $500 limit
- [ ] IAM policy: `PataBima-OTP-Policy` attached

### Django Backend

- [ ] boto3 installed
- [ ] `ENABLE_SMS=true` set
- [ ] Code deployed with AWS SNS integration
- [ ] Django restarted successfully

### Testing

- [ ] Send OTP to real phone - SMS received ✅
- [ ] Verify OTP code - authentication successful ✅
- [ ] DynamoDB storage verified ✅
- [ ] CloudWatch logs show SMS delivery ✅

### Security

- [ ] Rate limiting active (3 OTPs / 5 min)
- [ ] OTP expiry enforced (5 minutes)
- [ ] `otp_code` NOT in production API responses
- [ ] SNS spend limit set

---

## 📚 Full Documentation

**See**: `docs/PRODUCTION_OTP_DEPLOYMENT.md` for complete step-by-step guide

**AWS Resources**:

- DynamoDB Console: https://console.aws.amazon.com/dynamodb
- SNS Console: https://console.aws.amazon.com/sns
- CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logs

---

**Status**: ✅ READY FOR PRODUCTION  
**Updated**: 2025-01-XX  
**Region**: us-east-1  
**Account**: KAHOI-KREATIONS (804686432477)

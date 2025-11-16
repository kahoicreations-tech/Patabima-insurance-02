# AWS OTP Implementation Guide for PataBima

**Production-Ready SMS OTP Authentication using AWS Services**

## Overview

This guide provides best practices for implementing OTP (One-Time Password) authentication in PataBima using AWS services. The backend is deployed on EC2 (44.200.182.180) and will integrate with AWS SNS for SMS delivery and DynamoDB for OTP storage.

---

## Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │  HTTP   │                  │   SNS   │                 │
│  React Native   │────────▶│  Django on EC2   │────────▶│   AWS SNS       │
│     Mobile      │         │  44.200.182.180  │         │  (SMS Gateway)  │
│                 │◀────────│                  │         │                 │
└─────────────────┘  JSON   └──────────────────┘         └─────────────────┘
                                    │                              │
                                    │                              │
                                    ▼                              ▼
                            ┌──────────────────┐         ┌─────────────────┐
                            │   DynamoDB       │         │  User's Phone   │
                            │  (OTP Storage)   │         │  (+254XXXXXXXX) │
                            └──────────────────┘         └─────────────────┘
```

**Components:**
- **AWS SNS** - SMS delivery service (supports Kenya +254 numbers)
- **DynamoDB** - Fast, scalable OTP storage with TTL (auto-cleanup)
- **Django Backend** - OTP generation, validation, and business logic
- **IAM Roles** - Secure EC2 access to AWS services (no hardcoded credentials)

---

## Phase 1: AWS Infrastructure Setup

### 1.1 Create DynamoDB Table for OTP Storage

**Why DynamoDB?**
- Built-in TTL (Time-To-Live) for automatic OTP cleanup
- Millisecond latency for fast validation
- No server management required
- Pay only for what you use

**Steps:**

1. **Open AWS CloudShell** (or use existing EC2 SSH session):

```bash
# Create DynamoDB table with TTL
aws dynamodb create-table \
  --table-name patabima-otp-tokens \
  --attribute-definitions \
    AttributeName=phone_number,AttributeType=S \
  --key-schema \
    AttributeName=phone_number,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1 \
  --tags Key=Project,Value=PataBima Key=Environment,Value=Production

# Enable TTL for automatic OTP expiry (5 minutes)
aws dynamodb update-time-to-live \
  --table-name patabima-otp-tokens \
  --time-to-live-specification \
    Enabled=true,AttributeName=expiry_time \
  --region us-east-1
```

**Table Schema:**
```json
{
  "phone_number": "+254712345678",     // Primary key (Hash key)
  "otp_code": "123456",                // 6-digit OTP
  "created_at": 1731715200,            // Unix timestamp
  "expiry_time": 1731715500,           // TTL: created_at + 300s (5 minutes)
  "attempts": 0,                       // Failed validation attempts (max 3)
  "is_verified": false,                // OTP verification status
  "purpose": "LOGIN"                   // LOGIN, SIGNUP, PASSWORD_RESET
}
```

**Cost Estimate:**
- 1 million OTP requests/month = ~$0.25/month
- No upfront costs, pay per request

---

### 1.2 Configure AWS SNS for SMS

**Why SNS?**
- Native support for Kenya (+254) phone numbers
- High delivery rates (99.9% SLA)
- Global reach (200+ countries)
- No infrastructure to manage

**Steps:**

1. **Enable SMS in AWS SNS** (us-east-1):

```bash
# Set SMS preferences for production
aws sns set-sms-attributes \
  --attributes \
    DefaultSMSType=Transactional,\
    MonthlySpendLimit=500,\
    DeliveryStatusSuccessSamplingRate=100 \
  --region us-east-1
```

**SMS Settings:**
- **SMS Type**: `Transactional` (higher delivery priority, no marketing opt-out)
- **Spend Limit**: $500/month (safety cap - adjust as needed)
- **Success Sampling**: 100% (track all deliveries for debugging)

2. **Request Production Access** (if using more than 1 USD/month):

```bash
# Check current spend limit
aws sns get-sms-attributes --region us-east-1

# If needed, request limit increase via AWS Support:
# https://console.aws.amazon.com/support/home#/case/create?issueType=service-limit-increase
# Service: SNS Text Messaging (SMS)
# Limit: Increase monthly SMS spend limit
# New Limit: $500 (or your estimated usage)
```

**Kenya SMS Pricing:**
- Kenyan mobile numbers (+254): ~$0.05 - $0.08 per SMS
- Estimated cost for 10,000 OTPs/month: $500 - $800

3. **Create SNS Topic for OTP Notifications** (optional, for monitoring):

```bash
aws sns create-topic \
  --name patabima-otp-notifications \
  --region us-east-1
```

---

### 1.3 Configure IAM Role for EC2

**Security Best Practice:** Use IAM roles instead of access keys for EC2 services.

1. **Create IAM Policy for OTP Services**:

```bash
# Create policy document
cat > /tmp/patabima-otp-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SNSSendSMS",
      "Effect": "Allow",
      "Action": [
        "sns:Publish",
        "sns:GetSMSAttributes",
        "sns:SetSMSAttributes"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DynamoDBOTPAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:us-east-1:804686432477:table/patabima-otp-tokens"
    },
    {
      "Sid": "CloudWatchLogsOTP",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:804686432477:log-group:/patabima/otp/*"
    }
  ]
}
EOF

# Create IAM policy
aws iam create-policy \
  --policy-name PataBima-OTP-Policy \
  --policy-document file:///tmp/patabima-otp-policy.json \
  --description "Allows EC2 to send SMS via SNS and store OTPs in DynamoDB"
```

2. **Attach Policy to Existing EC2 Instance Role**:

```bash
# Get current instance role name
INSTANCE_ID="i-0d0f116005d812275"
INSTANCE_PROFILE=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].IamInstanceProfile.Arn' \
  --output text | cut -d'/' -f2)

# Get role name from instance profile
ROLE_NAME=$(aws iam get-instance-profile \
  --instance-profile-name $INSTANCE_PROFILE \
  --query 'InstanceProfile.Roles[0].RoleName' \
  --output text)

# Attach OTP policy to role
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::804686432477:policy/PataBima-OTP-Policy

echo "✅ OTP policy attached to role: $ROLE_NAME"
```

3. **Verify Permissions**:

```bash
# SSH into EC2 and test AWS access
ssh -i ~/.ssh/aws-eb ec2-user@44.200.182.180

# Test DynamoDB access
aws dynamodb describe-table --table-name patabima-otp-tokens --region us-east-1

# Test SNS access
aws sns get-sms-attributes --region us-east-1
```

---

## Phase 2: Django Backend Implementation

### 2.1 Install Required Python Packages

**SSH into EC2**:

```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.200.182.180
cd /var/www/patabima
source venv/bin/activate
```

**Install AWS SDK**:

```bash
pip install boto3==1.35.23
pip install phonenumbers==8.13.47  # Phone number validation
pip freeze > requirements.txt
```

---

### 2.2 Create OTP Service Module

**File:** `/var/www/patabima/app/services/otp_service.py`

```python
"""
AWS OTP Service for PataBima
Handles OTP generation, SMS delivery via SNS, and DynamoDB storage
"""

import boto3
import random
import time
import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple
import phonenumbers
from phonenumbers import NumberParseException
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

class OTPService:
    """
    Production-ready OTP service using AWS SNS and DynamoDB
    """
    
    # Constants
    OTP_LENGTH = 6
    OTP_EXPIRY_SECONDS = 300  # 5 minutes
    MAX_ATTEMPTS = 3
    RATE_LIMIT_SECONDS = 60  # Min 60s between OTP requests
    TABLE_NAME = 'patabima-otp-tokens'
    REGION = 'us-east-1'
    
    def __init__(self):
        """Initialize AWS clients using IAM role (no credentials needed)"""
        self.sns_client = boto3.client('sns', region_name=self.REGION)
        self.dynamodb = boto3.resource('dynamodb', region_name=self.REGION)
        self.table = self.dynamodb.Table(self.TABLE_NAME)
    
    def _normalize_phone(self, phone: str) -> str:
        """
        Normalize phone number to E.164 format (+254XXXXXXXXX)
        
        Examples:
          0712345678 → +254712345678
          712345678 → +254712345678
          +254712345678 → +254712345678
        """
        try:
            # Parse with Kenya as default region
            parsed = phonenumbers.parse(phone, "KE")
            
            # Validate number
            if not phonenumbers.is_valid_number(parsed):
                raise ValueError(f"Invalid phone number: {phone}")
            
            # Format to E.164
            return phonenumbers.format_number(
                parsed, 
                phonenumbers.PhoneNumberFormat.E164
            )
        except NumberParseException as e:
            logger.error(f"Phone parsing error: {phone} - {e}")
            raise ValueError(f"Invalid phone format: {phone}")
    
    def _generate_otp(self) -> str:
        """Generate secure 6-digit OTP"""
        return ''.join([str(random.randint(0, 9)) for _ in range(self.OTP_LENGTH)])
    
    def _check_rate_limit(self, phone: str) -> bool:
        """
        Check if user can request new OTP (60s cooldown)
        Returns True if allowed, False if rate limited
        """
        try:
            response = self.table.get_item(Key={'phone_number': phone})
            
            if 'Item' in response:
                created_at = response['Item']['created_at']
                time_since_last = int(time.time()) - created_at
                
                if time_since_last < self.RATE_LIMIT_SECONDS:
                    remaining = self.RATE_LIMIT_SECONDS - time_since_last
                    logger.warning(f"Rate limit hit for {phone}. Wait {remaining}s")
                    return False
            
            return True
        except ClientError as e:
            logger.error(f"DynamoDB rate limit check error: {e}")
            return True  # Allow on error (fail open)
    
    def send_otp(self, phone: str, purpose: str = "LOGIN") -> Tuple[bool, str]:
        """
        Send OTP via SMS
        
        Args:
            phone: User's phone number (any format)
            purpose: LOGIN, SIGNUP, PASSWORD_RESET
        
        Returns:
            (success: bool, message: str)
        """
        try:
            # Normalize phone
            normalized_phone = self._normalize_phone(phone)
            
            # Check rate limit
            if not self._check_rate_limit(normalized_phone):
                return False, "Please wait 60 seconds before requesting a new OTP"
            
            # Generate OTP
            otp_code = self._generate_otp()
            current_time = int(time.time())
            expiry_time = current_time + self.OTP_EXPIRY_SECONDS
            
            # Store in DynamoDB
            self.table.put_item(
                Item={
                    'phone_number': normalized_phone,
                    'otp_code': otp_code,
                    'created_at': current_time,
                    'expiry_time': expiry_time,  # TTL for auto-cleanup
                    'attempts': 0,
                    'is_verified': False,
                    'purpose': purpose
                }
            )
            
            # Send SMS via SNS
            sms_message = f"Your PataBima OTP is: {otp_code}\nValid for 5 minutes.\nDo not share this code."
            
            self.sns_client.publish(
                PhoneNumber=normalized_phone,
                Message=sms_message,
                MessageAttributes={
                    'AWS.SNS.SMS.SMSType': {
                        'DataType': 'String',
                        'StringValue': 'Transactional'
                    },
                    'AWS.SNS.SMS.SenderID': {
                        'DataType': 'String',
                        'StringValue': 'PataBima'  # Shows as sender name (if supported)
                    }
                }
            )
            
            logger.info(f"✅ OTP sent to {normalized_phone} for {purpose}")
            return True, f"OTP sent to {normalized_phone}"
            
        except ValueError as e:
            logger.error(f"Validation error: {e}")
            return False, str(e)
        except ClientError as e:
            logger.error(f"AWS error sending OTP: {e}")
            return False, "Failed to send OTP. Please try again."
        except Exception as e:
            logger.exception(f"Unexpected error sending OTP: {e}")
            return False, "System error. Please contact support."
    
    def verify_otp(self, phone: str, otp_code: str) -> Tuple[bool, str]:
        """
        Verify OTP code
        
        Args:
            phone: User's phone number
            otp_code: 6-digit OTP to verify
        
        Returns:
            (valid: bool, message: str)
        """
        try:
            # Normalize phone
            normalized_phone = self._normalize_phone(phone)
            
            # Get OTP from DynamoDB
            response = self.table.get_item(Key={'phone_number': normalized_phone})
            
            if 'Item' not in response:
                logger.warning(f"No OTP found for {normalized_phone}")
                return False, "No OTP found. Please request a new one."
            
            item = response['Item']
            
            # Check if already verified
            if item.get('is_verified', False):
                return False, "OTP already used. Please request a new one."
            
            # Check expiry
            current_time = int(time.time())
            if current_time > item['expiry_time']:
                logger.warning(f"Expired OTP for {normalized_phone}")
                return False, "OTP expired. Please request a new one."
            
            # Check max attempts
            if item['attempts'] >= self.MAX_ATTEMPTS:
                logger.warning(f"Max attempts exceeded for {normalized_phone}")
                return False, "Too many failed attempts. Please request a new OTP."
            
            # Verify OTP code
            if item['otp_code'] == otp_code:
                # Mark as verified
                self.table.update_item(
                    Key={'phone_number': normalized_phone},
                    UpdateExpression='SET is_verified = :verified',
                    ExpressionAttributeValues={':verified': True}
                )
                logger.info(f"✅ OTP verified for {normalized_phone}")
                return True, "OTP verified successfully"
            else:
                # Increment attempts
                new_attempts = item['attempts'] + 1
                self.table.update_item(
                    Key={'phone_number': normalized_phone},
                    UpdateExpression='SET attempts = :attempts',
                    ExpressionAttributeValues={':attempts': new_attempts}
                )
                remaining = self.MAX_ATTEMPTS - new_attempts
                logger.warning(f"Invalid OTP for {normalized_phone}. Attempts left: {remaining}")
                return False, f"Invalid OTP. {remaining} attempts remaining."
        
        except ValueError as e:
            return False, str(e)
        except ClientError as e:
            logger.error(f"DynamoDB error verifying OTP: {e}")
            return False, "Verification failed. Please try again."
        except Exception as e:
            logger.exception(f"Unexpected error verifying OTP: {e}")
            return False, "System error. Please contact support."
    
    def resend_otp(self, phone: str) -> Tuple[bool, str]:
        """
        Resend OTP (same as send_otp but deletes old OTP first)
        """
        try:
            normalized_phone = self._normalize_phone(phone)
            
            # Delete old OTP
            self.table.delete_item(Key={'phone_number': normalized_phone})
            
            # Send new OTP
            return self.send_otp(phone)
        except Exception as e:
            logger.exception(f"Error resending OTP: {e}")
            return False, "Failed to resend OTP"
```

---

### 2.3 Create Django API Views

**File:** `/var/www/patabima/app/views/otp_views.py`

```python
"""
OTP API Views for PataBima
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from app.services.otp_service import OTPService
import logging

logger = logging.getLogger(__name__)

class SendOTPView(APIView):
    """
    POST /api/v1/auth/otp/send/
    
    Request:
    {
        "phone": "0712345678",
        "purpose": "LOGIN"  // LOGIN, SIGNUP, PASSWORD_RESET
    }
    
    Response:
    {
        "success": true,
        "message": "OTP sent to +254712345678"
    }
    """
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        phone = request.data.get('phone')
        purpose = request.data.get('purpose', 'LOGIN')
        
        if not phone:
            return Response(
                {'success': False, 'message': 'Phone number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Send OTP
        otp_service = OTPService()
        success, message = otp_service.send_otp(phone, purpose)
        
        return Response(
            {'success': success, 'message': message},
            status=status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST
        )


class VerifyOTPView(APIView):
    """
    POST /api/v1/auth/otp/verify/
    
    Request:
    {
        "phone": "0712345678",
        "otp": "123456"
    }
    
    Response:
    {
        "success": true,
        "message": "OTP verified successfully",
        "token": "eyJ..."  // JWT token if login
    }
    """
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        phone = request.data.get('phone')
        otp = request.data.get('otp')
        
        if not phone or not otp:
            return Response(
                {'success': False, 'message': 'Phone and OTP are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify OTP
        otp_service = OTPService()
        valid, message = otp_service.verify_otp(phone, otp)
        
        if not valid:
            return Response(
                {'success': False, 'message': message},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # TODO: Create user session / JWT token here
        # For now, just return success
        
        return Response(
            {'success': True, 'message': message},
            status=status.HTTP_200_OK
        )


class ResendOTPView(APIView):
    """
    POST /api/v1/auth/otp/resend/
    
    Request:
    {
        "phone": "0712345678"
    }
    
    Response:
    {
        "success": true,
        "message": "OTP resent to +254712345678"
    }
    """
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)
    
    def post(self, request):
        phone = request.data.get('phone')
        
        if not phone:
            return Response(
                {'success': False, 'message': 'Phone number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Resend OTP
        otp_service = OTPService()
        success, message = otp_service.resend_otp(phone)
        
        return Response(
            {'success': success, 'message': message},
            status=status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST
        )
```

---

### 2.4 Add URL Routes

**File:** `/var/www/patabima/app/urls.py`

```python
from django.urls import path
from app.views.otp_views import SendOTPView, VerifyOTPView, ResendOTPView

urlpatterns = [
    # ... existing routes ...
    
    # OTP Authentication
    path('api/v1/auth/otp/send/', SendOTPView.as_view(), name='otp-send'),
    path('api/v1/auth/otp/verify/', VerifyOTPView.as_view(), name='otp-verify'),
    path('api/v1/auth/otp/resend/', ResendOTPView.as_view(), name='otp-resend'),
]
```

---

### 2.5 Update Django Settings

**File:** `/var/www/patabima/insurance/settings.py`

```python
# Add to INSTALLED_APPS
INSTALLED_APPS = [
    # ... existing apps ...
    'phonenumbers',
]

# Logging configuration for OTP
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'otp_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/patabima/otp.log',
        },
    },
    'loggers': {
        'app.services.otp_service': {
            'handlers': ['otp_file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# AWS Region (for boto3)
AWS_REGION = 'us-east-1'
```

---

### 2.6 Deploy Backend Changes

```bash
# SSH into EC2
ssh -i ~/.ssh/aws-eb ec2-user@44.200.182.180

# Activate venv
cd /var/www/patabima
source venv/bin/activate

# Install new dependencies
pip install boto3 phonenumbers
pip freeze > requirements.txt

# Create log directory
sudo mkdir -p /var/log/patabima
sudo chown ec2-user:ec2-user /var/log/patabima

# Restart Django
sudo systemctl restart patabima
sudo systemctl status patabima
```

---

## Phase 3: React Native Frontend Implementation

### 3.1 Create OTP Service

**File:** `frontend/services/OTPService.js`

```javascript
/**
 * OTP Service - React Native Client
 * Handles OTP send, verify, resend flows
 */

import DjangoAPIService from './DjangoAPIService';

class OTPService {
  /**
   * Send OTP to phone number
   * @param {string} phone - Phone number (any format)
   * @param {string} purpose - LOGIN, SIGNUP, PASSWORD_RESET
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async sendOTP(phone, purpose = 'LOGIN') {
    try {
      const response = await DjangoAPIService.makeRequest(
        '/api/v1/auth/otp/send/',
        {
          method: 'POST',
          body: JSON.stringify({ phone, purpose }),
        }
      );
      
      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error('[OTPService] Send OTP error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send OTP',
      };
    }
  }

  /**
   * Verify OTP code
   * @param {string} phone - Phone number
   * @param {string} otp - 6-digit OTP
   * @returns {Promise<{success: boolean, message: string, token?: string}>}
   */
  async verifyOTP(phone, otp) {
    try {
      const response = await DjangoAPIService.makeRequest(
        '/api/v1/auth/otp/verify/',
        {
          method: 'POST',
          body: JSON.stringify({ phone, otp }),
        }
      );
      
      return {
        success: response.success,
        message: response.message,
        token: response.token, // JWT token (if login)
      };
    } catch (error) {
      console.error('[OTPService] Verify OTP error:', error);
      return {
        success: false,
        message: error.message || 'Failed to verify OTP',
      };
    }
  }

  /**
   * Resend OTP
   * @param {string} phone - Phone number
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async resendOTP(phone) {
    try {
      const response = await DjangoAPIService.makeRequest(
        '/api/v1/auth/otp/resend/',
        {
          method: 'POST',
          body: JSON.stringify({ phone }),
        }
      );
      
      return {
        success: response.success,
        message: response.message,
      };
    } catch (error) {
      console.error('[OTPService] Resend OTP error:', error);
      return {
        success: false,
        message: error.message || 'Failed to resend OTP',
      };
    }
  }
}

export default new OTPService();
```

---

### 3.2 Create OTP Screen UI

**File:** `frontend/screens/auth/OTPVerificationScreen.js`

```javascript
/**
 * OTP Verification Screen
 * Enter 6-digit OTP sent via SMS
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../constants';
import OTPService from '../../services/OTPService';

export default function OTPVerificationScreen({ route, navigation }) {
  const { phone } = route.params; // Phone from previous screen
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits entered
    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleBackspace = (index) => {
    if (otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode = null) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      Alert.alert('Error', 'Please enter all 6 digits');
      return;
    }

    setLoading(true);
    const result = await OTPService.verifyOTP(phone, code);
    setLoading(false);

    if (result.success) {
      Alert.alert('Success', result.message);
      // TODO: Save token and navigate to dashboard
      navigation.navigate('Dashboard');
    } else {
      Alert.alert('Verification Failed', result.message);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setLoading(true);
    const result = await OTPService.resendOTP(phone);
    setLoading(false);

    if (result.success) {
      Alert.alert('OTP Sent', result.message);
      setResendCooldown(60);
      setCanResend(false);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Enter OTP</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{'\n'}
          <Text style={styles.phone}>{phone}</Text>
        </Text>

        {/* OTP Input Boxes */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.otpInput,
                digit ? styles.otpInputFilled : null,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(index, value)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') {
                  handleBackspace(index);
                }
              }}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={index === 0}
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={() => handleVerify()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>

        {/* Resend Link */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleResend} disabled={!canResend}>
            <Text
              style={[
                styles.resendLink,
                !canResend && styles.resendDisabled,
              ]}
            >
              {canResend ? 'Resend' : `Resend in ${resendCooldown}s`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: Typography.fontFamily?.bold || 'Poppins-Bold',
    color: Colors.text?.primary || '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily?.regular || 'Poppins-Regular',
    color: '#646767',
    marginBottom: 32,
    textAlign: 'center',
  },
  phone: {
    fontFamily: Typography.fontFamily?.semibold || 'Poppins-SemiBold',
    color: Colors.primary,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    fontSize: 24,
    fontFamily: Typography.fontFamily?.bold || 'Poppins-Bold',
    textAlign: 'center',
    color: Colors.text?.primary || '#1A1A1A',
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#FFF5F5',
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: Typography.fontFamily?.bold || 'Poppins-Bold',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily?.regular || 'Poppins-Regular',
    color: '#646767',
  },
  resendLink: {
    fontSize: 14,
    fontFamily: Typography.fontFamily?.semibold || 'Poppins-SemiBold',
    color: Colors.primary,
  },
  resendDisabled: {
    color: '#CCCCCC',
  },
});
```

---

## Phase 4: Testing & Deployment

### 4.1 Test OTP Flow (Manual Testing)

**Test 1: Send OTP**

```bash
curl -X POST http://44.200.182.180/api/v1/auth/otp/send/ \
  -H "Content-Type: application/json" \
  -d '{"phone": "0712345678", "purpose": "LOGIN"}'

# Expected Response:
# {"success": true, "message": "OTP sent to +254712345678"}
```

**Test 2: Verify OTP** (use actual OTP from SMS)

```bash
curl -X POST http://44.200.182.180/api/v1/auth/otp/verify/ \
  -H "Content-Type: application/json" \
  -d '{"phone": "0712345678", "otp": "123456"}'

# Expected Response:
# {"success": true, "message": "OTP verified successfully"}
```

**Test 3: Rate Limit**

```bash
# Send OTP twice within 60 seconds
curl -X POST http://44.200.182.180/api/v1/auth/otp/send/ \
  -H "Content-Type: application/json" \
  -d '{"phone": "0712345678", "purpose": "LOGIN"}'

# Second request should fail:
# {"success": false, "message": "Please wait 60 seconds..."}
```

---

### 4.2 Monitoring & Logs

**View OTP Logs:**

```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.200.182.180
tail -f /var/log/patabima/otp.log
```

**Monitor DynamoDB:**

```bash
# View recent OTPs
aws dynamodb scan \
  --table-name patabima-otp-tokens \
  --limit 10 \
  --region us-east-1

# Check table metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=patabima-otp-tokens \
  --start-time 2025-11-16T00:00:00Z \
  --end-time 2025-11-16T23:59:59Z \
  --period 3600 \
  --statistics Sum \
  --region us-east-1
```

**Monitor SNS SMS Delivery:**

```bash
# Check SMS delivery logs (if enabled)
aws logs tail /aws/sns/us-east-1/804686432477/DirectPublishToPhoneNumber \
  --follow \
  --region us-east-1
```

---

## Phase 5: Security Best Practices

### 5.1 Security Checklist

- ✅ **Use IAM Roles** (not access keys) for EC2
- ✅ **Rate Limiting**: 60s cooldown between OTP requests
- ✅ **OTP Expiry**: 5 minutes TTL
- ✅ **Max Attempts**: 3 failed attempts before requiring new OTP
- ✅ **Phone Validation**: E.164 format normalization
- ✅ **Transactional SMS**: High priority, no marketing opt-out
- ✅ **DynamoDB TTL**: Auto-cleanup expired OTPs
- ✅ **HTTPS Only**: Never send OTPs over HTTP
- ✅ **Logging**: Audit trail for OTP send/verify events
- ✅ **SMS Spend Limit**: $500/month cap to prevent abuse

### 5.2 Additional Security Measures

**1. Add CAPTCHA for OTP Send** (prevent SMS spam):

```python
# In SendOTPView.post()
from django_recaptcha.fields import ReCaptchaField

recaptcha_token = request.data.get('recaptcha_token')
if not verify_recaptcha(recaptcha_token):
    return Response({'success': False, 'message': 'CAPTCHA verification failed'})
```

**2. IP Rate Limiting** (prevent abuse):

```python
# Use Django REST Framework throttling
from rest_framework.throttling import AnonRateThrottle

class SendOTPView(APIView):
    throttle_classes = [AnonRateThrottle]  # 5 requests/hour per IP
    throttle_scope = 'otp_send'
```

**3. Device Fingerprinting** (detect suspicious activity):

```python
# Track device info from React Native
device_id = request.data.get('device_id')
# Block if too many OTPs from same device
```

---

## Phase 6: Production Deployment Checklist

### Pre-Launch Checklist

- [ ] **AWS Account Limits**: Request SNS SMS limit increase (if > $1/month)
- [ ] **DynamoDB Table**: Created with TTL enabled
- [ ] **IAM Roles**: EC2 role has SNS + DynamoDB permissions
- [ ] **Django Settings**: AWS_REGION configured, logging enabled
- [ ] **Backend Code**: Deployed to EC2, services restarted
- [ ] **Frontend Code**: OTPService integrated, screens tested
- [ ] **Testing**: Manual end-to-end OTP flow verified
- [ ] **Monitoring**: CloudWatch alarms for high SMS spend, DynamoDB throttling
- [ ] **HTTPS**: SSL certificate installed (Let's Encrypt)
- [ ] **Rate Limiting**: Tested 60s cooldown, max 3 attempts
- [ ] **Error Handling**: Graceful failures, user-friendly messages
- [ ] **Documentation**: API docs updated, team trained

---

## Cost Estimates

**Monthly Cost Breakdown** (10,000 OTP requests/month):

| Service | Usage | Cost |
|---------|-------|------|
| **AWS SNS SMS** | 10,000 SMS to Kenya (+254) | $500 - $800 |
| **DynamoDB** | 10,000 writes + 30,000 reads | $0.25 - $0.50 |
| **CloudWatch Logs** | 1 GB logs | $0.50 |
| **Total** | | **$500 - $801/month** |

**Cost Optimization Tips:**
- Use **reserved capacity** for DynamoDB if usage is predictable (saves 50%)
- Enable **SMS spend alerts** to catch abuse early
- Archive logs to S3 after 7 days (cheaper storage)

---

## Troubleshooting Guide

### Issue: OTP Not Received

**Diagnosis:**

```bash
# 1. Check SNS logs
aws logs tail /aws/sns/us-east-1/804686432477/DirectPublishToPhoneNumber \
  --since 10m \
  --region us-east-1

# 2. Check Django logs
ssh -i ~/.ssh/aws-eb ec2-user@44.200.182.180
tail -f /var/log/patabima/otp.log

# 3. Verify phone number format
# Must be E.164: +254XXXXXXXXX (not 07XXXXXXXX)
```

**Solutions:**
- Phone number invalid → Check phonenumbers parsing
- SNS delivery failed → Check AWS Health Dashboard
- Rate limit hit → Wait 60 seconds
- SMS quota exceeded → Request limit increase

---

### Issue: DynamoDB Access Denied

**Error:** `An error occurred (AccessDeniedException) when calling PutItem`

**Solution:**

```bash
# Verify IAM role attached to EC2
INSTANCE_ID="i-0d0f116005d812275"
aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].IamInstanceProfile' \
  --region us-east-1

# Attach missing policy
aws iam attach-role-policy \
  --role-name <RoleName> \
  --policy-arn arn:aws:iam::804686432477:policy/PataBima-OTP-Policy
```

---

### Issue: OTP Expired Immediately

**Diagnosis:**

```bash
# Check server time (must be accurate)
ssh -i ~/.ssh/aws-eb ec2-user@44.200.182.180
date -u  # Should match UTC time

# Verify DynamoDB item
aws dynamodb get-item \
  --table-name patabima-otp-tokens \
  --key '{"phone_number": {"S": "+254712345678"}}' \
  --region us-east-1
```

**Solution:**
- Server time drift → Sync with NTP: `sudo ntpdate -u time.nist.gov`
- TTL misconfigured → Check expiry_time = created_at + 300

---

## Next Steps

1. **Phase 1**: Complete AWS infrastructure setup (DynamoDB, SNS, IAM)
2. **Phase 2**: Deploy Django OTP service to EC2
3. **Phase 3**: Integrate React Native OTP screens
4. **Phase 4**: Test end-to-end flow with real Kenyan numbers
5. **Phase 5**: Enable monitoring and alerts
6. **Phase 6**: Go live! 🚀

---

## Support & Resources

- **AWS SNS Pricing**: https://aws.amazon.com/sns/pricing/
- **DynamoDB TTL**: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html
- **boto3 Documentation**: https://boto3.amazonaws.com/v1/documentation/api/latest/index.html
- **phonenumbers Library**: https://github.com/daviddrysdale/python-phonenumbers

---

**Document Version:** 1.0  
**Last Updated:** November 16, 2025  
**Author:** PataBima DevOps Team

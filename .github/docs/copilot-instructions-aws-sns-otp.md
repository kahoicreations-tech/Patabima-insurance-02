# AWS SNS OTP Implementation Instructions

<!-- Temporary instructions for implementing real OTP via AWS SNS -->
<!-- Use this file when working on OTP authentication implementation -->
<!-- Remove or archive after implementation is complete -->

## Context

**Current State**: Using fake OTP with codes returned in API response for development  
**Goal**: Implement production-ready OTP via AWS SNS for Kenyan phone numbers (+254)  
**Timeline**: 2-3 hours implementation  
**Priority**: HIGH - Security & Production Readiness

---

## AWS SNS Configuration Requirements

### Prerequisites

- ✅ AWS Account (already have from Amplify/S3/Textract)
- ✅ AWS credentials with SNS permissions
- ⚠️ **CRITICAL**: Request AWS SNS Production Access (24-48h approval time)

### SNS Production Access Request

**Do this FIRST before coding!**

1. **Go to AWS Console** → SNS → SMS Preferences → "Request Production Access"
2. **Fill out form**:
   - Use case: `Transactional OTP for insurance app authentication`
   - Expected monthly volume: `~500-1000 SMS per month`
   - Target country: `Kenya (+254)`
   - Website URL: `https://patabima.com` (or your domain)
   - Company name: `PataBima Insurance Agency`
3. **Wait for approval**: Usually 24-48 hours
4. **During approval wait**: Code works in sandbox mode for testing with verified numbers

### SNS Settings Configuration

```bash
# AWS Console → SNS → Text messaging (SMS) → SMS preferences

Sender ID: PataBima
# Shows as sender name on SMS (if supported by carrier)

Default message type: Transactional
# Higher priority delivery, no promotional filtering

Monthly spend limit: $100
# Safety limit to prevent unexpected charges

Account spend limit: $1000
# Overall safety cap
```

---

## Implementation Steps

### Phase 1: AWS SNS Service Layer (Backend)

#### File: `insurance-app/app/sms_service.py` (NEW FILE)

**Requirements**:

- Create singleton SMS service class
- Use existing AWS credentials from settings
- Handle Kenya phone number format (+254XXXXXXXXX)
- Implement error handling and logging
- Return structured response with success status

**Code Pattern**:

```python
import boto3
import logging
from django.conf import settings

class SMSService:
    """
    AWS SNS SMS service for OTP delivery

    Usage:
        from .sms_service import sms_service
        result = sms_service.send_otp('+254712345678', '123456')
    """

    def __init__(self):
        # Initialize SNS client with existing AWS credentials
        self.sns = boto3.client(
            'sns',
            region_name=settings.AWS_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY
        )

    def send_otp(self, phone_number, otp_code):
        """
        Send OTP via AWS SNS

        Args:
            phone_number (str): Phone in +254XXXXXXXXX format
            otp_code (str): 6-digit numeric code

        Returns:
            dict: {
                'success': bool,
                'message_id': str (if success),
                'error': str (if failed)
            }
        """
        # Validate phone number format
        # Send via SNS with message attributes
        # Return structured response
        pass
```

**Key Implementation Details**:

- Message format: `"Your PataBima verification code is: {otp_code}\n\nValid for 5 minutes."`
- Use `MessageAttributes` for SenderID and SMSType
- Log success/failure (don't log OTP code itself)
- Handle boto3 exceptions gracefully

---

### Phase 2: Update Authentication Views (Backend)

#### File: `insurance-app/app/auth_views.py` (MODIFY)

**Locations to Update**:

1. **Import SMS Service**:

```python
from .sms_service import sms_service
```

2. **Login View** (where OTP is generated):

```python
# After generating OTP code
otp_code = ''.join(random.choice(string.digits) for _ in range(6))
otp_inst.code = otp_code
otp_inst.expiry_time = timezone.now() + timedelta(minutes=5)
otp_inst.save()

# SEND VIA SNS
phone = f"+254{user.phone_number.lstrip('0')}"  # Normalize to +254
result = sms_service.send_otp(phone, otp_code)

if result['success']:
    logger.info(f"OTP sent to user {user.id}")
    # PRODUCTION: Don't return OTP in response
    return Response({
        'detail': 'OTP sent to your phone',
        'requires_otp': True
    })
else:
    logger.error(f"SMS failed for user {user.id}: {result.get('error')}")
    # Optional: Return OTP in DEBUG mode only for testing
    if settings.DEBUG:
        return Response({
            'detail': 'OTP sent (dev mode)',
            'otp_code': otp_code,  # Only for testing
            'sms_error': result.get('error')
        })
    return Response({
        'error': 'Failed to send verification code. Please try again.'
    }, status=500)
```

3. **Signup View** (if OTP is sent on registration):

```python
# Similar pattern as login
# Send OTP after user creation
# Return success without OTP code in production
```

**Important Security Rules**:

- ✅ Return OTP in response ONLY when `settings.DEBUG = True`
- ✅ Always log SMS send attempts (without OTP code)
- ✅ Return user-friendly error messages
- ❌ Never log actual OTP codes
- ❌ Never return OTP in production mode

---

### Phase 3: Rate Limiting (Backend Security)

#### File: `insurance-app/app/sms_service.py` (ENHANCE)

**Add Rate Limiting Function**:

```python
from django.core.cache import cache

def send_otp_with_rate_limit(self, phone_number, otp_code):
    """
    Send OTP with rate limiting to prevent abuse

    Rate limits:
    - Max 3 OTP requests per phone per hour
    - Max 10 OTP requests per phone per day

    Returns:
        dict: Same as send_otp() but with rate limit errors
    """
    # Check hourly limit
    hourly_key = f"otp_hourly_{phone_number}"
    hourly_attempts = cache.get(hourly_key, 0)

    if hourly_attempts >= 3:
        return {
            'success': False,
            'error': 'Too many OTP requests. Please try again in 1 hour.',
            'rate_limited': True
        }

    # Check daily limit
    daily_key = f"otp_daily_{phone_number}"
    daily_attempts = cache.get(daily_key, 0)

    if daily_attempts >= 10:
        return {
            'success': False,
            'error': 'Daily OTP limit reached. Please contact support.',
            'rate_limited': True
        }

    # Send OTP
    result = self.send_otp(phone_number, otp_code)

    # Update counters on success
    if result['success']:
        cache.set(hourly_key, hourly_attempts + 1, timeout=3600)  # 1 hour
        cache.set(daily_key, daily_attempts + 1, timeout=86400)   # 24 hours

    return result
```

**Usage in auth_views.py**:

```python
# Replace: result = sms_service.send_otp(phone, otp_code)
# With:
result = sms_service.send_otp_with_rate_limit(phone, otp_code)

if not result['success'] and result.get('rate_limited'):
    return Response({
        'error': result['error']
    }, status=429)  # HTTP 429 Too Many Requests
```

---

### Phase 4: Frontend Updates

#### File: `frontend/screens/auth/LoginScreen.js` (MODIFY)

**Remove OTP Auto-Fill in Production**:

**Current Code** (Line ~83):

```javascript
if (result.otp_code) setOtp(result.otp_code);
Alert.alert(
  "OTP Sent",
  `Please check your phone for the verification code${
    result.otp_code ? `: ${result.otp_code}` : ""
  }`
);
```

**New Code**:

```javascript
// Only auto-fill OTP in development mode
if (__DEV__ && result.otp_code) {
  setOtp(result.otp_code);
  console.log("[DEV] Auto-filled OTP:", result.otp_code);
}

// User-friendly message
Alert.alert(
  "Verification Code Sent",
  "Please check your phone for the 6-digit verification code.\n\nIt may take up to 30 seconds to arrive.",
  [{ text: "OK", onPress: () => otpInputRef.current?.focus() }]
);
```

**Handle SMS Delivery Errors**:

```javascript
// After API call
if (result.error) {
  if (result.error.includes("Too many")) {
    Alert.alert("Too Many Attempts", result.error);
  } else if (result.error.includes("Failed to send")) {
    Alert.alert(
      "Verification Code Error",
      "We couldn't send the verification code. Please check your phone number and try again.",
      [
        { text: "Retry", onPress: () => handleLogin() },
        { text: "Cancel", style: "cancel" },
      ]
    );
  }
}
```

#### File: `frontend/screens/auth/SignupScreen.js` (MODIFY)

**Similar changes as LoginScreen**:

- Remove OTP auto-fill in production
- Update alert messages
- Handle SMS errors gracefully

---

### Phase 5: Environment Configuration

#### File: `insurance-app/.env` (UPDATE)

**Add/Verify AWS Credentials**:

```bash
# AWS Configuration (already have from Amplify/S3/Textract)
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1

# SMS Configuration
AWS_SNS_SENDER_ID=PataBima
AWS_SNS_MESSAGE_TYPE=Transactional

# Security
OTP_EXPIRY_MINUTES=5
OTP_LENGTH=6
OTP_HOURLY_LIMIT=3
OTP_DAILY_LIMIT=10
```

#### File: `insurance-app/insurance-app/settings.py` (UPDATE)

**Add SNS Settings**:

```python
# AWS SNS Configuration
AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')

# SMS/OTP Settings
AWS_SNS_SENDER_ID = os.getenv('AWS_SNS_SENDER_ID', 'PataBima')
AWS_SNS_MESSAGE_TYPE = os.getenv('AWS_SNS_MESSAGE_TYPE', 'Transactional')
OTP_EXPIRY_MINUTES = int(os.getenv('OTP_EXPIRY_MINUTES', 5))
OTP_LENGTH = int(os.getenv('OTP_LENGTH', 6))
OTP_HOURLY_LIMIT = int(os.getenv('OTP_HOURLY_LIMIT', 3))
OTP_DAILY_LIMIT = int(os.getenv('OTP_DAILY_LIMIT', 10))
```

---

### Phase 6: Dependencies

#### File: `insurance-app/requirements.txt` (UPDATE)

**Verify boto3 is present** (should already be there for S3/Textract):

```txt
boto3>=1.26.0
```

If not present, add it and run:

```bash
cd insurance-app
pip install -r requirements.txt
```

---

## Testing Strategy

### Sandbox Mode Testing (Before Production Approval)

**Limitations**:

- Can only send to verified phone numbers
- Max 10 SMS per day in sandbox

**Steps**:

1. Add your Kenyan phone number to verified numbers in AWS SNS
2. Test login flow with your number
3. Verify OTP delivery
4. Test rate limiting (try 4 requests in 1 hour)
5. Test expiry (wait 6 minutes after OTP generation)

### Production Testing (After AWS Approval)

**Test Cases**:

1. ✅ Successful login with valid OTP
2. ✅ Failed login with invalid OTP
3. ✅ Failed login with expired OTP (>5 mins)
4. ✅ Rate limiting (3 requests/hour)
5. ✅ Rate limiting (10 requests/day)
6. ✅ SMS delivery to different Kenyan carriers (Safaricom, Airtel)
7. ✅ Error handling when SMS fails
8. ✅ OTP not returned in production mode

---

## Monitoring & Logging

### CloudWatch Metrics (Automatic)

- SMS delivery success rate
- Failed deliveries by country
- Average delivery time
- Monthly spend

**Access**: AWS Console → CloudWatch → Metrics → SNS

### Django Logging

**Add to settings.py**:

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'logs/otp.log',
        },
    },
    'loggers': {
        'otp': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

**In sms_service.py**:

```python
logger = logging.getLogger('otp')

# Log format (without sensitive data)
logger.info(f"OTP requested for {phone[:8]}***")
logger.info(f"SMS sent via SNS: MessageId={message_id}")
logger.error(f"SMS failed: {error_message}")
```

---

## Cost Estimation

### Kenya SMS Pricing

- **Cost per SMS**: $0.045 (USD)
- **Expected volume**: 500-1000 SMS/month
- **Monthly cost**: $22.50 - $45.00

### Free Tier

- **First 12 months**: 100 free SMS/month
- **After free tier**: Full pricing applies

### Budget Alerts

Set up CloudWatch billing alarm:

```bash
# Alert when monthly SMS cost exceeds $50
AWS Console → CloudWatch → Billing → Create Alarm
```

---

## Security Checklist

Before deploying to production:

- [ ] AWS SNS production access approved
- [ ] Rate limiting implemented (3/hour, 10/day)
- [ ] OTP codes NOT logged anywhere
- [ ] OTP codes NOT returned in production API responses
- [ ] Phone numbers validated and normalized (+254 format)
- [ ] OTP expiry set to 5 minutes
- [ ] HTTPS enforced for all API calls
- [ ] AWS credentials stored in environment variables (not hardcoded)
- [ ] Monthly spend limit set in AWS SNS
- [ ] CloudWatch alarms configured for failed deliveries
- [ ] Error messages don't expose system details
- [ ] Frontend doesn't auto-fill OTP in production

---

## Rollback Plan

If SMS delivery fails in production:

1. **Temporary Fallback**: Re-enable OTP in API response

   ```python
   # In auth_views.py
   if settings.EMERGENCY_OTP_FALLBACK:
       return Response({
           'detail': 'OTP sent',
           'otp_code': otp_code  # Emergency only
       })
   ```

2. **Monitor**: Check CloudWatch for specific error
3. **Fix**: Address AWS SNS issue
4. **Re-enable**: Remove fallback code

---

## Common Issues & Solutions

### Issue 1: SMS Not Delivered

**Symptoms**: User doesn't receive OTP  
**Solutions**:

- Check AWS SNS console for delivery status
- Verify phone number format (+254XXXXXXXXX)
- Check if number is on carrier blocklist
- Verify AWS SNS production access is approved
- Check monthly spend limit not exceeded

### Issue 2: Wrong Sender ID

**Symptoms**: SMS shows number instead of "PataBima"  
**Solutions**:

- Some carriers don't support alphanumeric sender IDs
- Safaricom supports it, Airtel may not
- This is expected behavior, not a bug

### Issue 3: Rate Limit Too Strict

**Symptoms**: Legitimate users blocked  
**Solutions**:

- Adjust limits in .env: `OTP_HOURLY_LIMIT=5`
- Implement "resend after X seconds" instead of blocking
- Add admin override for support team

### Issue 4: High Costs

**Symptoms**: AWS bill higher than expected  
**Solutions**:

- Check for OTP spam attacks (rate limiting should prevent)
- Review CloudWatch metrics for unusual patterns
- Reduce OTP expiry from 5 to 3 minutes
- Implement CAPTCHA before OTP generation

---

## Post-Implementation Tasks

After successful deployment:

1. [ ] Archive this instruction file to `docs/implementation/`
2. [ ] Update main copilot-instructions.md with OTP flow
3. [ ] Create monitoring dashboard for SMS metrics
4. [ ] Document OTP flow in API documentation
5. [ ] Train support team on OTP issues troubleshooting
6. [ ] Set up monthly cost review process

---

## References

- [AWS SNS SMS Documentation](https://docs.aws.amazon.com/sns/latest/dg/sns-mobile-phone-number-as-subscriber.html)
- [AWS SNS Pricing - Kenya](https://aws.amazon.com/sns/sms-pricing/)
- [Django Cache Framework](https://docs.djangoproject.com/en/4.2/topics/cache/)
- [boto3 SNS Client](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/sns.html)

---

**Implementation Owner**: Backend Team  
**Review Required**: Lead Developer + DevOps  
**Timeline**: 2-3 hours (excluding AWS approval wait time)  
**Priority**: HIGH - Production readiness blocker

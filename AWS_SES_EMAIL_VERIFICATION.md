# AWS SES Email Verification Setup

## Overview

The email verification system uses AWS Simple Email Service (SES) to send verification codes to users and verify their email addresses.

## Backend Components

### 1. **Email Verification Service** (`app/services/email_verification_service.py`)
- Generates 6-digit verification codes
- Sends HTML-formatted emails via AWS SES
- Marks user profiles as verified after successful verification

### 2. **Email Verification Views** (`app/views/email_verification_views.py`)
- `POST /api/insurance/auth/email/send-verification/` - Send verification code
- `POST /api/insurance/auth/email/verify-code/` - Verify code and mark email as verified
- `POST /api/insurance/auth/email/resend-verification/` - Resend verification code

### 3. **Database Model** (`EmailVerificationCode`)
- Stores verification codes with expiration (15 minutes)
- Tracks verification status
- Records IP addresses for security
- Auto-expires old codes

## Frontend Components

### Profile Screen (`frontend/screens/main/MyAccountScreen.js`)
- Shows "Verify Email" button for unverified emails
- Displays verification modal with code input
- Handles sending, verification, and resend logic
- Shows success toast on verification

## AWS SES Configuration

### Environment Variables (.env)

```env
# Email Backend (AWS SES)
EMAIL_BACKEND=django_ses.SESBackend
AWS_SES_REGION_NAME=us-east-1
DEFAULT_FROM_EMAIL=noreply@patabima.co.ke
ADMIN_EMAIL=admin@patabima.co.ke

# AWS Credentials (from IAM user with SES permissions)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
```

### AWS SES Setup Steps

1. **Verify Domain in AWS SES**
   - Go to AWS SES Console > Verified identities
   - Add domain: `patabima.co.ke`
   - Add DNS records (TXT, CNAME, MX) to your domain registrar
   - Wait for verification (usually 24-72 hours)

2. **Request Production Access**
   - By default, SES is in sandbox mode (can only send to verified emails)
   - Request production access: AWS SES Console > Account dashboard > Request production access
   - Fill in use case form (typically approved within 24 hours)

3. **Create IAM User for SES**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ses:SendEmail",
           "ses:SendRawEmail"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

4. **Install django-ses Package** (already installed)
   ```bash
   pip install django-ses
   ```

## Testing

### Test Email Sending Locally

```python
# Run Django shell
python manage.py shell

# Test email
from django.core.mail import send_mail
send_mail(
    subject='Test Email',
    message='This is a test',
    from_email='noreply@patabima.co.ke',
    recipient_list=['your-email@example.com'],
    fail_silently=False
)
```

### Test Verification Flow

1. **Send Code**
   ```bash
   curl -X POST http://localhost:8000/api/insurance/auth/email/send-verification/ \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json"
   ```

2. **Verify Code**
   ```bash
   curl -X POST http://localhost:8000/api/insurance/auth/email/verify-code/ \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"code": "123456"}'
   ```

## User Flow

1. User logs in to the app
2. Profile screen shows "Not Verified" badge next to email
3. User taps "Verify Email" button
4. Backend generates 6-digit code and sends via AWS SES
5. User receives email with verification code
6. User enters code in modal
7. Backend validates code and marks email as verified
8. Profile updates to show "✓ Verified" badge

## Security Features

- **Rate Limiting**: 60-second cooldown between code requests
- **Code Expiration**: Codes expire after 15 minutes
- **One-Time Use**: Codes can only be used once
- **IP Tracking**: Records IP address for audit trail
- **Secure Transport**: All emails sent via AWS SES with DKIM/SPF

## Troubleshooting

### Email Not Sending

1. **Check SES Sandbox Status**
   - If in sandbox, you can only send to verified email addresses
   - Request production access

2. **Check Email Backend**
   ```python
   from django.conf import settings
   print(settings.EMAIL_BACKEND)  # Should be 'django_ses.SESBackend'
   ```

3. **Check AWS Credentials**
   ```bash
   aws ses verify-email-identity --email-address your-email@example.com
   ```

### Code Not Working

1. **Check Code Expiration**
   - Codes expire after 15 minutes
   - Request a new code

2. **Check Database**
   ```python
   from app.models import EmailVerificationCode
   EmailVerificationCode.objects.filter(user__email='user@example.com').order_by('-date_created')
   ```

## Migration

The email verification model was added in migration `0062_add_email_verification_model.py`.

To apply:
```bash
python manage.py migrate
```

## Future Enhancements

- [ ] Add SMS verification as backup
- [ ] Implement magic link authentication
- [ ] Add email change verification workflow
- [ ] Track verification attempts for security monitoring
- [ ] Add admin dashboard for verification metrics

# AWS SES Email Setup Guide for PataBima Insurance

**Date:** October 26, 2025  
**Purpose:** Configure Amazon Simple Email Service (SES) for sending policy notifications, confirmations, and renewal reminders.

---

## 📋 **Overview**

Amazon SES is the recommended email service for PataBima because:

- ✅ Cost-effective: $0.10 per 1,000 emails
- ✅ High deliverability (99%+ inbox placement)
- ✅ Supports HTML emails with PDF attachments
- ✅ Already integrated with AWS ecosystem
- ✅ Built-in bounce/complaint handling
- ✅ Easy Django integration via `django-ses`

---

## 🚀 **Step 1: AWS SES Setup**

### **1.1 Create AWS SES Account**

1. **Log in to AWS Console**

   - Go to https://console.aws.amazon.com
   - Navigate to **SES (Simple Email Service)**
   - Select Region: **US East (N. Virginia) us-east-1** (recommended for best deliverability)

2. **Verify Your Domain**

   ```
   Domain: patabima.co.ke (or your actual domain)
   ```

   - Go to **Verified identities** → **Create identity**
   - Select **Domain**
   - Enter: `patabima.co.ke`
   - Enable **DKIM signatures** (recommended)
   - Click **Create identity**

3. **Add DNS Records** (Required for domain verification)

   AWS will provide DNS records. Add these to your domain registrar:

   ```dns
   # CNAME Records (Example - use values from AWS)
   _amazonses.patabima.co.ke     CNAME   abc123.dkim.amazonses.com
   abc123._domainkey.patabima.co.ke  CNAME   abc123.dkim.amazonses.com
   def456._domainkey.patabima.co.ke  CNAME   def456.dkim.amazonses.com
   ghi789._domainkey.patabima.co.ke  CNAME   ghi789.dkim.amazonses.com

   # TXT Record for verification
   _amazonses.patabima.co.ke     TXT     "abc123def456ghi789..."
   ```

   **Note:** Verification can take up to 72 hours, but usually completes in 10-30 minutes.

4. **Verify Email Addresses (for testing)**

   While domain verification is pending, verify individual email addresses:

   - Go to **Verified identities** → **Create identity**
   - Select **Email address**
   - Enter: `admin@patabima.co.ke` (and any other test emails)
   - Click **Create identity**
   - Check inbox and click verification link

### **1.2 Request Production Access**

**IMPORTANT:** By default, SES accounts start in **Sandbox mode** (limited to verified emails only).

To send to ANY email address (production use):

1. Go to **Account dashboard**
2. Click **Request production access**
3. Fill out the form:
   ```
   Use Case: Transactional email for insurance policy notifications
   Website URL: https://patabima.co.ke
   Email Type: Transactional
   Mail From domain: patabima.co.ke
   Daily sending quota: 10,000 (adjust based on your needs)
   Description:
   "We are an insurance agency sending policy confirmations,
   renewal reminders, and payment receipts to our clients.
   All emails are opt-in and include unsubscribe links."
   ```
4. Submit request
5. **Approval time:** Usually 24-48 hours

### **1.3 Create IAM User for SES Access**

1. Go to **IAM** → **Users** → **Create user**
2. Username: `patabima-ses-sender`
3. **Permissions:** Attach policy
   - Select: `AmazonSESFullAccess` (or create custom policy below)

**Custom Policy (More Secure):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail", "ses:SendTemplatedEmail"],
      "Resource": "*"
    }
  ]
}
```

4. **Create Access Key**
   - After user is created, go to **Security credentials**
   - Click **Create access key**
   - Select **Application running outside AWS**
   - Click **Create**
   - **Save these credentials** (shown only once):
     ```
     AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
     AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
     ```

---

## 🔧 **Step 2: Django Configuration**

### **2.1 Install Required Packages**

```bash
cd insurance-app
.\venv\Scripts\Activate.ps1

# Install django-ses (AWS SES backend for Django)
pip install django-ses

# Update requirements.txt
pip freeze > requirements.txt
```

### **2.2 Update Django Settings**

Add to `insurance-app/insurance/settings.py`:

```python
# ============================================================================
# EMAIL CONFIGURATION - AWS SES
# ============================================================================

# Email Backend - Use AWS SES
EMAIL_BACKEND = 'django_ses.SESBackend'

# AWS SES Configuration
AWS_SES_REGION_NAME = os.getenv('AWS_SES_REGION_NAME', 'us-east-1')
AWS_SES_REGION_ENDPOINT = f'email.{AWS_SES_REGION_NAME}.amazonaws.com'

# Email Settings
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@patabima.co.ke')
SERVER_EMAIL = os.getenv('SERVER_EMAIL', 'admin@patabima.co.ke')
EMAIL_HOST_USER = DEFAULT_FROM_EMAIL

# Django-SES specific settings
AWS_SES_AUTO_THROTTLE = 0.5  # Delay between emails (seconds) to avoid rate limits
AWS_SES_CONFIGURATION_SET = None  # Optional: for tracking opens/clicks
AWS_SES_VERIFY_BOUNCE_SIGNATURES = True  # Security: verify SNS signatures

# For development: Print emails to console instead of sending
if DEBUG and not os.getenv('USE_REAL_EMAIL', False):
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
```

### **2.3 Create .env Configuration**

Add to `insurance-app/.env`:

```bash
# AWS SES Email Configuration
AWS_SES_REGION_NAME=us-east-1
DEFAULT_FROM_EMAIL=noreply@patabima.co.ke
SERVER_EMAIL=admin@patabima.co.ke

# Set to True to send real emails in development
USE_REAL_EMAIL=False

# Note: AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
# are already configured for S3. SES will use the same credentials.
```

### **2.4 Update Notification Service**

The `send_policy_email()` function in `app/services/notifications.py` is already configured to use Django's email backend. No changes needed - it will automatically use SES!

---

## 🧪 **Step 3: Testing**

### **3.1 Test in Django Shell**

```bash
cd insurance-app
.\venv\Scripts\Activate.ps1
python manage.py shell
```

```python
from django.core.mail import send_mail

# Test simple email
send_mail(
    subject='PataBima Test Email',
    message='This is a test email from PataBima Insurance.',
    from_email='noreply@patabima.co.ke',
    recipient_list=['your-email@example.com'],
    fail_silently=False,
)

# Expected output: 1 (email sent successfully)
```

### **3.2 Test HTML Email with Attachment**

```python
from django.core.mail import EmailMessage

# Create HTML email
email = EmailMessage(
    subject='PataBima HTML Test',
    body='<h1>Test Email</h1><p>This is HTML content.</p>',
    from_email='noreply@patabima.co.ke',
    to=['your-email@example.com'],
)

# Set content type to HTML
email.content_subtype = 'html'

# Attach a test file (optional)
email.attach('test.txt', 'This is a test attachment', 'text/plain')

# Send
email.send()
```

### **3.3 Test Policy Notification**

```python
from app.models import MotorPolicy
from app.services.notifications import send_policy_email

# Get a test policy
policy = MotorPolicy.objects.filter(status='ACTIVE').first()

# Send notification
result = send_policy_email('your-email@example.com', policy)

# Check result
print(f"Email sent: {result}")
```

---

## 📊 **Step 4: Monitoring & Analytics**

### **4.1 SES Dashboard**

Monitor sending statistics:

- **AWS Console** → **SES** → **Account dashboard**
- Metrics: Sends, Deliveries, Bounces, Complaints

### **4.2 Set Up SNS for Bounce/Complaint Handling**

**Recommended for production:**

1. **Create SNS Topics**

   - Go to **SNS** → **Topics** → **Create topic**
   - Create 3 topics:
     - `ses-bounces`
     - `ses-complaints`
     - `ses-deliveries`

2. **Configure SES Notifications**

   - Go to **SES** → **Verified identities** → Select your domain
   - Click **Notifications** tab
   - Configure:
     - **Bounces** → Select `ses-bounces` topic
     - **Complaints** → Select `ses-complaints` topic
     - **Deliveries** → Select `ses-deliveries` topic (optional)

3. **Create Webhook Endpoint** (Optional - for advanced users)

   ```python
   # app/views/ses_webhook.py
   from rest_framework.decorators import api_view, permission_classes
   from rest_framework.permissions import AllowAny
   from rest_framework.response import Response
   import json

   @api_view(['POST'])
   @permission_classes([AllowAny])
   def ses_bounce_handler(request):
       """Handle SES bounce notifications via SNS"""
       # Verify SNS signature (important for security)
       message = json.loads(request.body)

       if message.get('Type') == 'SubscriptionConfirmation':
           # Confirm SNS subscription
           import requests
           requests.get(message['SubscribeURL'])
           return Response({'status': 'subscribed'})

       # Process bounce/complaint
       bounce_data = json.loads(message['Message'])
       # TODO: Mark email as bounced in database

       return Response({'status': 'processed'})
   ```

### **4.3 CloudWatch Metrics**

View detailed metrics:

- **CloudWatch** → **Metrics** → **SES**
- Track: Send rate, Bounce rate, Complaint rate

---

## 💰 **Step 5: Cost Estimation**

### **Pricing (as of 2025):**

| Service           | Cost                                   |
| ----------------- | -------------------------------------- |
| Email sending     | $0.10 per 1,000 emails                 |
| Data transfer out | $0.12 per GB (first 10 TB)             |
| Free tier         | 62,000 emails/month (if sent from EC2) |

### **Example Cost Calculation:**

**Scenario:** 10,000 policies/month

- Policy activation emails: 10,000 emails
- Renewal reminders (30 days before): ~1,000 emails
- **Total:** 11,000 emails/month

**Monthly Cost:**

- If sent from EC2: **FREE** (within 62K free tier)
- If sent from elsewhere: 11,000 ÷ 1,000 × $0.10 = **$1.10/month**

---

## 🔒 **Step 6: Security Best Practices**

### **6.1 SPF Record**

Add to your DNS:

```dns
v=spf1 include:amazonses.com ~all
```

### **6.2 DMARC Policy**

Add to your DNS:

```dns
_dmarc.patabima.co.ke    TXT    "v=DMARC1; p=quarantine; rua=mailto:dmarc@patabima.co.ke"
```

### **6.3 Rotate IAM Credentials**

- Rotate access keys every 90 days
- Use **AWS Secrets Manager** for production (optional)

### **6.4 Enable MFA on AWS Account**

- Protect your AWS root account with Multi-Factor Authentication

---

## 🐛 **Step 7: Troubleshooting**

### **Common Issues:**

#### **1. "Email address not verified" Error**

**Cause:** Account is in Sandbox mode
**Solution:** Request production access (see Step 1.2)

#### **2. "Maximum sending rate exceeded"**

**Cause:** Exceeded SES sending limits
**Solution:**

- Check **SES Dashboard** → **Account dashboard** → **Sending statistics**
- Request limit increase or enable `AWS_SES_AUTO_THROTTLE`

#### **3. Emails going to Spam**

**Solutions:**

- ✅ Verify domain with DKIM
- ✅ Add SPF record
- ✅ Add DMARC policy
- ✅ Warm up your sending (start with small volumes)
- ✅ Use clear "From" name: `PataBima Insurance <noreply@patabima.co.ke>`

#### **4. Bounces/Complaints**

**Solutions:**

- Clean your email list (remove invalid emails)
- Include clear unsubscribe link
- Don't send marketing emails (transactional only)
- Monitor bounce rate (keep below 5%)

---

## 📧 **Step 8: Email Templates**

### **8.1 Create Email Templates in SES (Optional)**

For consistent branding, create templates in AWS SES:

1. Go to **SES** → **Email templates** → **Create template**
2. Template name: `policy_activation`
3. Template HTML:

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
      }
      .header {
        background-color: #d5222b;
        color: white;
        padding: 20px;
      }
      .content {
        padding: 20px;
      }
      .footer {
        background-color: #f4f4f4;
        padding: 15px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>PataBima Insurance</h1>
    </div>
    <div class="content">
      <h2>Dear {{client_name}},</h2>
      <p>
        Your insurance policy <strong>{{policy_number}}</strong> has been
        activated!
      </p>
      <p>Cover Period: {{cover_start}} to {{cover_end}}</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 PataBima Insurance. All rights reserved.</p>
    </div>
  </body>
</html>
```

### **8.2 Use Templates in Django**

```python
from django.core.mail import EmailMessage

def send_templated_email(policy):
    email = EmailMessage(
        subject=f'Policy {policy.policy_number} Activated',
        body='',  # Will be replaced by template
        from_email='noreply@patabima.co.ke',
        to=[policy.client_details.get('email')],
    )

    # Set template
    email.template_id = 'policy_activation'
    email.template_data = {
        'client_name': policy.client_details.get('fullName'),
        'policy_number': policy.policy_number,
        'cover_start': policy.cover_start_date.strftime('%d %B %Y'),
        'cover_end': policy.cover_end_date.strftime('%d %B %Y'),
    }

    email.send()
```

---

## ✅ **Implementation Checklist**

- [ ] AWS SES account created
- [ ] Domain verified in SES
- [ ] Production access requested and approved
- [ ] IAM user created with SES permissions
- [ ] AWS credentials saved in `.env`
- [ ] `django-ses` package installed
- [ ] Django settings updated
- [ ] SPF, DKIM, DMARC records added to DNS
- [ ] Test emails sent successfully
- [ ] SNS topics created for bounce handling
- [ ] CloudWatch monitoring configured
- [ ] Email templates created (optional)

---

## 📞 **Support Resources**

- **AWS SES Documentation:** https://docs.aws.amazon.com/ses/
- **Django-SES GitHub:** https://github.com/django-ses/django-ses
- **AWS Support:** Available via AWS Console
- **PataBima Tech Team:** Contact for internal support

---

## 🎯 **Next Steps**

After completing this setup:

1. **Test thoroughly** in development environment
2. **Monitor** first 1,000 emails closely
3. **Review** bounce/complaint rates weekly
4. **Optimize** email content based on engagement
5. **Scale** sending volume gradually

---

**Setup Complete!** Your PataBima insurance app is now ready to send professional, reliable emails via AWS SES. 🚀

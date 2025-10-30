# Email System Quick Reference Guide

## Sending Emails in the PataBima System

### 1. Send Policy Confirmation Email

**Function:** `send_policy_email()`  
**Location:** `insurance-app/app/services/notifications.py`

**Usage:**

```python
from app.services.notifications import send_policy_email

# Send policy confirmation email
policy = MotorPolicy.objects.get(policy_number='POL-2025-000123')
success = send_policy_email(
    email_address='client@example.com',
    policy=policy
)

if success:
    print("Email sent successfully!")
else:
    print("Email failed to send")
```

**Automatically Called:**

- When `policy.activate_policy()` is called
- After payment webhook confirms payment
- During policy activation workflow

**Features:**

- ✅ Professional HTML email with PataBima branding
- ✅ Policy details (number, dates, vehicle, premium)
- ✅ PDF certificate attached from S3
- ✅ Premium breakdown with levies
- ✅ Underwriter contact information

---

### 2. Send Renewal Reminder Email

**Function:** `send_renewal_reminder()`  
**Location:** `insurance-app/app/services/notifications.py`

**Usage:**

```python
from app.services.notifications import send_renewal_reminder

# Send renewal reminder
policy = MotorPolicy.objects.get(policy_number='POL-2025-000123')
days_until_expiry = 30  # Policy expires in 30 days

result = send_renewal_reminder(policy, days_until_expiry)
# Returns: {'sms_sent': True, 'email_sent': True}
```

**When to Use:**

- 90 days before policy expiry (early bird)
- 30 days before policy expiry (standard)
- 7 days before policy expiry (urgent)

---

### 3. Send Custom Email

**Direct Django Email:**

```python
from django.core.mail import send_mail
from django.conf import settings

send_mail(
    subject='Your Custom Subject',
    message='Plain text message',
    from_email=settings.DEFAULT_FROM_EMAIL,
    recipient_list=['recipient@example.com'],
    fail_silently=False,
)
```

**HTML Email:**

```python
from django.core.mail import EmailMessage
from django.conf import settings

email = EmailMessage(
    subject='Your Custom Subject',
    body='<h1>HTML Content</h1><p>Your message here</p>',
    from_email=settings.DEFAULT_FROM_EMAIL,
    to=['recipient@example.com'],
)
email.content_subtype = 'html'  # Important!
email.send()
```

**HTML Email with Template:**

```python
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings

# Prepare context data
context = {
    'client_name': 'John Doe',
    'policy_number': 'POL-2025-000123',
    # ... other template variables
}

# Render template
html_content = render_to_string('emails/policy_confirmation.html', context)

# Create and send email
email = EmailMessage(
    subject='Policy Confirmation',
    body=html_content,
    from_email=settings.DEFAULT_FROM_EMAIL,
    to=['recipient@example.com'],
)
email.content_subtype = 'html'
email.send()
```

---

## Email Templates

### Available Templates

**1. Policy Confirmation** - `templates/emails/policy_confirmation.html`

**Variables Required:**

```python
context = {
    'client_name': str,                # Client full name
    'policy_number': str,              # Policy number (POL-2025-000123)
    'insurance_type': str,             # "Motor Insurance - Comprehensive"
    'cover_start_date': str,           # "01 January 2025"
    'cover_end_date': str,             # "31 December 2025"
    'vehicle_details': bool,           # True if motor insurance
    'vehicle_registration': str,       # "KBZ 123X"
    'vehicle_make_model': str,         # "Toyota Corolla"
    'base_premium': str,               # "25,000.00" (formatted)
    'itl_levy': str,                   # "62.50" (or None)
    'pcf_levy': str,                   # "62.50" (or None)
    'stamp_duty': str,                 # "40.00" (or None)
    'total_premium': str,              # "25,165.00" (formatted)
    'underwriter_name': str,           # "XYZ Insurance Ltd"
    'underwriter_contact': str,        # "+254 700 000 000" (or None)
    'support_email': str,              # "admin@patabima.co.ke"
    'support_phone': str,              # "+254 700 000 000"
}
```

---

## Email Configuration

### Development Mode (Current)

**`.env` setting:**

```bash
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

**Behavior:**

- Emails print to console/terminal
- No actual emails sent
- Perfect for testing
- No AWS credentials required

**Console Output Example:**

```
Content-Type: text/html; charset="utf-8"
Subject: Policy Activated - POL-2025-000123
From: noreply@patabima.co.ke
To: client@example.com

<html>...</html>
```

### Production Mode (AWS SES)

**`.env` setting:**

```bash
EMAIL_BACKEND=django_ses.SESBackend
AWS_SES_REGION_NAME=us-east-1
DEFAULT_FROM_EMAIL=noreply@patabima.co.ke
```

**Behavior:**

- Real emails sent via AWS SES
- High deliverability (99%+)
- Automatic bounce/complaint handling
- Cost: FREE for 62K emails/month (from EC2)

**Prerequisites:**

1. Domain verified in AWS SES
2. Production access approved
3. DNS records configured (SPF, DKIM, DMARC)
4. AWS credentials configured

---

## Testing

### Test Email Sending

**Quick Test:**

```bash
cd insurance-app
.\venv\Scripts\Activate.ps1
python test_email_ses.py
```

**Tests Include:**

- ✅ Basic email sending
- ✅ HTML email with template
- ✅ Email with PDF attachment
- ✅ Configuration display

### Django Shell Test

**Test in Shell:**

```bash
.\venv\Scripts\python.exe manage.py shell
```

**In Shell:**

```python
# Test basic email
from django.core.mail import send_mail
from django.conf import settings

send_mail(
    'Test Email',
    'This is a test.',
    settings.DEFAULT_FROM_EMAIL,
    ['your-email@example.com'],
)

# Test policy email
from app.models import MotorPolicy
from app.services.notifications import send_policy_email

policy = MotorPolicy.objects.filter(status='ACTIVE').first()
if policy:
    send_policy_email('your-email@example.com', policy)
```

---

## Email Attachments

### Attach PDF from S3

**Automatic (Policy Email):**

```python
# PDF automatically attached when policy.policy_document_url exists
send_policy_email('client@example.com', policy)
```

**Manual:**

```python
from django.core.mail import EmailMessage
import requests
from io import BytesIO

# Download PDF from S3
response = requests.get(s3_url, timeout=30)
pdf_content = BytesIO(response.content)

# Create email with attachment
email = EmailMessage(
    subject='Policy Certificate',
    body='Your policy certificate is attached.',
    from_email='noreply@patabima.co.ke',
    to=['client@example.com'],
)
email.attach('certificate.pdf', pdf_content.getvalue(), 'application/pdf')
email.send()
```

### Attach File from Local Path

**From File System:**

```python
from django.core.mail import EmailMessage

email = EmailMessage(
    subject='Document Attached',
    body='Please find the document attached.',
    from_email='noreply@patabima.co.ke',
    to=['client@example.com'],
)

# Attach local file
email.attach_file('/path/to/document.pdf')
email.send()
```

---

## Common Use Cases

### 1. Welcome Email (New Client)

```python
from django.core.mail import EmailMessage
from django.template.loader import render_to_string

context = {'client_name': 'John Doe'}
html_content = render_to_string('emails/welcome.html', context)

email = EmailMessage(
    subject='Welcome to PataBima Insurance',
    body=html_content,
    from_email='noreply@patabima.co.ke',
    to=['client@example.com'],
)
email.content_subtype = 'html'
email.send()
```

### 2. Payment Receipt

```python
from app.services.notifications import send_policy_email

# Policy confirmation email includes payment details
policy = MotorPolicy.objects.get(policy_number='POL-2025-000123')
send_policy_email('client@example.com', policy)
```

### 3. Claim Acknowledgment

```python
from django.core.mail import send_mail

send_mail(
    subject='Claim Received - REF-123456',
    message=f'Dear {client_name},\n\nYour claim has been received...',
    from_email='claims@patabima.co.ke',
    recipient_list=['client@example.com'],
)
```

### 4. Policy Renewal Notice

```python
from app.services.notifications import send_renewal_reminder

policy = MotorPolicy.objects.get(policy_number='POL-2025-000123')
send_renewal_reminder(policy, days_until_expiry=30)
```

---

## Troubleshooting

### Email Not Sending

**Check Configuration:**

```python
from django.conf import settings

print(f"Backend: {settings.EMAIL_BACKEND}")
print(f"From Email: {settings.DEFAULT_FROM_EMAIL}")
```

**Expected in Development:**

- Backend: `django.core.mail.backends.console.EmailBackend`
- Emails print to console (this is correct!)

**Expected in Production:**

- Backend: `django_ses.SESBackend`
- Emails send via AWS SES

### Template Not Found

**Error:** `TemplateDoesNotExist: emails/policy_confirmation.html`

**Solution:**

1. Check file exists: `insurance-app/templates/emails/policy_confirmation.html`
2. Check settings.py TEMPLATES configuration
3. Ensure `'DIRS': [BASE_DIR / 'templates']` is set

### PDF Attachment Fails

**Error:** PDF download fails or times out

**Solution:**

```python
# Email still sends without attachment (graceful fallback)
# Check logs for specific error:
import logging
logger = logging.getLogger(__name__)
logger.info(f"Policy document URL: {policy.policy_document_url}")
```

**Common Causes:**

- Pre-signed URL expired (default 1 hour)
- S3 permissions issue
- Network timeout (increase timeout=30 to higher value)

### AWS SES Errors

**Error:** `Email address not verified`

**Cause:** SES is in sandbox mode

**Solution:**

1. Verify recipient email in AWS SES console
2. OR request production access

**Error:** `Daily sending quota exceeded`

**Cause:** Hit daily limit (200 in sandbox, unlimited in production)

**Solution:**

1. Request production access
2. OR wait 24 hours for quota reset

---

## Best Practices

### 1. Always Use Templates

**Good:**

```python
html_content = render_to_string('emails/template.html', context)
```

**Avoid:**

```python
html_content = f"<html><body><h1>Hello {name}</h1></body></html>"
```

### 2. Handle Errors Gracefully

**Good:**

```python
try:
    send_policy_email(email, policy)
except Exception as e:
    logger.error(f"Email failed: {e}")
    # Continue with other operations
```

**Avoid:**

```python
send_policy_email(email, policy)  # Crashes on error
```

### 3. Log Email Activity

**Good:**

```python
import logging
logger = logging.getLogger(__name__)

logger.info(f"Sending policy email to {email}")
send_policy_email(email, policy)
logger.info(f"Email sent successfully")
```

### 4. Use Environment-Specific Settings

**Good (.env):**

```bash
# Development
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# Production
EMAIL_BACKEND=django_ses.SESBackend
```

### 5. Validate Email Addresses

**Good:**

```python
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

try:
    validate_email(email_address)
    send_policy_email(email_address, policy)
except ValidationError:
    logger.error(f"Invalid email: {email_address}")
```

---

## Performance Tips

### 1. Batch Email Sending

**For Multiple Recipients:**

```python
from django.core.mail import send_mass_mail

messages = [
    ('Subject', 'Message', 'from@example.com', ['to1@example.com']),
    ('Subject', 'Message', 'from@example.com', ['to2@example.com']),
]
send_mass_mail(messages, fail_silently=False)
```

### 2. Async Email Sending (Celery)

**For Background Processing:**

```python
# tasks.py
from celery import shared_task

@shared_task
def send_policy_email_async(email_address, policy_id):
    from app.models import MotorPolicy
    from app.services.notifications import send_policy_email

    policy = MotorPolicy.objects.get(id=policy_id)
    send_policy_email(email_address, policy)

# Usage
send_policy_email_async.delay('client@example.com', policy.id)
```

### 3. Email Throttling

**AWS SES Auto-Throttle:**

```python
# settings.py
AWS_SES_AUTO_THROTTLE = 0.5  # Send at 50% max rate
```

---

## Support Resources

**Documentation:**

- AWS SES Setup: `docs/AWS_SES_EMAIL_SETUP.md`
- Implementation Guide: `docs/AWS_SES_EMAIL_IMPLEMENTATION_COMPLETE.md`
- Django Email Docs: https://docs.djangoproject.com/en/4.2/topics/email/

**Testing:**

- Test Script: `insurance-app/test_email_ses.py`
- Django Shell: `python manage.py shell`

**Configuration:**

- Settings: `insurance-app/insurance/settings.py`
- Environment: `insurance-app/.env`
- Templates: `insurance-app/templates/emails/`

---

**Last Updated:** October 26, 2025  
**Status:** Production Ready ✅

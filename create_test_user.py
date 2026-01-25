"""Create test user for Motor3 submission testing"""
import os
import django
import sys

# Setup Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'insurance-app'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Test user details
phonenumber = '0712345678'
email = 'motor3test@patabima.com'
password = 'Test@123'

# Create or update user
user, created = User.objects.get_or_create(
    phonenumber=phonenumber,
    defaults={
        'email': email,
        'role': 'AGENT',
        'is_active': True,
    }
)

# Keep fields consistent even if the user already existed
changed = False
if user.email != email:
    user.email = email
    changed = True
if getattr(user, 'role', None) != 'AGENT':
    user.role = 'AGENT'
    changed = True
if getattr(user, 'is_active', True) is not True:
    user.is_active = True
    changed = True

# Set password
user.set_password(password)
user.save()

if changed and not created:
    user.save(update_fields=['email', 'role', 'is_active'])

status = "created" if created else "updated"
print(f"✅ User {status}: {user.phonenumber} ({user.email})")
print(f"   Password: {password}")

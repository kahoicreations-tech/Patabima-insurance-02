#!/usr/bin/env python
"""Create or update admin superuser."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Try to find existing user by phone or email
user = User.objects.filter(phonenumber='0741590055').first()
if not user:
    user = User.objects.filter(email='admin@patabima.com').first()

if user:
    # Update existing user
    user.set_password('Best254#')
    user.is_staff = True
    user.is_admin = True
    user.phonenumber = '0741590055'
    user.email = 'admin@patabima.com'
    user.save()
    print('✓ Admin user updated successfully!')
    print(f'  Phone: {user.phonenumber}')
    print(f'  Email: {user.email}')
    print(f'  is_staff: {user.is_staff}')
    print(f'  is_admin: {user.is_admin}')
else:
    # Create new superuser
    user = User.objects.create_superuser(
        phonenumber='0741590055',
        password='Best254#',
        email='admin@patabima.com'
    )
    print('✓ New superuser created successfully!')
    print(f'  Phone: {user.phonenumber}')
    print(f'  Email: {user.email}')
    print(f'  is_staff: {user.is_staff}')
    print(f'  is_admin: {user.is_admin}')

print('\nYou can now login to /admin/ with:')
print('  Phone: 0741590055')
print('  Password: Best254#')

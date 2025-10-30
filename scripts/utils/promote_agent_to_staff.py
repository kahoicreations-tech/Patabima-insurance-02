#!/usr/bin/env python3
"""
Promote a given agent to staff/admin so they can access Django Admin.
Default target phonenumber: 712345678
"""
import os
import sys

PROJECT_DIR = r'C:\Users\USER\Desktop\PATABIMA\PATABIMA FRONT\PATA BIMA AGENCY - Copy\insurance-app'
sys.path.insert(0, PROJECT_DIR)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')

import django
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def main(ph='712345678'):
    try:
        user = User.objects.get(phonenumber=ph)
    except User.DoesNotExist:
        print(f"User with phonenumber {ph} not found.")
        sys.exit(1)
    # Promote to staff/admin
    user.is_staff = True
    # Use custom is_admin flag if available
    if hasattr(user, 'is_admin'):
        user.is_admin = True
    user.save()
    print(f"User {ph}: is_staff={getattr(user,'is_staff',None)}, is_admin={getattr(user,'is_admin',None)}")

if __name__ == '__main__':
    ph = sys.argv[1] if len(sys.argv) > 1 else '712345678'
    main(ph)

#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

print("Available users:")
print("-" * 60)
for user in User.objects.all()[:10]:
    print(f"Phone: {user.phonenumber} | Role: {user.role} | ID: {user.id}")

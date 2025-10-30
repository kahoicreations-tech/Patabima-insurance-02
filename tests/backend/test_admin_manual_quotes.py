#!/usr/bin/env python3
"""
Admin Manual Quotes API Test
 - Ensures admin list and partial update work for manual medical quotes
"""

import os
import sys
import json
import requests

project_dir = r'C:\Users\USER\Desktop\PATABIMA\PATABIMA FRONT\PATA BIMA AGENCY - Copy\insurance-app'
sys.path.insert(0, project_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from app.models import ManualQuote

User = get_user_model()

BASE = 'http://localhost:8000/api/v1/public_app'

def ensure_admin_user():
    ph = '700000000'
    pw = 'adminpass123'
    user, created = User.objects.get_or_create(phonenumber=ph, defaults={
        'email': 'admin@patabima.com',
        'role': 'ADMIN',
        'is_staff': True,
        'is_admin': True,
    })
    # ensure flags and password
    user.role = 'ADMIN'
    user.is_staff = True
    user.is_admin = True
    user.set_password(pw)
    user.save()
    return ph, pw

def get_admin_token(ph, pw):
    # Step 1: request OTP
    r1 = requests.post(f"{BASE}/auth/login", json={'phonenumber': ph, 'password': pw})
    r1.raise_for_status()
    otp = r1.json().get('otp_code')
    # Step 2: verify
    r2 = requests.post(f"{BASE}/auth/auth_login", json={'phonenumber': ph, 'password': pw, 'code': otp})
    r2.raise_for_status()
    return r2.json().get('access')

def main():
    ph, pw = ensure_admin_user()
    token = get_admin_token(ph, pw)
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

    # Ensure there's at least one MEDICAL quote; create minimal one if missing via model
    quote = ManualQuote.objects.filter(line_key='MEDICAL').order_by('-created_at').first()
    if not quote:
        from uuid import uuid4
        # fallback: create a dummy agent user
        agent, _ = User.objects.get_or_create(phonenumber='799999999', defaults={'role': 'AGENT'})
        reference = ManualQuote.generate_reference('MEDICAL')
        quote = ManualQuote.objects.create(
            reference=reference,
            line_key='MEDICAL',
            agent=agent,
            payload={'client_name': 'Admin Test', 'age': 30},
            preferred_underwriters=['MADISON'],
        )

    # Admin list
    rl = requests.get(f"{BASE}/admin/manual_quotes?line_key=MEDICAL", headers=headers)
    print('Admin list status:', rl.status_code)
    try:
        print('Admin list count:', len(rl.json().get('results', [])))
    except Exception:
        print('Admin list response:', rl.text[:200])

    # Admin partial update: complete with premium and levies
    payload = {
        'status': 'COMPLETED',
        'computed_premium': '10000.00',
        'levies_breakdown': {'ITL': 25.0, 'PCF': 25.0, 'StampDuty': 40}
    }
    ru = requests.patch(f"{BASE}/admin/manual_quotes/{quote.reference}", headers=headers, data=json.dumps(payload))
    print('Admin update status:', ru.status_code)
    print('Admin update body:', ru.text[:300])

    # Verify via detail
    rd = requests.get(f"{BASE}/manual_quotes/{quote.reference}", headers=headers)
    print('Detail status:', rd.status_code)
    print('Detail body:', rd.text[:300])

if __name__ == '__main__':
    main()

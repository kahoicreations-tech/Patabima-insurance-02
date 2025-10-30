"""
Test the get_upcoming_extensions API view directly
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'insurance-app'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')

import django
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from app.views.policy_management import get_upcoming_extensions
import json

User = get_user_model()

print("\n" + "="*80)
print("TEST: get_upcoming_extensions API View")
print("="*80 + "\n")

# Get the user who owns POL-2025-560572
from app.models import MotorPolicy
policy = MotorPolicy.objects.get(policy_number='POL-2025-560572')
user = policy.user

print(f"Testing for user: {user.email} (ID: {user.id})")
print(f"User has {MotorPolicy.objects.filter(user=user, status='ACTIVE').count()} ACTIVE policies")

# Create a fake request with authentication
factory = RequestFactory()
request = factory.get('/api/v1/policies/motor/upcoming-extensions/')
request.user = user

# Bypass permission check by setting user as authenticated
from unittest.mock import Mock
request.user.is_authenticated = True

# Call the view
try:
    response = get_upcoming_extensions(request)
    status_code = response.status_code
    data = response.data
except Exception as e:
    print(f"Error calling view: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print(f"\nResponse Status: {response.status_code}")
print(f"\nResponse Data:")
data = response.data
print(f"  Success: {data.get('success')}")
print(f"  Count: {data.get('count')}")

extensions = data.get('extensions', [])
print(f"\n  Extensions ({len(extensions)}):")

found_560572 = False
for ext in extensions:
    policy_no = ext.get('policy_number') or ext.get('policyNo')
    print(f"\n  - {policy_no}")
    print(f"    Vehicle: {ext.get('vehicleReg')}")
    print(f"    Product: {ext.get('product_name')}")
    print(f"    Status: {ext.get('status')}")
    print(f"    Days to Balance: {ext.get('daysToBalanceDeadline')}")
    
    if policy_no == 'POL-2025-560572':
        found_560572 = True

print("\n" + "="*80)
if found_560572:
    print("✅ POL-2025-560572 IS in the response!")
else:
    print("❌ POL-2025-560572 NOT FOUND in response")
    print("\n⚠️  This means the backend endpoint is filtering it out.")
    print("    Check the endpoint logs for why.")
print("="*80 + "\n")

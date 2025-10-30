"""
Test script for Profile Enhancements
Tests the new UserSerializer fields: last_login, phonenumber, next_commission_date
"""

import os
import json
import django
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import User
from app.serializers import UserSerializer
from django.utils import timezone
from rest_framework.request import Request
from django.test import RequestFactory

def test_user_serializer():
    """Test UserSerializer with new fields"""
    
    print("=" * 70)
    print("PROFILE ENHANCEMENTS - Backend Test")
    print("=" * 70)
    
    # Get or create a test agent
    agent, created = User.objects.get_or_create(
        phonenumber='712345678',
        defaults={
            'email': 'testagent@patabima.com',
            'role': 'AGENT',
            'is_staff': True
        }
    )
    
    if created:
        print(f"\n✅ Created test agent: {agent.phonenumber}")
        agent.set_password('testpass123')
        agent.save()
    else:
        print(f"\n✅ Using existing agent: {agent.phonenumber}")
    
    # Update last_login to simulate recent login
    agent.last_login = timezone.now()
    agent.save()
    
    # Create a fake request context
    factory = RequestFactory()
    django_request = factory.get('/api/v1/users/current')
    request = Request(django_request)
    
    # Serialize the user
    serializer = UserSerializer(agent, context={'request': request})
    data = serializer.data
    
    print("\n" + "=" * 70)
    print("SERIALIZED USER DATA")
    print("=" * 70)
    print(json.dumps(data, indent=2, default=str))
    
    # Validate fields
    print("\n" + "=" * 70)
    print("FIELD VALIDATION")
    print("=" * 70)
    
    required_fields = [
        'email', 'role', 'full_names', 'agent_code', 
        'phonenumber', 'last_login', 'next_commission_date'
    ]
    
    for field in required_fields:
        if field in data:
            value = data[field]
            if value is not None:
                print(f"✅ {field}: {value}")
            else:
                print(f"⚠️  {field}: None (may be expected for new users)")
        else:
            print(f"❌ {field}: MISSING!")
    
    # Test next_commission_date logic
    print("\n" + "=" * 70)
    print("COMMISSION DATE LOGIC TEST")
    print("=" * 70)
    
    if data.get('next_commission_date'):
        next_date = datetime.fromisoformat(data['next_commission_date'].replace('Z', '+00:00'))
        now = timezone.now()
        
        print(f"Today: {now.strftime('%Y-%m-%d')}")
        print(f"Next Commission Date: {next_date.strftime('%Y-%m-%d')}")
        
        days_until = (next_date.date() - now.date()).days
        print(f"Days until payout: {days_until}")
        
        # Validate it's the 15th
        if next_date.day == 15:
            print("✅ Commission date is on the 15th (correct)")
        else:
            print(f"❌ Commission date is on the {next_date.day} (should be 15th)")
        
        # Validate it's in the future
        if next_date > now:
            print("✅ Commission date is in the future (correct)")
        else:
            print("❌ Commission date is in the past (incorrect)")
    else:
        print("⚠️  No commission date (user might be CUSTOMER role)")
    
    # Test with CUSTOMER role
    print("\n" + "=" * 70)
    print("CUSTOMER ROLE TEST")
    print("=" * 70)
    
    customer, created = User.objects.get_or_create(
        phonenumber='723456789',
        defaults={
            'email': 'customer@example.com',
            'role': 'CUSTOMER'
        }
    )
    
    customer_serializer = UserSerializer(customer, context={'request': request})
    customer_data = customer_serializer.data
    
    print(f"Customer agent_code: {customer_data.get('agent_code')} (should be None)")
    print(f"Customer next_commission_date: {customer_data.get('next_commission_date')} (should be None)")
    
    if customer_data.get('agent_code') is None:
        print("✅ CUSTOMER has no agent_code (correct)")
    else:
        print("❌ CUSTOMER should not have agent_code")
    
    if customer_data.get('next_commission_date') is None:
        print("✅ CUSTOMER has no commission date (correct)")
    else:
        print("❌ CUSTOMER should not have commission date")
    
    print("\n" + "=" * 70)
    print("TEST COMPLETE")
    print("=" * 70)

if __name__ == '__main__':
    test_user_serializer()

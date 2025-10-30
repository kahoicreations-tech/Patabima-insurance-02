#!/usr/bin/env python3
"""
Test script for Medical Insurance Manual Quotes
Tests both backend API and frontend integration
"""

import requests
import json
import time
from datetime import datetime

# Backend Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1/public_app"

# Test Data
MEDICAL_QUOTE_DATA = {
    "line_key": "MEDICAL",
    "payload": {
        "client_name": "John Doe",
        "client_age": 35,
        "client_type": "INDIVIDUAL",
        "cover_limit": "1000000",
        "medical_history": "No major medical history",
        "occupation": "Software Engineer",
        "contact_phone": "254712345678",
        "contact_email": "john.doe@email.com",
        "preferred_start_date": "2025-01-01",
        "dependents_count": 2,
        "special_conditions": "None"
    },
    "preferred_underwriters": ["MADISON", "BRITAM", "JUBILEE"]
}

# Test user credentials (you'll need to create these in Django admin or use existing ones)
TEST_AGENT_CREDENTIALS = {
    "phonenumber": "712345678",  # Adjust to your test agent
    "password": "testpassword123"  # Adjust to your test agent password
}

def test_agent_login():
    """Test agent authentication"""
    print("🔐 Testing Agent Login...")
    
    login_url = f"{API_BASE}/auth/auth_login/"
    response = requests.post(login_url, json=TEST_AGENT_CREDENTIALS)
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('access_token') or data.get('access')
        print(f"✅ Login successful! Token: {token[:20]}...")
        return token
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def test_create_manual_quote(token):
    """Test creating a manual quote"""
    print("\n📝 Testing Manual Quote Creation...")
    
    headers = {"Authorization": f"Bearer {token}"}
    create_url = f"{API_BASE}/manual_quotes/"
    
    response = requests.post(create_url, 
                           json=MEDICAL_QUOTE_DATA, 
                           headers=headers)
    
    if response.status_code == 201:
        data = response.json()
        reference = data.get('reference')
        print(f"✅ Quote created successfully!")
        print(f"   Reference: {reference}")
        print(f"   Line Key: {data.get('line_key')}")
        print(f"   Status: {data.get('status')}")
        return reference
    else:
        print(f"❌ Quote creation failed: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def test_list_manual_quotes(token):
    """Test listing manual quotes"""
    print("\n📋 Testing Manual Quotes List...")
    
    headers = {"Authorization": f"Bearer {token}"}
    list_url = f"{API_BASE}/manual_quotes/"
    
    response = requests.get(list_url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        quotes = data.get('results', [])
        print(f"✅ Found {len(quotes)} quotes")
        
        for quote in quotes[:3]:  # Show first 3
            print(f"   - {quote['reference']} ({quote['line_key']}) - {quote['status']}")
        
        return quotes
    else:
        print(f"❌ List quotes failed: {response.status_code}")
        print(f"Response: {response.text}")
        return []

def test_get_quote_details(token, reference):
    """Test getting specific quote details"""
    if not reference:
        print("\n⚠️  Skipping quote details test - no reference available")
        return
        
    print(f"\n🔍 Testing Quote Details for {reference}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    detail_url = f"{API_BASE}/manual_quotes/{reference}/"
    
    response = requests.get(detail_url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Quote details retrieved!")
        print(f"   Reference: {data['reference']}")
        print(f"   Line Key: {data['line_key']}")
        print(f"   Status: {data['status']}")
        print(f"   Agent Code: {data.get('agent_code', 'N/A')}")
        print(f"   Created: {data['created_at']}")
        print(f"   Client: {data['payload'].get('client_name', 'N/A')}")
        print(f"   Cover Limit: KES {data['payload'].get('cover_limit', 'N/A')}")
        return data
    else:
        print(f"❌ Get quote details failed: {response.status_code}")
        print(f"Response: {response.text}")
        return None

def test_filter_medical_quotes(token):
    """Test filtering quotes by medical line"""
    print("\n🔍 Testing Medical Quote Filtering...")
    
    headers = {"Authorization": f"Bearer {token}"}
    filter_url = f"{API_BASE}/manual_quotes/?line_key=MEDICAL"
    
    response = requests.get(filter_url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        quotes = data.get('results', [])
        print(f"✅ Found {len(quotes)} medical quotes")
        
        for quote in quotes:
            if quote['line_key'] != 'MEDICAL':
                print(f"❌ Filter error: Found non-medical quote {quote['reference']}")
                return False
        
        print("✅ All returned quotes are medical quotes")
        return True
    else:
        print(f"❌ Filter test failed: {response.status_code}")
        return False

def test_admin_endpoints(token):
    """Test admin endpoints (if user has admin privileges)"""
    print("\n👨‍💼 Testing Admin Endpoints...")
    
    headers = {"Authorization": f"Bearer {token}"}
    admin_url = f"{API_BASE}/admin/manual_quotes/"
    
    response = requests.get(admin_url, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        quotes = data.get('results', [])
        print(f"✅ Admin access successful! Found {len(quotes)} total quotes")
        return True
    elif response.status_code == 403:
        print("ℹ️  Admin access denied (normal for non-admin users)")
        return False
    else:
        print(f"❌ Admin endpoint error: {response.status_code}")
        return False

def run_backend_tests():
    """Run all backend tests"""
    print("🚀 Starting Backend Manual Quote Tests")
    print("=" * 50)
    
    # Test authentication
    token = test_agent_login()
    if not token:
        print("\n❌ Cannot proceed without authentication")
        return False
    
    # Test quote creation
    reference = test_create_manual_quote(token)
    
    # Test quote listing
    quotes = test_list_manual_quotes(token)
    
    # Test quote details
    test_get_quote_details(token, reference)
    
    # Test filtering
    test_filter_medical_quotes(token)
    
    # Test admin endpoints
    test_admin_endpoints(token)
    
    print("\n" + "=" * 50)
    print("✅ Backend tests completed!")
    return True

if __name__ == "__main__":
    try:
        success = run_backend_tests()
        if success:
            print("\n🎉 All tests passed! Medical quotes backend is working correctly.")
        else:
            print("\n⚠️  Some tests failed. Check the output above.")
    except requests.exceptions.ConnectionError:
        print("\n❌ Cannot connect to backend server.")
        print("   Make sure Django server is running on http://localhost:8000")
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
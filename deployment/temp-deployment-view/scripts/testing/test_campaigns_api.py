"""
Test Campaigns API Endpoints
Usage: python test_campaigns_api.py
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://127.0.0.1:8000/api/v1/public_app"

# Replace with your test user token
# Get this from logging in via the mobile app or Django admin
TOKEN = input("Enter your access token (or press Enter to skip auth test): ").strip()

if not TOKEN:
    print("⚠ No token provided. Will test without authentication (expect 401 errors).")
    HEADERS = {}
else:
    HEADERS = {"Authorization": f"Bearer {TOKEN}"}

print("=" * 80)
print("PataBima Campaigns API Test")
print("=" * 80)

# Test 1: List active campaigns
print("\n📋 Test 1: GET /campaigns - List active campaigns")
print("-" * 80)
try:
    response = requests.get(f"{BASE_URL}/campaigns", headers=HEADERS)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        campaigns = response.json()
        print(f"✅ Success! Found {len(campaigns)} active campaigns")
        
        if campaigns:
            print("\nCampaigns:")
            for i, campaign in enumerate(campaigns, 1):
                print(f"\n  {i}. {campaign.get('title')}")
                print(f"     ID: {campaign.get('id')}")
                print(f"     Type: {campaign.get('campaign_type')}")
                print(f"     Message: {campaign.get('message')}")
                print(f"     CTA: {campaign.get('call_to_action')}")
                print(f"     URL: {campaign.get('action_url')}")
        else:
            print("⚠ No campaigns found. Run: python manage.py shell < create_sample_campaigns.py")
    elif response.status_code == 401:
        print("❌ Unauthorized. Please provide a valid access token.")
        sys.exit(1)
    else:
        print(f"❌ Error: {response.status_code}")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ Exception: {str(e)}")
    sys.exit(1)

# Test 2: Track impression
if response.status_code == 200 and campaigns:
    campaign_id = campaigns[0]['id']
    print(f"\n👁 Test 2: POST /campaigns/{campaign_id}/track - Track impression")
    print("-" * 80)
    
    try:
        track_response = requests.post(
            f"{BASE_URL}/campaigns/{campaign_id}/track",
            headers=HEADERS,
            json={"interaction_type": "IMPRESSION"}
        )
        print(f"Status Code: {track_response.status_code}")
        
        if track_response.status_code == 201:
            print("✅ Success! Impression tracked")
            print(f"Response: {track_response.json()}")
        else:
            print(f"❌ Error: {track_response.status_code}")
            print(f"Response: {track_response.text}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

    # Test 3: Track click
    print(f"\n🖱 Test 3: POST /campaigns/{campaign_id}/track - Track click")
    print("-" * 80)
    
    try:
        track_response = requests.post(
            f"{BASE_URL}/campaigns/{campaign_id}/track",
            headers=HEADERS,
            json={"interaction_type": "CLICK"}
        )
        print(f"Status Code: {track_response.status_code}")
        
        if track_response.status_code == 201:
            print("✅ Success! Click tracked")
            print(f"Response: {track_response.json()}")
        else:
            print(f"❌ Error: {track_response.status_code}")
            print(f"Response: {track_response.text}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

    # Test 4: Invalid interaction type
    print(f"\n⚠️ Test 4: POST /campaigns/{campaign_id}/track - Invalid interaction type")
    print("-" * 80)
    
    try:
        track_response = requests.post(
            f"{BASE_URL}/campaigns/{campaign_id}/track",
            headers=HEADERS,
            json={"interaction_type": "INVALID"}
        )
        print(f"Status Code: {track_response.status_code}")
        
        if track_response.status_code == 400:
            print("✅ Success! Validation working correctly (400 Bad Request)")
            print(f"Response: {track_response.json()}")
        else:
            print(f"⚠ Unexpected status: {track_response.status_code}")
            print(f"Response: {track_response.text}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

print("\n" + "=" * 80)
print("✅ Campaign API Tests Complete!")
print("=" * 80)
print("\nNext steps:")
print("1. Check Django admin for campaign analytics")
print("2. Test mobile app - campaigns should appear in HomeScreen")
print("3. Verify impression/click counts increment in admin")
print("=" * 80)

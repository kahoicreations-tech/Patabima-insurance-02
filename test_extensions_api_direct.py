"""
Test upcoming extensions API endpoint directly
"""
import requests
import json

# Replace with your actual API endpoint and token
BASE_URL = "http://127.0.0.1:8000"  # Update if different
TOKEN = "your-auth-token-here"  # Get from login or use a valid token

headers = {
    "Authorization": f"Token {TOKEN}",
    "Content-Type": "application/json"
}

try:
    response = requests.get(f"{BASE_URL}/api/v1/policies/motor/upcoming-extensions/", headers=headers)
    
    print("="*80)
    print("UPCOMING EXTENSIONS API TEST")
    print("="*80)
    print(f"\nStatus Code: {response.status_code}")
    print(f"\nResponse Headers:")
    for key, value in response.headers.items():
        if key.lower() in ['content-type', 'content-length']:
            print(f"  {key}: {value}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ SUCCESS")
        print(f"Count: {data.get('count', 0)}")
        print(f"\nExtensions Data:")
        print(json.dumps(data.get('extensions', []), indent=2))
    else:
        print(f"\n❌ ERROR")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"❌ Exception: {e}")

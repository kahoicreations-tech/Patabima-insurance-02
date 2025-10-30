"""
Test extensions endpoint with real authentication
"""
import requests
import json

# API Configuration
BASE_URL = "http://127.0.0.1:8000"  # Update if your Django server is on a different port
PHONE = "792865547"
PASSWORD = "Best254#"

print("\n" + "="*80)
print("TESTING UPCOMING EXTENSIONS WITH AUTHENTICATION")
print("="*80 + "\n")

# Step 1: Login
print("Step 1: Authenticating...")
login_data = {
    "phonenumber": PHONE,  # Note: no underscore
    "password": PASSWORD
}

try:
    login_response = requests.post(f"{BASE_URL}/api/v1/public_app/auth/login", json=login_data)
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(f"Response: {login_response.text}")
        exit(1)
    
    login_result = login_response.json()
    token = login_result.get('token') or login_result.get('access_token') or login_result.get('key')
    
    if not token:
        print(f"❌ No token in response")
        print(f"Response: {json.dumps(login_result, indent=2)}")
        exit(1)
    
    print(f"✅ Login successful!")
    print(f"Token: {token[:20]}...")
    
    # Step 2: Get upcoming extensions
    print("\nStep 2: Fetching upcoming extensions...")
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json"
    }
    
    ext_response = requests.get(f"{BASE_URL}/api/v1/policies/motor/upcoming-extensions/", headers=headers)
    
    print(f"Status Code: {ext_response.status_code}")
    
    if ext_response.status_code != 200:
        print(f"❌ Request failed")
        print(f"Response: {ext_response.text}")
        exit(1)
    
    ext_data = ext_response.json()
    print(f"✅ Request successful!")
    print(f"\nResponse:")
    print(f"  Success: {ext_data.get('success')}")
    print(f"  Count: {ext_data.get('count')}")
    
    extensions = ext_data.get('extensions', [])
    print(f"\n  Extensions found: {len(extensions)}")
    
    # Check for POL-2025-560572
    found_560572 = False
    for ext in extensions:
        policy_no = ext.get('policy_number') or ext.get('policyNo')
        print(f"\n  📋 {policy_no}")
        print(f"     Vehicle: {ext.get('vehicleReg')} - {ext.get('vehicleMake')} {ext.get('vehicleModel')}")
        print(f"     Product: {ext.get('product_name')}")
        print(f"     Status: {ext.get('status')}")
        print(f"     Days to Initial End: {ext.get('daysToInitialEnd')}")
        print(f"     Days to Balance: {ext.get('daysToBalanceDeadline')}")
        print(f"     Initial Amount: KSh {ext.get('initialAmount')}")
        print(f"     Balance Amount: KSh {ext.get('balanceAmount')}")
        
        if policy_no == 'POL-2025-560572':
            found_560572 = True
    
    print("\n" + "="*80)
    if found_560572:
        print("✅ POL-2025-560572 FOUND in upcoming extensions!")
    else:
        print("❌ POL-2025-560572 NOT FOUND")
        print("\nChecking why...")
        
        # Step 3: Get all motor policies
        print("\nStep 3: Checking all motor policies...")
        policies_response = requests.get(f"{BASE_URL}/api/v1/policies/motor/", headers=headers)
        
        if policies_response.status_code == 200:
            policies_data = policies_response.json()
            all_policies = policies_data.get('policies', [])
            
            print(f"Total policies: {len(all_policies)}")
            
            # Find POL-2025-560572
            target_policy = None
            for p in all_policies:
                if p.get('policy_number') == 'POL-2025-560572':
                    target_policy = p
                    break
            
            if target_policy:
                print(f"\n✓ Found POL-2025-560572 in motor policies")
                print(f"  Status: {target_policy.get('status')}")
                print(f"  Cover Start: {target_policy.get('cover_start_date')}")
                print(f"  Cover End: {target_policy.get('cover_end_date')}")
                print(f"  isExtendible: {target_policy.get('isExtendible')}")
                
                pd = target_policy.get('product_details', {})
                print(f"  product_details.is_extendible: {pd.get('is_extendible')}")
                print(f"  product_details.payment_plan: {pd.get('payment_plan')}")
                print(f"  Has extendible_config: {bool(pd.get('extendible_config'))}")
            else:
                print(f"\n✗ POL-2025-560572 NOT in motor policies response")
    
    print("="*80 + "\n")
    
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to Django server. Is it running on http://127.0.0.1:8000?")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

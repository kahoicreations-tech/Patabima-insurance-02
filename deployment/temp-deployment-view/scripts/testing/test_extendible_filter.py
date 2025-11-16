"""
Test that compare_pricing only returns underwriters with extendible_config for extendible products
"""
import requests
import json

base_url = "http://127.0.0.1:8000"

print("\n" + "="*80)
print("TEST: Compare Pricing - Extendible Product Filter")
print("="*80)

# Test payload for Private Third Party Extended (extendible product)
payload = {
    "category_code": "PRIVATE",
    "subcategory_code": "PRIVATE_THIRD_PARTY_EXT",
    "registration": "kca 234h",
    "cover_start_date": "2025-10-31",
    "sum_insured": 0
}

print(f"\n📤 Request:")
print(f"  Endpoint: {base_url}/api/v1/public_app/insurance/compare_motor_pricing/")
print(f"  Product: PRIVATE_THIRD_PARTY_EXT (Extendible)")
print(f"  Expected underwriters: Only Madison, UAP, Britam (with extendible_config)")

response = requests.post(
    f"{base_url}/api/v1/public_app/insurance/compare_motor_pricing/",
    json=payload,
    headers={'Content-Type': 'application/json'}
)

print(f"\n📥 Response Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    comparisons = data.get('comparisons', [])
    
    print(f"\n✅ SUCCESS - Found {len(comparisons)} underwriters:")
    
    expected = {'MADISON', 'UAP', 'BRITAM'}
    found = set()
    
    for comp in comparisons:
        uw_code = comp.get('underwriter_code')
        uw_name = comp.get('underwriter_name')
        result = comp.get('result', {})
        breakdown = result.get('premium_breakdown', {})  # Changed from 'breakdown'
        
        found.add(uw_code)
        
        # Check if extendible_config exists (at result level, not breakdown level)
        extendible_config = result.get('extendible_config')  # Changed to look at result level
        
        print(f"\n  {uw_code} - {uw_name}")
        print(f"    Base Premium: KSh {breakdown.get('base_premium', 0):,.2f}")
        print(f"    Total Premium: KSh {breakdown.get('total_premium', 0):,.2f}")
        
        if extendible_config:
            print(f"    ✅ Extendible Config:")
            print(f"       Initial: KSh {extendible_config.get('initial_amount', 0):,.2f}")
            print(f"       Balance: KSh {extendible_config.get('balance_amount', 0):,.2f}")
            print(f"       Total Annual: KSh {extendible_config.get('total_annual_premium', 0):,.2f}")
        else:
            print(f"    ❌ NO EXTENDIBLE CONFIG (Should not appear!)")
    
    print(f"\n" + "="*80)
    print("VALIDATION")
    print("="*80)
    
    missing = expected - found
    extra = found - expected
    
    if len(comparisons) == 3 and found == expected:
        print(f"✅ PASSED: Exactly 3 underwriters (Madison, UAP, Britam)")
    else:
        print(f"❌ FAILED:")
        if len(comparisons) != 3:
            print(f"  Expected 3 underwriters, got {len(comparisons)}")
        if missing:
            print(f"  Missing underwriters: {missing}")
        if extra:
            print(f"  Extra underwriters (should not appear): {extra}")
    
    # Verify all have extendible_config
    all_have_extendible = all(
        comp.get('result', {}).get('extendible_config')  # Changed to check result level
        for comp in comparisons
    )
    
    if all_have_extendible:
        print(f"✅ PASSED: All underwriters have extendible_config")
    else:
        print(f"❌ FAILED: Some underwriters missing extendible_config")

else:
    print(f"❌ ERROR: {response.status_code}")
    print(response.text)

print("\n" + "="*80)
print("TEST: Non-Extendible Product (Should show all underwriters)")
print("="*80)

# Test with non-extendible product
payload2 = {
    "category_code": "PRIVATE",
    "subcategory_code": "PRIVATE_COMPREHENSIVE",
    "registration": "kca 234h",
    "cover_start_date": "2025-10-31",
    "sum_insured": 1500000
}

print(f"\n📤 Request:")
print(f"  Product: PRIVATE_COMPREHENSIVE (Non-Extendible)")
print(f"  Expected: All underwriters with this product (CIC, APA, Madison, UAP, etc.)")

response2 = requests.post(
    f"{base_url}/api/v1/public_app/insurance/compare_motor_pricing/",
    json=payload2,
    headers={'Content-Type': 'application/json'}
)

if response2.status_code == 200:
    data2 = response2.json()
    comparisons2 = data2.get('comparisons', [])
    
    print(f"\n✅ Found {len(comparisons2)} underwriters:")
    for comp in comparisons2:
        print(f"  - {comp.get('underwriter_code')} - {comp.get('underwriter_name')}")
    
    if len(comparisons2) > 3:
        print(f"\n✅ PASSED: Non-extendible product shows more underwriters ({len(comparisons2)} > 3)")
    else:
        print(f"\n⚠️  WARNING: Expected more than 3 underwriters for comprehensive")
else:
    print(f"❌ ERROR: {response2.status_code}")

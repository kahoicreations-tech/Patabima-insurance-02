"""
Debug DMVIC Request - Show exact payload being sent
"""
import os
import sys
import django
import json

sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.services.dmvic_service import DMVICService

# Monkey-patch to see exact request
original_make_request = DMVICService._make_authenticated_request

def patched_make_request(self, endpoint, method='GET', data=None):
    print("\n" + "="*80)
    print("🔍 INTERCEPTED REQUEST")
    print("="*80)
    print(f"Endpoint: {endpoint}")
    print(f"Method: {method}")
    print(f"Payload being sent:")
    print(json.dumps(data, indent=4))
    print("="*80 + "\n")
    
    result = original_make_request(self, endpoint, method, data)
    
    print("\n" + "="*80)
    print("📥 INTERCEPTED RESPONSE")
    print("="*80)
    print(json.dumps(result, indent=4, default=str))
    print("="*80 + "\n")
    
    return result

DMVICService._make_authenticated_request = patched_make_request

# Test
dmvic = DMVICService()

# Test with multiple registrations to find one with policy history
test_registrations = [
    'KBL 123A',  # Common test pattern
    'KAA 001A',  # Common test pattern
    'KCA 001A',  # Common test pattern
    'KBA 100B',  # Common test pattern
]

for reg in test_registrations:
    print(f"\n{'='*80}")
    print(f"🔍 Testing: {reg}")
    print('='*80)
    result = dmvic.search_vehicle(reg)
    
    if result and result.get('policy_history'):
        print(f"\n✅ FOUND VEHICLE WITH POLICY HISTORY: {reg}")
        print(f"\n📊 FINAL PROCESSED RESULT:")
        print('='*80)
        print(json.dumps(result, indent=4))
        print('='*80)
        break
    elif result:
        print(f"❌ No policy history for {reg}")
    else:
        print(f"⚠️  Vehicle not found: {reg}")
else:
    print("\n⚠️  None of the test registrations have policy history in DMVIC UAT")
    print("📝 Recommendation: Contact DMVIC support for test vehicles with insurance data")

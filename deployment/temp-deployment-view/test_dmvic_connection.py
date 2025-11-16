"""
Quick DMVIC Connection Test
Tests authentication and vehicle search with real credentials
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.services.dmvic_service import DMVICService
import logging

# Enable detailed logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

def test_dmvic():
    print('=' * 80)
    print('DMVIC CONNECTION TEST')
    print('=' * 80)
    
    # Initialize service
    service = DMVICService()
    print(f'\n✓ Service initialized')
    print(f'  Base URL: {service.base_url}')
    print(f'  Username: {service.username}')
    print(f'  Client ID: {service.client_id[:10]}...')
    print(f'  Member Code: {service.member_code}')
    print(f'  Certificate: {service.pfx_path}')
    print(f'  Passphrase: {"*" * len(service.passphrase or "")}')
    
    # Test login
    print('\n' + '=' * 80)
    print('TEST 1: DMVIC Authentication')
    print('=' * 80)
    try:
        success = service.login()
        if success:
            print('✅ LOGIN SUCCESSFUL!')
            print(f'   Access Token: {service.access_token[:50]}...')
            print(f'   Token Expiry: {service.token_expiry}')
            if service.apim_subscription_key:
                print(f'   APIM Key: {service.apim_subscription_key[:20]}...')
        else:
            print('❌ Login failed (no exception but returned False)')
            return
    except Exception as e:
        print(f'❌ LOGIN ERROR: {str(e)}')
        import traceback
        traceback.print_exc()
        return
    
    # Test vehicle search
    print('\n' + '=' * 80)
    print('TEST 2: Vehicle Search')
    print('=' * 80)
    test_reg = 'KDA123A'
    print(f'Searching for: {test_reg}')
    try:
        result = service.search_vehicle(test_reg)
        print('✅ VEHICLE SEARCH SUCCESSFUL!')
        print('\nVehicle Details:')
        print(f'  Registration: {result.get("registration_number")}')
        print(f'  Make: {result.get("make")}')
        print(f'  Model: {result.get("model")}')
        print(f'  Year: {result.get("year_of_manufacture")}')
        print(f'  Chassis: {result.get("chassis_number")}')
        print(f'  Engine: {result.get("engine_number")}')
        print(f'  Color: {result.get("color")}')
        
        print('\nCover Status:')
        print(f'  Has Active Cover: {result.get("has_active_cover")}')
        if result.get("current_policy"):
            policy = result.get("current_policy")
            print(f'  Policy Number: {policy.get("policy_number")}')
            print(f'  Insurer: {policy.get("member_company")}')
            print(f'  Cover Type: {policy.get("certificate_type")}')
            print(f'  Start Date: {policy.get("cover_start_date")}')
            print(f'  End Date: {policy.get("cover_end_date")}')
        
        print(f'\nPolicy History: {len(result.get("policy_history", []))} records')
        
    except Exception as e:
        print(f'❌ VEHICLE SEARCH ERROR: {str(e)}')
        import traceback
        traceback.print_exc()
        return
    
    print('\n' + '=' * 80)
    print('✅ ALL TESTS PASSED!')
    print('=' * 80)
    print('\nDMVIC integration is working correctly.')
    print('You can now use the Motor 2 flow with real vehicle verification.')

if __name__ == '__main__':
    test_dmvic()

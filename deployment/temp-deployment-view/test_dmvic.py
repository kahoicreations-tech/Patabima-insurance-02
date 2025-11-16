"""
DMVIC Integration Test Script
Tests DMVIC authentication, vehicle search, and double insurance validation.

Usage:
    python test_dmvic.py

Requirements:
    - DMVIC credentials configured in .env file
    - DMVIC_ENABLED=true in .env
    - Django environment properly set up
"""

import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.services.dmvic_service import get_dmvic_service, DMVICAuthenticationError, DMVICAPIError
from django.conf import settings


def print_header(text):
    """Print formatted header"""
    print("\n" + "=" * 70)
    print(f" {text}")
    print("=" * 70)


def print_success(text):
    """Print success message"""
    print(f"✅ {text}")


def print_error(text):
    """Print error message"""
    print(f"❌ {text}")


def print_warning(text):
    """Print warning message"""
    print(f"⚠️  {text}")


def print_info(text):
    """Print info message"""
    print(f"ℹ️  {text}")


def check_configuration():
    """Check if DMVIC is properly configured"""
    print_header("DMVIC Configuration Check")
    
    required_settings = {
        'DMVIC_ENABLED': getattr(settings, 'DMVIC_ENABLED', None),
        'DMVIC_BASE_URL': getattr(settings, 'DMVIC_BASE_URL', None),
        'DMVIC_USERNAME': getattr(settings, 'DMVIC_USERNAME', None),
        'DMVIC_PASSWORD': getattr(settings, 'DMVIC_PASSWORD', None),
        'DMVIC_CLIENT_ID': getattr(settings, 'DMVIC_CLIENT_ID', None),
        'DMVIC_PFX_PATH': getattr(settings, 'DMVIC_PFX_PATH', None),
        'DMVIC_PASSPHRASE': getattr(settings, 'DMVIC_PASSPHRASE', None),
    }
    
    all_configured = True
    
    for key, value in required_settings.items():
        if value:
            if key in ['DMVIC_PASSWORD', 'DMVIC_PASSPHRASE']:
                # Hide sensitive values
                print_success(f"{key}: {'*' * 8}")
            else:
                print_success(f"{key}: {value}")
        else:
            print_error(f"{key}: Not configured")
            all_configured = False
    
    if not all_configured:
        print_warning("\nSome DMVIC settings are missing. Update .env file and restart.")
        return False
    
    # Check if DMVIC is enabled
    if not settings.DMVIC_ENABLED:
        print_warning("\nDMVIC_ENABLED=false. Set to 'true' in .env to test real integration.")
        return False
    
    # Check certificate file
    pfx_path = settings.DMVIC_PFX_PATH
    if not os.path.isabs(pfx_path):
        pfx_path = os.path.join(settings.BASE_DIR, pfx_path)
    
    if os.path.exists(pfx_path):
        print_success(f"Certificate file exists: {pfx_path}")
    else:
        print_error(f"Certificate file not found: {pfx_path}")
        return False
    
    print_success("\n✅ Configuration check passed!")
    return True


def test_authentication():
    """Test DMVIC authentication"""
    print_header("DMVIC Authentication Test")
    
    try:
        print_info("Initializing DMVIC service...")
        dmvic = get_dmvic_service()
        
        print_info("Attempting to authenticate with DMVIC...")
        success = dmvic.login()
        
        if success:
            print_success("DMVIC authentication successful!")
            print_info(f"Access token: {dmvic.access_token[:30]}...")
            print_info(f"Token expires at: {dmvic.token_expiry}")
            return dmvic
        else:
            print_error("DMVIC authentication failed")
            return None
            
    except DMVICAuthenticationError as e:
        print_error(f"Authentication error: {str(e)}")
        return None
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None


def test_vehicle_search(dmvic, test_registrations):
    """Test DMVIC vehicle search"""
    print_header("DMVIC Vehicle Search Test")
    
    for reg in test_registrations:
        print_info(f"\nSearching for vehicle: {reg}")
        
        try:
            vehicle = dmvic.search_vehicle(reg)
            
            print_success(f"Vehicle found!")
            print(f"   Registration: {vehicle.get('registration_number')}")
            print(f"   Make: {vehicle.get('make')}")
            print(f"   Model: {vehicle.get('model')}")
            print(f"   Year: {vehicle.get('year_of_manufacture')}")
            print(f"   Chassis: {vehicle.get('chassis_number')}")
            print(f"   Owner: {vehicle.get('owner_name')}")
            print(f"   Engine Capacity: {vehicle.get('engine_capacity')} cc")
            print(f"   Color: {vehicle.get('color')}")
            
        except DMVICAPIError as e:
            if 'not found' in str(e).lower() or '404' in str(e):
                print_warning(f"Vehicle not found in DMVIC database")
            else:
                print_error(f"API error: {str(e)}")
        except Exception as e:
            print_error(f"Unexpected error: {str(e)}")


def test_double_insurance(dmvic, test_registrations):
    """Test DMVIC double insurance validation"""
    print_header("DMVIC Double Insurance Validation Test")
    
    for reg in test_registrations:
        print_info(f"\nChecking existing cover for: {reg}")
        
        try:
            result = dmvic.validate_double_insurance(reg)
            
            if result.get('exists'):
                policy = result.get('policy', {})
                print_warning("Existing cover found!")
                print(f"   Certificate Number: {policy.get('certificate_number')}")
                print(f"   Insurer: {policy.get('insurer')}")
                print(f"   Insurer Code: {policy.get('insurer_code')}")
                print(f"   Cover Start: {policy.get('cover_start_date')}")
                print(f"   Cover End: {policy.get('cover_end_date')}")
                print(f"   Policy Type: {policy.get('policy_type')}")
            else:
                print_success("No existing cover found - vehicle can be insured")
                
        except DMVICAPIError as e:
            print_error(f"API error: {str(e)}")
        except Exception as e:
            print_error(f"Unexpected error: {str(e)}")


def main():
    """Main test execution"""
    print("\n")
    print("*" * 70)
    print("  DMVIC INTEGRATION TEST SUITE")
    print("  PataBima Insurance Platform")
    print("*" * 70)
    
    # Step 1: Check configuration
    if not check_configuration():
        print_error("\n❌ Configuration check failed. Please fix the issues above.")
        return
    
    # Step 2: Test authentication
    dmvic = test_authentication()
    if not dmvic:
        print_error("\n❌ Authentication failed. Cannot proceed with further tests.")
        return
    
    # Step 3: Test vehicle search
    # Use test registration numbers provided by DMVIC for UAT
    test_registrations = [
        "KCA456B",  # Example test registration (replace with actual DMVIC UAT test data)
        "KDD123A",  # Example test registration
        "KBZ999X",  # Example non-existent registration
    ]
    
    print_info(f"\nUsing test registrations: {', '.join(test_registrations)}")
    print_warning("Replace these with actual DMVIC UAT test registration numbers")
    
    test_vehicle_search(dmvic, test_registrations)
    
    # Step 4: Test double insurance validation
    test_double_insurance(dmvic, test_registrations)
    
    # Summary
    print_header("Test Summary")
    print_success("✅ All tests completed!")
    print_info("\nNext steps:")
    print("  1. If tests passed: DMVIC integration is working correctly")
    print("  2. If tests failed: Check error messages and update credentials")
    print("  3. Update test_registrations with actual DMVIC UAT test data")
    print("  4. Proceed to Phase 2: Frontend integration and certificate issuance")
    

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
    except Exception as e:
        print_error(f"\n❌ Unexpected error in test suite: {str(e)}")
        import traceback
        traceback.print_exc()

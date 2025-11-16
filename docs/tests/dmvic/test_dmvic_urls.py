"""
Test DMVIC URL Configuration
Verifies that DMVIC endpoints are properly configured in Django
"""
import os
import sys
import django

# Setup Django
project_root = os.path.dirname(os.path.abspath(__file__))
insurance_app_path = os.path.join(project_root, 'insurance-app')
sys.path.insert(0, insurance_app_path)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')

try:
    django.setup()
except Exception as e:
    print(f"❌ Django setup failed: {str(e)}")
    sys.exit(1)

from django.urls import get_resolver
from django.urls.resolvers import URLPattern, URLResolver

def get_all_urls(urlpatterns, prefix=''):
    """Recursively get all URLs from urlpatterns"""
    urls = []
    for pattern in urlpatterns:
        if isinstance(pattern, URLPattern):
            path = prefix + str(pattern.pattern)
            name = pattern.name or ''
            callback = pattern.callback
            urls.append({
                'path': path,
                'name': name,
                'callback': callback.__name__ if callback else '',
                'module': callback.__module__ if callback else ''
            })
        elif isinstance(pattern, URLResolver):
            new_prefix = prefix + str(pattern.pattern)
            urls.extend(get_all_urls(pattern.url_patterns, new_prefix))
    return urls

def test_dmvic_urls():
    """Test DMVIC URL configuration"""
    print("=" * 70)
    print("DMVIC URL Configuration Test")
    print("=" * 70)
    
    resolver = get_resolver()
    all_urls = get_all_urls(resolver.url_patterns)
    
    # Filter DMVIC URLs
    dmvic_urls = [url for url in all_urls if 'dmvic' in url['path'].lower()]
    
    if not dmvic_urls:
        print("❌ No DMVIC URLs found!")
        return False
    
    print(f"\n✅ Found {len(dmvic_urls)} DMVIC URLs:\n")
    
    expected_endpoints = [
        'dmvic/search-vehicle/',
        'dmvic/validate-double-insurance/',
        'dmvic/preview-certificate/',
        'dmvic/issue-certificate/',
        'dmvic/confirm-issuance/',
        'dmvic/get-certificate-pdf/',
    ]
    
    found_endpoints = []
    
    for url in dmvic_urls:
        status = "✅" if any(exp in url['path'] for exp in expected_endpoints) else "ℹ️"
        print(f"{status} /{url['path']}")
        print(f"   Name: {url['name']}")
        print(f"   Handler: {url['module']}.{url['callback']}")
        print()
        
        for exp in expected_endpoints:
            if exp in url['path']:
                found_endpoints.append(exp)
    
    # Check if all expected endpoints are found
    print("=" * 70)
    print("Expected Endpoints Check:")
    print("=" * 70)
    
    all_found = True
    for expected in expected_endpoints:
        if expected in found_endpoints:
            print(f"✅ {expected}")
        else:
            print(f"❌ {expected} - NOT FOUND")
            all_found = False
    
    print("\n" + "=" * 70)
    if all_found:
        print("✅ All DMVIC endpoints are properly configured!")
    else:
        print("⚠️ Some expected endpoints are missing")
    print("=" * 70)
    
    return all_found

def test_dmvic_views_import():
    """Test if dmvic_views module can be imported"""
    print("\n" + "=" * 70)
    print("DMVIC Views Import Test")
    print("=" * 70)
    
    try:
        from app.views import dmvic_views
        print("✅ dmvic_views module imported successfully")
        
        # Check for expected functions
        expected_functions = [
            'search_vehicle',
            'validate_double_insurance',
            'preview_certificate',
            'issue_certificate',
            'confirm_certificate_issuance',
            'get_certificate_pdf',
            'determine_certificate_type'
        ]
        
        print("\nExpected Functions:")
        all_found = True
        for func_name in expected_functions:
            if hasattr(dmvic_views, func_name):
                print(f"✅ {func_name}")
            else:
                print(f"❌ {func_name} - NOT FOUND")
                all_found = False
        
        return all_found
        
    except ImportError as e:
        print(f"❌ Failed to import dmvic_views: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def test_models():
    """Test if MotorPolicy model has DMVIC fields"""
    print("\n" + "=" * 70)
    print("MotorPolicy DMVIC Fields Test")
    print("=" * 70)
    
    try:
        from app.models import MotorPolicy
        
        expected_fields = [
            'dmvic_certificate_number',
            'dmvic_transaction_no',
            'dmvic_api_request_number',
            'dmvic_ref_no',
            'dmvic_issuance_request_id',
            'dmvic_certificate_type',
            'dmvic_certificate_pdf_url',
            'dmvic_issued_at',
            'dmvic_confirmed_at',
        ]
        
        all_found = True
        for field_name in expected_fields:
            if hasattr(MotorPolicy, field_name):
                print(f"✅ {field_name}")
            else:
                print(f"❌ {field_name} - NOT FOUND")
                all_found = False
        
        return all_found
        
    except Exception as e:
        print(f"❌ Error checking model fields: {str(e)}")
        return False

if __name__ == "__main__":
    print("\n🔍 Starting DMVIC Implementation Tests...\n")
    
    results = {
        'URLs': test_dmvic_urls(),
        'Views': test_dmvic_views_import(),
        'Models': test_models(),
    }
    
    print("\n" + "=" * 70)
    print("FINAL RESULTS")
    print("=" * 70)
    
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    all_passed = all(results.values())
    
    print("\n" + "=" * 70)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        print("✅ DMVIC backend implementation is properly configured")
    else:
        print("⚠️ SOME TESTS FAILED")
        print("Please review the errors above")
    print("=" * 70)
    
    sys.exit(0 if all_passed else 1)

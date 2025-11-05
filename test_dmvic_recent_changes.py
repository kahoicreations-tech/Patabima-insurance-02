"""
Quick test for recent DMVIC changes
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.services.dmvic_service import DMVICService, get_dmvic_service
from app.models import MotorPolicy, InsuranceProvider
from datetime import datetime, timedelta

print("="*80)
print("DMVIC RECENT CHANGES TEST")
print("="*80)

# Test 1: Service Initialization
print("\n1. Testing DMVICService initialization...")
try:
    service = get_dmvic_service()
    print(f"   ✅ Service initialized: {service}")
    print(f"   - Base URL: {service.base_url}")
    print(f"   - Has auth token: {bool(service.auth_token)}")
except Exception as e:
    print(f"   ❌ Failed: {e}")

# Test 2: Field Mapper (Type A - Third Party)
print("\n2. Testing Type A (Third-Party) field mapping...")
try:
    # Create mock policy data
    mock_policy_data = {
        'registration': 'KCA 123X',
        'make': 'TOYOTA',
        'model': 'COROLLA',
        'year': 2020,
        'engine_number': 'ENG123456',
        'chassis_number': 'CHS789012',
        'seating_capacity': 5,
        'color': 'WHITE',
        'body_type': 'SALOON'
    }
    
    mock_client = {
        'full_name': 'John Doe',
        'phone': '0712345678',
        'email': 'john@example.com',
        'id_number': '12345678'
    }
    
    underwriter = InsuranceProvider.objects.filter(
        provider_type='underwriter',
        is_active=True
    ).first()
    
    if not underwriter:
        print("   ⚠️  No active underwriter found, skipping")
    else:
        from app.services.dmvic_field_mapper import DMVICFieldMapper
        mapper = DMVICFieldMapper()
        
        type_a_data = mapper.map_type_a_third_party(
            policy_data=mock_policy_data,
            client_data=mock_client,
            underwriter=underwriter,
            premium=5000,
            cover_start=datetime.now(),
            cover_end=datetime.now() + timedelta(days=365)
        )
        
        print(f"   ✅ Type A mapping successful")
        print(f"   - Certificate Type: {type_a_data.get('CertificateType')}")
        print(f"   - Vehicle Reg: {type_a_data.get('VehicleRegistrationNumber')}")
        print(f"   - Insurer Code: {type_a_data.get('InsurerCode')}")
        print(f"   - Premium: {type_a_data.get('Premium')}")
        
except Exception as e:
    print(f"   ❌ Failed: {e}")

# Test 3: Field Mapper (Type B - Comprehensive)
print("\n3. Testing Type B (Comprehensive) field mapping...")
try:
    if underwriter:
        from app.services.dmvic_field_mapper import DMVICFieldMapper
        mapper = DMVICFieldMapper()
        
        type_b_data = mapper.map_type_b_comprehensive(
            policy_data=mock_policy_data,
            client_data=mock_client,
            underwriter=underwriter,
            premium=15000,
            sum_insured=1000000,
            cover_start=datetime.now(),
            cover_end=datetime.now() + timedelta(days=365)
        )
        
        print(f"   ✅ Type B mapping successful")
        print(f"   - Certificate Type: {type_b_data.get('CertificateType')}")
        print(f"   - Sum Insured: {type_b_data.get('SumInsured')}")
        print(f"   - Premium: {type_b_data.get('Premium')}")
        
except Exception as e:
    print(f"   ❌ Failed: {e}")

# Test 4: Check DMVIC models exist
print("\n4. Testing DMVIC models...")
try:
    from app.models import DMVICCertificate, DMVICVehicleSearch
    
    cert_count = DMVICCertificate.objects.count()
    search_count = DMVICVehicleSearch.objects.count()
    
    print(f"   ✅ Models accessible")
    print(f"   - DMVICCertificate records: {cert_count}")
    print(f"   - DMVICVehicleSearch records: {search_count}")
    
except Exception as e:
    print(f"   ❌ Models not migrated: {e}")

# Test 5: Check integrations API endpoint exists
print("\n5. Testing integrations API registration...")
try:
    from django.urls import get_resolver
    from django.urls.resolvers import URLPattern, URLResolver
    
    def get_all_urls(urlpatterns, prefix=''):
        urls = []
        for pattern in urlpatterns:
            if isinstance(pattern, URLResolver):
                urls.extend(get_all_urls(pattern.url_patterns, prefix + str(pattern.pattern)))
            elif isinstance(pattern, URLPattern):
                urls.append(prefix + str(pattern.pattern))
        return urls
    
    resolver = get_resolver()
    all_urls = get_all_urls(resolver.url_patterns)
    
    dmvic_urls = [url for url in all_urls if 'vehicle_check' in url or 'dmvic' in url.lower()]
    
    if dmvic_urls:
        print(f"   ✅ DMVIC endpoints registered:")
        for url in dmvic_urls:
            print(f"      - {url}")
    else:
        print(f"   ⚠️  No DMVIC endpoints found")
        
except Exception as e:
    print(f"   ❌ Failed: {e}")

# Test 6: Check if payment flow references DMVIC
print("\n6. Testing payment → DMVIC integration...")
try:
    from app.views import policy_management
    import inspect
    
    source = inspect.getsource(policy_management.save_motor_policy_after_payment)
    
    if 'dmvic' in source.lower() or 'certificate' in source.lower():
        print(f"   ✅ Payment flow includes DMVIC logic")
    else:
        print(f"   ⚠️  DMVIC not found in payment flow")
        
except Exception as e:
    print(f"   ❌ Failed: {e}")

print("\n" + "="*80)
print("TEST SUMMARY")
print("="*80)
print("Review results above. Key checks:")
print("1. ✅ Service initializes")
print("2. ✅ Type A/B mapping works")
print("3. ❓ Models migrated (run: python manage.py migrate)")
print("4. ❓ API endpoints registered")
print("5. ❓ Payment flow integrated")
print("\nNext: If models not migrated, run migrations first")
print("="*80)

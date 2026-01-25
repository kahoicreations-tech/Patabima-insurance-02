#!/usr/bin/env python3
"""Quick DMVIC endpoints test using Django shell"""

import os
import sys

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')

import django
django.setup()

from app.services.dmvic_service import DMVICService
from app.models import DMVICVehicleSearch, MotorPolicy
from django.contrib.auth import get_user_model

User = get_user_model()

print("="*80)
print("DMVIC Endpoints Quick Test")
print("="*80)

# Test 1: Service Initialization
print("\n1️⃣  Testing DMVIC Service Initialization...")
try:
    service = DMVICService()
    print("   ✓ DMVICService initialized")
    print(f"   Base URL: {getattr(service, 'base_url', 'Not configured')}")
    print(f"   Has auth: {bool(getattr(service, 'username', None))}")
except Exception as e:
    print(f"   ✗ Failed: {e}")

# Test 2: Cache Model
print("\n2️⃣  Testing DMVIC Cache Model...")
try:
    count = DMVICVehicleSearch.objects.count()
    print(f"   ✓ Cache model accessible ({count} entries)")
except Exception as e:
    print(f"   ✗ Failed: {e}")

# Test 3: Motor Policy DMVIC Fields
print("\n3️⃣  Testing MotorPolicy DMVIC Fields...")
try:
    # Check if DMVIC fields exist
    from app.models import MotorPolicy
    policy_fields = [f.name for f in MotorPolicy._meta.get_fields()]
    dmvic_fields = [
        'dmvic_certificate_number',
        'dmvic_transaction_no',
        'dmvic_issuance_request_id',
        'dmvic_certificate_type',
        'dmvic_certificate_pdf_url',
        'dmvic_issued_at',
        'dmvic_confirmed_at'
    ]
    
    for field in dmvic_fields:
        if field in policy_fields:
            print(f"   ✓ {field}")
        else:
            print(f"   ✗ Missing: {field}")
except Exception as e:
    print(f"   ✗ Failed: {e}")

# Test 4: Views Registration
print("\n4️⃣  Testing DMVIC Views Registration...")
try:
    from app.views import dmvic_views
    views = [
        'search_vehicle',
        'validate_double_insurance', 
        'preview_certificate',
        'issue_certificate',
        'confirm_certificate_issuance',
        'get_certificate_pdf',
        'dmvic_health_check'
    ]
    
    for view_name in views:
        if hasattr(dmvic_views, view_name):
            print(f"   ✓ {view_name}")
        else:
            print(f"   ✗ Missing: {view_name}")
except Exception as e:
    print(f"   ✗ Failed: {e}")

# Test 5: URL Configuration
print("\n5️⃣  Testing URL Configuration...")
try:
    from django.urls import resolve
    from django.urls.exceptions import Resolver404
    
    urls = [
        '/api/insurance/dmvic/search-vehicle/',
        '/api/insurance/dmvic/validate-double-insurance/',
        '/api/insurance/dmvic/issue-certificate/',
        '/api/insurance/dmvic/health-check/'
    ]
    
    for url in urls:
        try:
            resolved = resolve(url)
            print(f"   ✓ {url} → {resolved.func.__name__}")
        except Resolver404:
            print(f"   ✗ Not found: {url}")
except Exception as e:
    print(f"   ✗ Failed: {e}")

# Test 6: Field Mapper
print("\n6️⃣  Testing DMVIC Field Mapper...")
try:
    from app.services.dmvic_field_mapper import DMVICFieldMapper
    mapper = DMVICFieldMapper()
    print("   ✓ DMVICFieldMapper initialized")
    
    # Check if determine_certificate_type exists
    if hasattr(dmvic_views, 'determine_certificate_type'):
        print("   ✓ determine_certificate_type function exists")
    else:
        print("   ⚠ determine_certificate_type not found in dmvic_views")
except Exception as e:
    print(f"   ✗ Failed: {e}")

print("\n" + "="*80)
print("Test Complete")
print("="*80)

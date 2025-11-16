"""
DMVIC SOAP/WSDL Discovery Script
Tests if DMVIC uses SOAP instead of REST
"""

import os
import sys
import requests
from pathlib import Path
from cryptography.hazmat.primitives.serialization import pkcs12, Encoding, PrivateFormat, NoEncryption
import tempfile

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')

import django
django.setup()

from django.conf import settings

print("\n" + "="*70)
print("  DMVIC WSDL/SOAP DISCOVERY")
print("  Testing for SOAP web services")
print("="*70 + "\n")

base_url = settings.DMVIC_BASE_URL

# Common SOAP/WSDL endpoint patterns
soap_endpoints = [
    "/services",
    "/Services",
    "/webservices",
    "/WebServices",
    "/api.asmx",
    "/DMVICService.svc",
    "/DMVICService.asmx",
    "/MemberService.svc",
    "/MemberService.asmx",
    "/AuthService.svc",
    "/AuthService.asmx",
    "/Login.asmx",
    "/Auth.asmx",
]

wsdl_patterns = [
    "/services?wsdl",
    "/Services?wsdl",
    "/webservices?wsdl",
    "/DMVICService.svc?wsdl",
    "/DMVICService.asmx?wsdl",
    "/MemberService.svc?wsdl",
    "/Login.asmx?wsdl",
]

print("🔍 Testing SOAP/WSDL endpoints...")
print("-" * 70)

all_endpoints = soap_endpoints + wsdl_patterns

for endpoint in all_endpoints:
    full_url = f"{base_url}{endpoint}"
    print(f"\n🔗 Testing: {full_url}")
    
    try:
        response = requests.get(
            full_url,
            verify=True,
            timeout=5
        )
        
        status = response.status_code
        content_type = response.headers.get('Content-Type', '')
        
        print(f"   Status: {status}")
        print(f"   Content-Type: {content_type}")
        
        if status == 200:
            if 'wsdl' in content_type.lower() or 'xml' in content_type.lower():
                print(f"   ✅ WSDL/XML FOUND!")
                print(f"   Response preview: {response.text[:300]}")
            elif 'html' in content_type.lower():
                # Check if it's an ASMX service page
                if '.asmx' in response.text or 'Web Service' in response.text:
                    print(f"   ✅ ASMX Service page found!")
                    print(f"   Response preview: {response.text[:300]}")
                else:
                    print(f"   ℹ️  HTML page (not SOAP)")
            else:
                print(f"   ℹ️  Response: {response.text[:200]}")
        elif status == 404:
            print(f"   ❌ Not Found")
        else:
            print(f"   ⚠️  Status {status}")
            
    except requests.exceptions.Timeout:
        print(f"   ⏱️  Timeout")
    except Exception as e:
        print(f"   ❌ Error: {str(e)[:100]}")

# Also check robots.txt and sitemap
print("\n" + "="*70)
print("  CHECKING DISCOVERY FILES")
print("="*70 + "\n")

for file in ['/robots.txt', '/sitemap.xml', '/.well-known/api']:
    url = f"{base_url}{file}"
    print(f"\n🔗 {url}")
    try:
        response = requests.get(url, timeout=5, verify=True)
        if response.status_code == 200:
            print(f"   ✅ Found!")
            print(f"   {response.text[:300]}")
        else:
            print(f"   ❌ Not found (status {response.status_code})")
    except:
        print(f"   ❌ Error")

print("\n✅ Discovery complete!")
print("\n💡 RECOMMENDATION:")
print("   The DMVIC UAT server responds with an AngularJS web application.")
print("   This suggests:")
print("   1. The API might be at a different subdomain (e.g., api.dmvic.com)")
print("   2. Contact DMVIC support for correct API documentation")
print("   3. Check if there's a member portal with API docs after login")

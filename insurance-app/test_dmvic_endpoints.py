"""
DMVIC Endpoint Discovery Script
Tests different endpoint patterns to find the correct API structure
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
print("  DMVIC ENDPOINT DISCOVERY")
print("  Testing various endpoint patterns")
print("="*70 + "\n")

# Load certificate
pfx_path = os.path.join(os.path.dirname(__file__), settings.DMVIC_PFX_PATH)
print(f"📁 Loading certificate from: {pfx_path}")

with open(pfx_path, 'rb') as f:
    pfx_data = f.read()

private_key, certificate, additional_certs = pkcs12.load_key_and_certificates(
    pfx_data,
    settings.DMVIC_PASSPHRASE.encode()
)

# Write certificate and key to temp files
cert_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.pem')
cert_file.write(certificate.public_bytes(Encoding.PEM).decode())
cert_file.close()

key_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.pem')
key_file.write(private_key.private_bytes(
    Encoding.PEM,
    PrivateFormat.TraditionalOpenSSL,
    NoEncryption()
).decode())
key_file.close()

print("✅ Certificate loaded successfully\n")

# Test different endpoint patterns
base_url = settings.DMVIC_BASE_URL
test_endpoints = [
    "/api/auth/login",
    "/api/Auth/Login",
    "/api/v1/auth/login",
    "/api/v1/Auth/Login",
    "/api/login",
    "/api/Login",
    "/auth/login",
    "/Auth/Login",
    "/login",
    "/Login",
]

payload = {
    "username": settings.DMVIC_USERNAME,
    "password": settings.DMVIC_PASSWORD,
    "client_id": settings.DMVIC_CLIENT_ID
}

print("🔍 Testing endpoints...")
print("-" * 70)

results = []
for endpoint in test_endpoints:
    full_url = f"{base_url}{endpoint}"
    print(f"\n🔗 Testing: {full_url}")
    
    try:
        response = requests.post(
            full_url,
            json=payload,
            cert=(cert_file.name, key_file.name),
            verify=True,
            timeout=10
        )
        
        status = response.status_code
        print(f"   Status: {status}")
        
        if status == 200:
            print(f"   ✅ SUCCESS!")
            print(f"   Response: {response.json()}")
            results.append((endpoint, status, "SUCCESS"))
        elif status == 401:
            print(f"   🔐 Unauthorized (endpoint exists but auth failed)")
            results.append((endpoint, status, "EXISTS - AUTH FAILED"))
        elif status == 404:
            print(f"   ❌ Not Found")
            results.append((endpoint, status, "NOT FOUND"))
        else:
            print(f"   ⚠️ Unexpected status")
            print(f"   Response: {response.text[:200]}")
            results.append((endpoint, status, "UNEXPECTED"))
            
    except requests.exceptions.Timeout:
        print(f"   ⏱️ Timeout")
        results.append((endpoint, None, "TIMEOUT"))
    except requests.exceptions.ConnectionError as e:
        print(f"   🔌 Connection Error: {str(e)[:100]}")
        results.append((endpoint, None, "CONNECTION ERROR"))
    except Exception as e:
        print(f"   ❌ Error: {str(e)[:100]}")
        results.append((endpoint, None, f"ERROR: {str(e)[:50]}"))

# Cleanup temp files
os.unlink(cert_file.name)
os.unlink(key_file.name)

# Summary
print("\n" + "="*70)
print("  SUMMARY")
print("="*70 + "\n")

for endpoint, status, result in results:
    emoji = "✅" if result == "SUCCESS" else "🔐" if "AUTH" in result else "❌"
    print(f"{emoji} {endpoint:<30} | Status: {status or 'N/A':<5} | {result}")

print("\n" + "="*70)

# Also try root endpoint to see if API is responding at all
print("\n🔍 Testing root endpoint for API info...")
try:
    response = requests.get(base_url, timeout=5, verify=True)
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.text[:500]}")
except Exception as e:
    print(f"   Error: {str(e)}")

print("\n✅ Endpoint discovery complete!")

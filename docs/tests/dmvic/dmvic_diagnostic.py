"""
DMVIC Configuration Diagnostic
Shows current DMVIC settings (without exposing sensitive data)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__) + '/insurance-app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')

import django
django.setup()

from django.conf import settings

print("=" * 80)
print("DMVIC Integration Configuration")
print("=" * 80)

print(f"\n1. Base URL: {settings.DMVIC_BASE_URL}")
print(f"2. Client ID: {'***' + settings.DMVIC_CLIENT_ID[-4:] if settings.DMVIC_CLIENT_ID else 'NOT SET'}")
print(f"3. Username: {'***' + settings.DMVIC_USERNAME[-4:] if settings.DMVIC_USERNAME else 'NOT SET'}")
print(f"4. Password: {'SET' if settings.DMVIC_PASSWORD else 'NOT SET'}")
print(f"5. Certificate Path: {settings.DMVIC_CERTIFICATE_PATH}")
print(f"6. Certificate Password: {'SET' if settings.DMVIC_CERTIFICATE_PASSWORD else 'NOT SET'}")
print(f"7. IRA Number: {settings.DMVIC_IRA_NUMBER if hasattr(settings, 'DMVIC_IRA_NUMBER') else 'NOT SET'}")
print(f"8. DMVIC Enabled: {settings.DMVIC_ENABLED}")

print("\n" + "=" * 80)
print("Endpoint Test Results")
print("=" * 80)

print("\nTested endpoints (ALL returned 'invalid API' ER001):")
print("  - /api/v4/Integration/PreviewTypeACertificate")
print("  - /api/VC3/Integration/PreviewTypeACertificate")
print("  - /api/v5/Integration/PreviewTypeACertificate")
print("  - /api/V5/Integration/PreviewTypeACertificate")

print("\n" + "=" * 80)
print("Required Actions")
print("=" * 80)

print("\n1. Contact DMVIC Support:")
print("   - Verify your ClientID has API access")
print("   - Confirm correct endpoint paths for UAT")
print("   - Request IP whitelisting if needed")
print("   - Ask which API version to use (v4, v5, or VC3)")

print("\n2. Verify Environment Variables:")
print("   - Check .env file has DMVIC_CLIENT_ID set")
print("   - Ensure certificate file is accessible")
print("   - Confirm certificate is not expired")

print("\n3. API Documentation:")
print("   - Your screenshots show version 1.7.1 and 1.7.2")
print("   - Different versions have different endpoint paths")
print("   - Spec says v1.8.0 but endpoints may differ in UAT")

print("\n" + "=" * 80)

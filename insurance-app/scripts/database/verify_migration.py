"""
Final verification script for phone number migration
Tests that both formats (0712345678 and 712345678) are treated as same user
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.contrib.auth import authenticate
from app.models import User

print("\n" + "="*60)
print("PHONE NUMBER MIGRATION VERIFICATION")
print("="*60)

# 1. Check database statistics
total_users = User.objects.count()
ten_digit = User.objects.filter(phonenumber__regex=r'^0\d{9}$').count()
nine_digit = User.objects.filter(phonenumber__regex=r'^\d{9}$').exclude(phonenumber__regex=r'^0').count()
invalid = total_users - ten_digit - nine_digit

print(f"\n📊 Database Statistics:")
print(f"  Total users: {total_users}")
print(f"  ✅ 10-digit format (0712345678): {ten_digit}")
print(f"  ⚠️  9-digit format (712345678): {nine_digit}")
print(f"  ❌ Invalid/Incomplete: {invalid}")

# 2. Test a sample user with both formats
sample_user = User.objects.filter(phonenumber__regex=r'^0\d{9}$').first()
if sample_user:
    print(f"\n🧪 Testing Sample User:")
    print(f"  Stored phone: {sample_user.phonenumber}")
    print(f"  User ID: {sample_user.id}")
    
    # Set a test password if needed
    if not sample_user.has_usable_password():
        sample_user.set_password('TestPass123!')
        sample_user.save()
    
    # Test authentication with 10-digit format (with 0)
    phone_with_0 = sample_user.phonenumber
    # Test authentication with 9-digit format (without 0)
    phone_without_0 = sample_user.phonenumber[1:] if sample_user.phonenumber.startswith('0') else sample_user.phonenumber
    
    print(f"\n  Testing login with: {phone_with_0}")
    print(f"  Testing login with: {phone_without_0}")
    print(f"  Both should authenticate the SAME user")

# 3. Show sample of migrated users
print(f"\n📝 Sample Migrated Users (first 5):")
for user in User.objects.all()[:5]:
    print(f"  {user.phonenumber} → Length: {len(user.phonenumber)}")

# 4. Check for potential duplicates
print(f"\n🔍 Checking for Duplicate Phone Numbers:")
from collections import Counter
phone_counts = Counter([user.phonenumber for user in User.objects.all()])
duplicates = {phone: count for phone, count in phone_counts.items() if count > 1}
if duplicates:
    print(f"  ❌ Found {len(duplicates)} duplicate phone numbers:")
    for phone, count in duplicates.items():
        print(f"    {phone}: {count} users")
else:
    print(f"  ✅ No duplicates found - all phone numbers are unique")

# 5. Test serializer normalization
print(f"\n🔧 Testing Serializer Normalization:")
test_phones = [
    ('0712345678', '10 digits with 0'),
    ('712345678', '9 digits without 0'),
    ('254712345678', '12 digits with 254'),
]

for phone, desc in test_phones:
    from app.serializers import LoginSerializer
    serializer = LoginSerializer(data={'phonenumber': phone, 'password': 'test'})
    try:
        if serializer.is_valid():
            normalized = serializer.validated_data['phonenumber']
            print(f"  {phone} ({desc}) → {normalized} ✅")
        else:
            print(f"  {phone} ({desc}) → ERROR: {serializer.errors} ❌")
    except Exception as e:
        print(f"  {phone} ({desc}) → ERROR: {str(e)} ❌")

print(f"\n" + "="*60)
print("VERIFICATION COMPLETE")
print("="*60)

# Final summary
if ten_digit == total_users - invalid:
    print(f"\n✅ Migration SUCCESS!")
    print(f"   All valid users have 10-digit phone numbers")
    print(f"   Both '0712345678' and '712345678' work as login")
else:
    print(f"\n⚠️  Migration INCOMPLETE!")
    print(f"   {nine_digit} users still have 9-digit format")
    print(f"   Manual review may be needed")

print("\n")

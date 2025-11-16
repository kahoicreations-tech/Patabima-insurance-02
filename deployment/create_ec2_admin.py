#!/usr/bin/env python3
"""
Create admin superuser on EC2 production database.
Upload this file to EC2 and run: python3 create_ec2_admin.py
"""
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
sys.path.insert(0, '/var/www/patabima')

try:
    django.setup()
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    # Admin credentials
    PHONE = '0741590055'
    PASSWORD = 'Best254#'
    EMAIL = 'admin@patabima.com'
    
    print("🔍 Checking for existing admin user...")
    
    # Check if user already exists
    existing_user = User.objects.filter(phonenumber=PHONE).first()
    
    if existing_user:
        print(f"⚠️  User with phone {PHONE} already exists!")
        print(f"   Email: {existing_user.email}")
        print(f"   is_staff: {existing_user.is_staff}")
        print(f"   is_admin: {existing_user.is_admin}")
        
        # Update password and permissions
        existing_user.set_password(PASSWORD)
        existing_user.is_staff = True
        existing_user.is_admin = True
        existing_user.email = EMAIL
        existing_user.save()
        
        print("\n✅ Admin user updated successfully!")
        print(f"   Phone: {existing_user.phonenumber}")
        print(f"   Email: {existing_user.email}")
        print(f"   Password: {PASSWORD}")
    else:
        # Create new superuser
        print(f"📝 Creating new admin user...")
        user = User.objects.create_superuser(
            phonenumber=PHONE,
            password=PASSWORD,
            email=EMAIL
        )
        
        print("\n✅ Admin superuser created successfully!")
        print(f"   Phone: {user.phonenumber}")
        print(f"   Email: {user.email}")
        print(f"   Password: {PASSWORD}")
        print(f"   is_staff: {user.is_staff}")
        print(f"   is_admin: {user.is_admin}")
    
    print("\n🌐 Admin Login URL:")
    print("   http://44.200.182.180/admin/login/")
    print("\n🔐 Login Credentials:")
    print(f"   Phone: {PHONE}")
    print(f"   Password: {PASSWORD}")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

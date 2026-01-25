import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import User

count = User.objects.count()
print(f'\n📊 Total users in database: {count}')

if count > 0:
    sample = User.objects.first()
    print(f'Sample user phone: {sample.phonenumber} (length: {len(sample.phonenumber)})')
    
    # Check how many need migration
    nine_digit = User.objects.filter(phonenumber__regex=r'^\d{9}$').count()
    ten_digit = User.objects.filter(phonenumber__regex=r'^0\d{9}$').count()
    
    print(f'\n9-digit phones (need migration): {nine_digit}')
    print(f'10-digit phones (already migrated): {ten_digit}')
else:
    print('No users in database')

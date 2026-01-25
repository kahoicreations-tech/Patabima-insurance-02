import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import User

# Find 9-digit phones
nine_digit_users = User.objects.filter(phonenumber__regex=r'^\d{9}$')

print(f'\nUsers with 9-digit phones: {nine_digit_users.count()}')
for user in nine_digit_users:
    print(f'  - ID: {user.id}, Phone: {user.phonenumber}, Email: {user.email}')

# Show all users for verification
print(f'\n\nAll users:')
for user in User.objects.all()[:10]:
    print(f'{user.phonenumber} (len={len(user.phonenumber)})')

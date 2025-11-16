import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import User

# Find the problematic user
user = User.objects.get(id='f358d3bc-ba14-439b-ac4d-eb402ddb9ae7')
print(f'Before: {user.phonenumber} (length: {len(user.phonenumber)})')

# This phone is incomplete - likely 0792865542
# Let's add leading 0 anyway
if len(user.phonenumber) == 9 and not user.phonenumber.startswith('0'):
    user.phonenumber = '0' + user.phonenumber
    user.save()
    print(f'After: {user.phonenumber} (length: {len(user.phonenumber)})')
else:
    print('Phone already starts with 0 or is wrong length')
    print(f'Current phone: {user.phonenumber}')

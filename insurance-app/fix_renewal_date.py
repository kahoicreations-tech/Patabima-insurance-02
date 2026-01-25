import os
import django
from django.utils import timezone
from dateutil.relativedelta import relativedelta
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorPolicy

# Targeting the most recent policy
p = MotorPolicy.objects.order_by('-date_created').first()

if p:
    print(f"Updating Policy: {p.policy_number}")
    print(f"Old End Date: {p.cover_end_date}")
    
    # Set to expire in 30 days
    new_end_date = timezone.now().date() + datetime.timedelta(days=30)
    p.cover_end_date = new_end_date
    p.save()
    
    print(f"New End Date: {p.cover_end_date}")
    print("Policy should now appear in Upcoming Renewals.")
else:
    print("No policy found to update.")

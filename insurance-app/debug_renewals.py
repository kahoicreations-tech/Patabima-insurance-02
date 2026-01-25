import os
import django
from django.utils import timezone
from dateutil.relativedelta import relativedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorPolicy

print("--- RECENT MOTOR POLICIES DIAGNOSTIC ---")
today = timezone.now().date()
print(f"Current Date: {today}")
print(f"Renewal Window: {today - relativedelta(days=7)} to {today + relativedelta(days=90)}")

policies = MotorPolicy.objects.order_by('-date_created')[:5]

if not policies:
    print("No policies found.")
else:
    for p in policies:
        print(f"\nID: {p.id}")
        print(f"Policy Number: {p.policy_number}")
        print(f"Status: {p.status}")
        print(f"Created: {p.date_created.date()}")
        print(f"Start Date: {p.cover_start_date}")
        print(f"End Date: {p.cover_end_date}")
        
        is_renewable = False
        if p.status == 'ACTIVE' and p.cover_end_date:
            window_start = today - relativedelta(days=7)
            window_end = today + relativedelta(days=90)
            if window_start <= p.cover_end_date <= window_end:
                is_renewable = True
            else:
                days_until = (p.cover_end_date - today).days
                print(f" -> NOT in renewal window (Expires in {days_until} days)")
        
        print(f" -> SHOWS IN RENEWALS: {is_renewable}")
        
        # Checking extension config correctly from JSON
        if p.product_details:
             is_extendible = p.product_details.get('is_extendible', False)
             print(f"Product Details Extendible: {is_extendible}")
             if is_extendible:
                 config = p.product_details.get('extendible_config')
                 print(f"Extendible Config in JSON: {config}")

"""Quick script to clean up duplicate motor subcategories"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import MotorSubcategory
from django.db.models import Count

# Find duplicates
duplicates = MotorSubcategory.objects.values('subcategory_code').annotate(
    count=Count('id')
).filter(count__gt=1)

print(f'Found {len(duplicates)} duplicate subcategory codes')

# For each duplicate, keep the first one and delete the rest
for dup in duplicates:
    code = dup['subcategory_code']
    instances = MotorSubcategory.objects.filter(subcategory_code=code).order_by('id')
    keep = instances.first()
    to_delete = instances.exclude(id=keep.id)
    count = to_delete.count()
    to_delete.delete()
    print(f'  Kept {keep.id}, deleted {count} duplicate(s) for {code}')

print('✓ Cleanup complete')

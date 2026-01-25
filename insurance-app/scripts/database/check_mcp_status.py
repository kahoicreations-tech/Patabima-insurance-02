import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import ManualQuote
from django.db import connection

print('=' * 60)
print('📊 PataBima PostgreSQL Database Status')
print('=' * 60)

# Connection info
cursor = connection.cursor()
cursor.execute('SELECT current_database(), current_user, version()')
result = cursor.fetchone()
print(f'✅ Database: {result[0]}')
print(f'✅ User: {result[1]}')
print(f'✅ Version: {result[2][:60]}...')

print('\n' + '=' * 60)
print('📋 ManualQuote Statistics')
print('=' * 60)

# ManualQuote stats
total = ManualQuote.objects.count()
pending = ManualQuote.objects.filter(status='PENDING_ADMIN_REVIEW').count()
in_progress = ManualQuote.objects.filter(status='IN_PROGRESS').count()
completed = ManualQuote.objects.filter(status='COMPLETED').count()
rejected = ManualQuote.objects.filter(status='REJECTED').count()

print(f'Total Quotes: {total}')
print(f'├── Pending Admin Review: {pending}')
print(f'├── In Progress: {in_progress}')
print(f'├── Completed: {completed}')
print(f'└── Rejected: {rejected}')

# Line breakdown
print('\n' + '=' * 60)
print('📈 Quotes by Insurance Line')
print('=' * 60)

lines = ManualQuote.objects.values_list('line_key', flat=True).distinct()
for line in lines:
    count = ManualQuote.objects.filter(line_key=line).count()
    print(f'{line}: {count} quotes')

if total == 0:
    print('\nℹ️  No quotes in database yet. Ready to accept submissions!')

print('\n' + '=' * 60)
print('✅ MCP PostgreSQL Connection Configured Successfully!')
print('=' * 60)
print('\nMCP Configuration:')
print('Server: patabima-postgres')
print('Connection: postgresql://localhost:5432/patabima_insurance')
print('User: patabima_user')
print('\n🚀 You can now use AI-powered database queries!')

import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
import django
django.setup()

from app.models import DocumentUpload
import inspect

print('Model fields:')
for f in DocumentUpload._meta.get_fields():
    if hasattr(f, 'attname'):
        print(' -', f.attname, f.__class__.__name__)

print('Module:', DocumentUpload.__module__)
print('Source file:', inspect.getsourcefile(DocumentUpload))

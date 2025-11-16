import os
import sys
import django

# Ensure project root is on sys.path
HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(HERE, os.pardir))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from app.models import DocumentUpload

doc = DocumentUpload.objects.order_by('-date_created').first()
if not doc:
    print('NO_DOC')
else:
    print(f"{doc.id} {doc.file_path}")

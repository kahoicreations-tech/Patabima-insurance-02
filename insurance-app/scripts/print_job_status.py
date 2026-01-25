import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(HERE, os.pardir))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')

import django
django.setup()

from app.models import DocumentUpload

def main(job_id: str):
    try:
        doc = DocumentUpload.objects.get(id=job_id)
    except DocumentUpload.DoesNotExist:
        print('NOT_FOUND')
        return
    data = doc.extracted_data or {}
    print('jobId:', doc.id)
    print('state:', doc.processing_status)
    print('objectKey:', doc.file_path)
    print('docType:', doc.document_type)
    # Handle both legacy dict and new structured dict with canonicalFields
    if isinstance(data, dict) and 'canonicalFields' in data:
        fields = data.get('fields') or {}
        canonical = data.get('canonicalFields') or {}
        print('raw_fields_count:', len(fields))
        print('canonical_fields_count:', len(canonical))
        if canonical:
            print('canonical:')
            for k, v in canonical.items():
                print(f"  {k}: {v}")
        if fields:
            keys = list(fields.keys())[:10]
            print('raw_field_keys:', ', '.join(keys))
    else:
        fields = data
        print('fields_count:', len(fields) if isinstance(fields, dict) else 'n/a')
        if isinstance(fields, dict):
            keys = list(fields.keys())[:10]
            print('field_keys:', ', '.join(keys))

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('USAGE: python scripts/print_job_status.py <job_id>')
        sys.exit(2)
    main(sys.argv[1])

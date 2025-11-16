import os
import sys
import json

HERE = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(HERE, os.pardir))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')

import django

django.setup()

from django.db import transaction
from app.models import DocumentUpload
from app.views_docs import _extract_fields


def backfill_one(doc: DocumentUpload) -> bool:
    data = doc.extracted_data or {}
    # Skip if it already has canonicalFields
    if isinstance(data, dict) and 'canonicalFields' in data:
        return False
    # Attempt to synthesize a Textract-like structure if only raw fields exist
    if isinstance(data, dict):
        # Create a fake Textract response with LINEs from keys/values to help canonicalization
        lines = []
        for k, v in data.items():
            lines.append({'BlockType': 'LINE', 'Text': f"{k}: {v}"})
        resp = {'Blocks': lines}
    else:
        return False
    raw_fields, canonical = _extract_fields(resp)
    if not raw_fields and not canonical:
        return False
    with transaction.atomic():
        doc.extracted_data = {'fields': raw_fields or {}, 'canonicalFields': canonical or {}}
        doc.save(update_fields=['extracted_data', 'date_updated'])
    return True


def main(job_id: str | None):
    if job_id:
        try:
            doc = DocumentUpload.objects.get(id=job_id)
        except DocumentUpload.DoesNotExist:
            print('NOT_FOUND')
            return
        changed = backfill_one(doc)
        print('updated' if changed else 'no-change')
        return
    # Global backfill for DONE docs missing canonicalFields
    qs = DocumentUpload.objects.filter(processing_status='DONE')
    count = 0
    for doc in qs.iterator():
        if backfill_one(doc):
            count += 1
    print(f"updated_count: {count}")


if __name__ == '__main__':
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    main(arg)

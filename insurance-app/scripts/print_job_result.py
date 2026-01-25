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


def build_result(doc: DocumentUpload):
    data = doc.extracted_data or {}
    if isinstance(data, dict) and 'canonicalFields' in data:
        fields_out = data.get('canonicalFields') or {}
        raw_out = data.get('fields') or {}
    else:
        fields_out = data if isinstance(data, dict) else {}
        raw_out = data if isinstance(data, dict) else {}
    return {
        'jobId': str(doc.id),
        'objectKey': doc.file_path,
        'docType': doc.document_type,
        'fields': fields_out,
        'rawFields': raw_out,
        'confidenceScores': doc.extraction_confidence,
        'state': doc.processing_status,
    }


def main(job_id: str):
    try:
        doc = DocumentUpload.objects.get(id=job_id)
    except DocumentUpload.DoesNotExist:
        print('NOT_FOUND')
        return
    result = build_result(doc)
    import json
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('USAGE: python scripts/print_job_result.py <job_id>')
        sys.exit(2)
    main(sys.argv[1])

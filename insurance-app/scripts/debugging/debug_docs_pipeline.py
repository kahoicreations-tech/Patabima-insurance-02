import os
import json
import sys
import hmac
import hashlib
from pathlib import Path
from unittest import mock
from urllib import request as urlrequest
from urllib.error import HTTPError, URLError

import boto3

# Ensure the Django project root is on sys.path so `insurance.settings` can be imported
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..', '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')

import django  # noqa: E402
django.setup()

from django.contrib.auth import get_user_model  # noqa: E402
from rest_framework.test import APIClient  # noqa: E402
from app.models import InsuranceQuotation  # noqa: E402


def main():
    # Ensure required env for presign
    # Default to a real bucket if not provided via environment
    os.environ.setdefault('S3_BUCKET', 'patabima-backend-dev-uploads-804686432477')
    os.environ.setdefault('PRESIGN_EXPIRES_SEC', '600')
    os.environ.setdefault('MAX_UPLOAD_MB', '15')

    User = get_user_model()
    # Custom user model uses phonenumber as USERNAME_FIELD
    user, created = User.objects.get_or_create(phonenumber='712345678', defaults={
        'email': 't@example.com'
    })
    if created:
        user.set_password('pass1234')
        user.save()

    client = APIClient()
    client.force_authenticate(user=user)

    # Real AWS by default; set DOCS_MOCK_AWS=1 to force mocking
    use_mock = os.getenv('DOCS_MOCK_AWS', '0') == '1'
    ctx = None
    if use_mock:
        ctx = mock.patch('app.views_docs.boto3.client')
        mock_boto_client = ctx.start()
        s3_instance = mock.Mock()
        s3_instance.generate_presigned_url.return_value = 'https://s3.fake/presigned'
        mock_boto_client.return_value = s3_instance

    try:
        if not use_mock:
            # Useful for debugging 403 AccessDenied: confirms which IAM principal is signing the URL.
            try:
                region = os.environ.get('AWS_REGION') or os.environ.get('AWS_DEFAULT_REGION') or 'us-east-1'
                session = boto3.Session(profile_name=os.getenv('AWS_PROFILE'), region_name=region) if os.getenv('AWS_PROFILE') else boto3.Session(region_name=region)
                ident = session.client('sts', region_name=region).get_caller_identity()
                print(' AWS caller identity:', json.dumps({
                    'Account': ident.get('Account'),
                    'Arn': ident.get('Arn'),
                    'UserId': ident.get('UserId'),
                    'AWS_PROFILE': os.getenv('AWS_PROFILE'),
                }, indent=2))
            except Exception as e:
                print(' WARNING: failed to fetch STS caller identity:', e)

        print('1) Presign... (mocked AWS)' if use_mock else '1) Presign... (real AWS)')
        # Choose test file.
        # - Set DOCS_TEST_FILE to smoke-test a specific local image (recommended).
        # - Otherwise fall back to a known-good repo asset.
        repo_root = Path(__file__).resolve().parents[3]
        test_file = os.getenv('DOCS_TEST_FILE')
        if test_file:
            img_path = Path(test_file).expanduser().resolve()
        else:
            # NOTE: some .jpg files in the repo are placeholders; this one is a real JPEG.
            img_path = repo_root / 'frontend' / 'assets' / 'images' / 'personal-safety.jpg'

        if not img_path.exists():
            raise RuntimeError(f'Cannot find DOCS_TEST_FILE at: {img_path}')

        img_bytes = img_path.read_bytes()
        filename = img_path.name
        ext = img_path.suffix.lower()
        if ext in {'.jpg', '.jpeg'}:
            mime_type = 'image/jpeg'
        elif ext == '.png':
            mime_type = 'image/png'
        elif ext in {'.tif', '.tiff'}:
            mime_type = 'image/tiff'
        elif ext == '.pdf':
            mime_type = 'application/pdf'
        else:
            mime_type = 'application/octet-stream'

        # Allow overriding docType for better canonicalization.
        # For the provided image, DOCS_TEST_DOCTYPE=logbook is appropriate.
        doc_type = os.getenv('DOCS_TEST_DOCTYPE', 'national_id')
        presign_body = {
            'filename': filename,
            'mimeType': mime_type,
            'sizeBytes': len(img_bytes),
            'docType': doc_type,
        }
        r = client.post('/api/v1/public_app/docs/presign', presign_body, format='json')
        assert r.status_code == 200, r.content
        data = r.json()
        print(' presign ok, objectKey=', data['objectKey'])
        upload_url = data.get('uploadUrl')
        if not upload_url:
            raise RuntimeError('presign response missing uploadUrl')

        # If real AWS mode, perform an actual PUT to S3 using the presigned URL
        if not use_mock:
            print(' 2) PUT to S3 via presigned URL...')
            payload = img_bytes
            req = urlrequest.Request(upload_url, data=payload, method='PUT')
            # Must match the headers signed into the presigned URL
            # (Content-Type + SSE headers when required by bucket policy)
            headers = data.get('headers') or {}
            req.add_header('Content-Type', headers.get('Content-Type') or presign_body['mimeType'])
            if headers.get('x-amz-server-side-encryption'):
                req.add_header('x-amz-server-side-encryption', headers['x-amz-server-side-encryption'])
            if headers.get('x-amz-server-side-encryption-aws-kms-key-id'):
                req.add_header(
                    'x-amz-server-side-encryption-aws-kms-key-id',
                    headers['x-amz-server-side-encryption-aws-kms-key-id']
                )
            try:
                with urlrequest.urlopen(req, timeout=20) as resp:
                    code = resp.getcode()
                    if code not in (200, 204):
                        raise RuntimeError(f'Unexpected PUT status: {code}')
                    print('   PUT success with status', code)
                # Persist info for manual verification
                info = {
                    'bucket': os.environ.get('S3_BUCKET'),
                    'objectKey': data['objectKey'],
                    'uploadUrl': upload_url,
                }
                with open('last_presign.json', 'w', encoding='utf-8') as f:
                    json.dump(info, f, indent=2)
            except HTTPError as e:
                body = ''
                try:
                    raw = e.read()
                    body = raw.decode('utf-8', errors='replace') if raw else ''
                except Exception:
                    body = ''
                bucket_region = e.headers.get('x-amz-bucket-region') if getattr(e, 'headers', None) else None
                print('   PUT error headers: x-amz-bucket-region=', bucket_region)
                if body:
                    print('   PUT error body (S3):', body)
                raise RuntimeError(f'PUT failed: HTTP {e.code} {e.reason}') from e
            except URLError as e:
                raise RuntimeError(f'PUT failed: {e.reason}') from e

        print('2) Create test quotation...')
        q = InsuranceQuotation.objects.create(
            agent=user,
            insurance_type='MOTOR_PRIVATE',
            form_data={'debug': True},
        )
        print('   quotation id=', str(q.id))

        print('3) Submit...')
        submit_body = {'objectKey': data['objectKey'], 'docType': doc_type, 'quoteId': str(q.id)}
        r2 = client.post('/api/v1/public_app/docs/submit', submit_body, format='json')
        assert r2.status_code == 200, r2.content
        job_id = r2.json()['jobId']
        print(' submit ok, jobId=', job_id)

        # In real AWS mode, we rely on SQS→Lambda→S3 results (callback is not reachable from Lambda in local dev).
        # In mocked mode, simulate the callback to mark the job DONE.
        if use_mock:
            print('4) Callback simulate (mock mode)...')
            callback_payload = {
                'jobId': job_id,
                'result': {
                    'fields': { 'id_number': '12345678', 'name': 'John Doe' },
                    'canonicalFields': { 'id_number': '12345678', 'name': 'John Doe' },
                    'confidence': 0.98,
                }
            }

            # If CALLBACK_SECRET/DOCS_HMAC_SECRET is configured, CallbackView enforces an HMAC signature
            secret = os.environ.get('CALLBACK_SECRET') or os.environ.get('DOCS_HMAC_SECRET')
            callback_body = json.dumps(callback_payload, separators=(',', ':')).encode('utf-8')
            callback_headers = {}
            if secret:
                sig = hmac.new(secret.encode('utf-8'), callback_body, hashlib.sha256).hexdigest()
                # Django test client uses HTTP_ prefix for custom headers
                callback_headers['HTTP_X_PB_SIGNATURE'] = sig

            r4 = client.post(
                '/api/v1/public_app/docs/callback',
                data=callback_body,
                content_type='application/json',
                **callback_headers,
            )
            assert r4.status_code == 200, r4.content
            print(' callback ok')

        print('4) Poll Status...')
        import time
        deadline = time.time() + 60
        last_state = None
        while True:
            r3 = client.get(f'/api/v1/public_app/docs/status/{job_id}')
            assert r3.status_code == 200, r3.content
            state = r3.json().get('state')
            if state != last_state:
                print('  status:', state)
                last_state = state
            if state in ('DONE', 'FAILED'):
                break
            if time.time() > deadline:
                raise RuntimeError(f'Timed out waiting for DONE/FAILED; last state={state!r}')
            time.sleep(2)

        print('5) Result...')
        r6 = client.get(f'/api/v1/public_app/docs/result/{job_id}')
        assert r6.status_code == 200, r6.content
        res6 = r6.json()
        print(' result:', json.dumps(res6, indent=2))

        # Convenience: print canonical fields at top-level for quick CLI scanning.
        fields = (res6.get('fields') or {}) if isinstance(res6, dict) else {}
        if isinstance(fields, dict) and fields:
            print('\n=== CANONICAL FIELDS ===')
            for k in sorted(fields.keys()):
                v = fields.get(k)
                if v is None:
                    continue
                print(f"- {k}: {v}")
        else:
            print('\n(no canonical fields extracted)')

        diag = res6.get('diagnostics') if isinstance(res6, dict) else None
        if isinstance(diag, dict):
            print('\n=== DIAGNOSTICS ===')
            print('guessedType=', diag.get('guessedType'), 'expectedType=', diag.get('expectedType'))
            print('lineCount=', diag.get('lineCount'), 'wordCount=', diag.get('wordCount'), 'avgWordConfidence=', diag.get('avgWordConfidence'))

        if last_state == 'FAILED':
            raise RuntimeError('Job FAILED (see result payload above)')
    finally:
        if ctx is not None:
            ctx.stop()

    print('SUCCESS: Docs pipeline flow works with ' + ('mocked' if use_mock else 'real') + ' AWS for presign/PUT.')


if __name__ == '__main__':
    main()

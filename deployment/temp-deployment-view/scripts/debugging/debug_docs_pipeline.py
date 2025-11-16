import os
import json
from unittest import mock
from urllib import request as urlrequest
from urllib.error import HTTPError, URLError

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')

import django  # noqa: E402
django.setup()

from django.contrib.auth import get_user_model  # noqa: E402
from rest_framework.test import APIClient  # noqa: E402
from app.models import InsuranceQuotation  # noqa: E402


def main():
    # Ensure required env for presign
    # Default to a real bucket if not provided via environment
    os.environ.setdefault('S3_BUCKET', 'patabima-backend-dev-uploads')
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
        print('1) Presign... (mocked AWS)' if use_mock else '1) Presign... (real AWS)')
        presign_body = {
            'filename': 'id.jpg',
            'mimeType': 'image/jpeg',
            'sizeBytes': 2048,
            'docType': 'national_id',
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
            payload = b'test-upload-' + os.urandom(8)
            req = urlrequest.Request(upload_url, data=payload, method='PUT')
            req.add_header('Content-Type', presign_body['mimeType'])
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
        submit_body = {'objectKey': data['objectKey'], 'docType': 'national_id', 'quoteId': str(q.id)}
        r2 = client.post('/api/v1/public_app/docs/submit', submit_body, format='json')
        assert r2.status_code == 200, r2.content
        job_id = r2.json()['jobId']
        print(' submit ok, jobId=', job_id)

        print('4) Status (PROCESSING)...')
        r3 = client.get(f'/api/v1/public_app/docs/status/{job_id}')
        assert r3.status_code == 200 and r3.json()['state'] == 'PROCESSING', r3.content
        print(' status ok')

        print('5) Callback simulate...')
        callback_payload = {
            'jobId': job_id,
            'result': {
                'fields': { 'id_number': '12345678', 'name': 'John Doe' },
                'confidence': 0.98,
            }
        }
        r4 = client.post('/api/v1/public_app/docs/callback', callback_payload, format='json')
        assert r4.status_code == 200, r4.content
        print(' callback ok')

        print('6) Status (DONE) and Result...')
        r5 = client.get(f'/api/v1/public_app/docs/status/{job_id}')
        assert r5.json()['state'] == 'DONE', r5.content
        r6 = client.get(f'/api/v1/public_app/docs/result/{job_id}')
        res6 = r6.json()
        assert res6['fields'].get('id_number') == '12345678', json.dumps(res6)
        print(' result ok:', json.dumps(res6, indent=2))
    finally:
        if ctx is not None:
            ctx.stop()

    print('SUCCESS: Docs pipeline flow works with ' + ('mocked' if use_mock else 'real') + ' AWS for presign/PUT.')


if __name__ == '__main__':
    main()

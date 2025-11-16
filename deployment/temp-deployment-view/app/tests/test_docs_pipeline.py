import os
import json
from unittest import mock

from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from app.models import DocumentUpload


@override_settings(
    DATABASES={
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }
)
class DocsPipelineTests(TestCase):
    def setUp(self):
        # Minimal required envs
        os.environ.setdefault('S3_BUCKET', 'test-bucket')
        os.environ.setdefault('PRESIGN_EXPIRES_SEC', '600')
        os.environ.setdefault('MAX_UPLOAD_MB', '15')
        # Do not set CALLBACK_SECRET to keep callback open for test

        self.user_model = get_user_model()
        self.user = self.user_model.objects.create_user(
            username='tester', password='pass1234', email='t@example.com'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    @mock.patch('app.views_docs.boto3.client')
    def test_end_to_end_without_aws(self, mock_boto_client):
        # Mock S3 presign
        s3_instance = mock.Mock()
        s3_instance.generate_presigned_url.return_value = 'https://s3.fake/presigned'
        mock_boto_client.return_value = s3_instance

        # 1) Presign
        presign_body = {
            'filename': 'id.jpg',
            'mimeType': 'image/jpeg',
            'sizeBytes': 2048,
            'docType': 'national_id',
        }
        r = self.client.post('/api/v1/public_app/docs/presign', presign_body, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        self.assertIn('uploadUrl', r.data)
        object_key = r.data['objectKey']

        # 2) Submit (SQS not required)
        submit_body = { 'objectKey': object_key, 'docType': 'national_id' }
        r2 = self.client.post('/api/v1/public_app/docs/submit', submit_body, format='json')
        self.assertEqual(r2.status_code, 200, r2.content)
        job_id = r2.data['jobId']

        # Ensure row exists and state is PROCESSING
        doc = DocumentUpload.objects.get(id=job_id)
        self.assertEqual(doc.processing_status, 'PROCESSING')

        # 3) Status should reflect PROCESSING
        r3 = self.client.get(f'/api/v1/public_app/docs/status/{job_id}')
        self.assertEqual(r3.status_code, 200)
        self.assertEqual(r3.data['state'], 'PROCESSING')

        # 4) Simulate Lambda callback (no HMAC secret set)
        callback_payload = {
            'jobId': job_id,
            'result': {
                'fields': {
                    'id_number': '12345678',
                    'name': 'John Doe'
                },
                'confidence': 0.98
            }
        }
        r4 = self.client.post('/api/v1/public_app/docs/callback', callback_payload, format='json')
        self.assertEqual(r4.status_code, 200, r4.content)

        # 5) Status should be DONE and result retrievable
        r5 = self.client.get(f'/api/v1/public_app/docs/status/{job_id}')
        self.assertEqual(r5.data['state'], 'DONE')

        r6 = self.client.get(f'/api/v1/public_app/docs/result/{job_id}')
        self.assertEqual(r6.status_code, 200)
        self.assertEqual(r6.data['fields'].get('id_number'), '12345678')

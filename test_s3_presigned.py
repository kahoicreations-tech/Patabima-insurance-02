#!/usr/bin/env python3
"""
Test S3 presigned URL generation and upload
"""
import os
import sys
import boto3
from botocore.config import Config
import requests

# Set up environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance-app.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'insurance-app'))

# AWS Configuration
AWS_REGION = 'us-east-1'
S3_BUCKET = 'patabima-backend-dev-uploads-804686432477'

def test_presigned_upload():
    """Test generating and using a presigned URL"""
    
    # Create S3 client with SigV4
    config = Config(signature_version='s3v4', region_name=AWS_REGION)
    s3_client = boto3.client('s3', region_name=AWS_REGION, config=config)
    
    # Test file details
    object_key = 'test-uploads/test-document.txt'
    content_type = 'text/plain'
    sse_algo = 'AES256'
    
    # Generate presigned URL with ServerSideEncryption
    put_params = {
        'Bucket': S3_BUCKET,
        'Key': object_key,
        'ContentType': content_type,
        'ServerSideEncryption': sse_algo,
    }
    
    try:
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params=put_params,
            ExpiresIn=3600
        )
        
        print("✅ Presigned URL generated successfully")
        print(f"   URL: {presigned_url[:100]}...")
        
        # Test uploading with the presigned URL
        test_content = b"This is a test document upload"
        
        headers = {
            'Content-Type': content_type,
            'x-amz-server-side-encryption': sse_algo,
        }
        
        print("\n📤 Testing upload with headers:")
        for k, v in headers.items():
            print(f"   {k}: {v}")
        
        response = requests.put(
            presigned_url,
            data=test_content,
            headers=headers
        )
        
        print(f"\n📊 Upload response: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Upload successful!")
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"   Response: {response.text[:500]}")
            
            # Try without SSE header
            print("\n🔄 Retrying without x-amz-server-side-encryption header...")
            headers_no_sse = {'Content-Type': content_type}
            response2 = requests.put(presigned_url, data=test_content, headers=headers_no_sse)
            print(f"   Response: {response2.status_code}")
            if response2.status_code == 200:
                print("✅ Upload successful without explicit SSE header!")
                print("   Note: S3 applied encryption automatically via bucket default")
                
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_presigned_upload()

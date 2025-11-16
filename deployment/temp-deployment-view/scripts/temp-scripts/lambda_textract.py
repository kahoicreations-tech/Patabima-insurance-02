import json
import boto3
import os
import hmac
import hashlib

textract = boto3.client('textract')
s3 = boto3.client('s3')

def lambda_handler(event, context):
    """
    Process document with AWS Textract and save results to S3.
    Triggered by SQS message from Django backend.
    
    Flow:
    1. Receive SQS message with jobId and S3 objectKey
    2. Call Textract AnalyzeDocument (FORMS + TABLES)
    3. Save results to S3 at textract-results/{jobId}.json
    4. Optional: POST callback to Django with HMAC signature
    """
    print(f"Lambda invoked with event: {json.dumps(event, default=str)}")
    
    for record in event.get('Records', []):
        try:
            # Parse SQS message body
            body = json.loads(record['body'])
            job_id = body['jobId']
            object_key = body['objectKey']
            doc_type = body.get('docType', 'generic')
            callback_url = body.get('callbackUrl')
            
            print(f"Processing job {job_id}")
            print(f"  Document: {object_key}")
            print(f"  Type: {doc_type}")
            
            # Get bucket from env or message
            bucket = body.get('bucket') or os.environ.get('S3_BUCKET', 'patabima-backend-dev-uploads')
            
            # Call AWS Textract
            print(f"Calling Textract for s3://{bucket}/{object_key}")
            response = textract.analyze_document(
                Document={
                    'S3Object': {
                        'Bucket': bucket,
                        'Name': object_key
                    }
                },
                FeatureTypes=['FORMS', 'TABLES']
            )
            
            print(f"Textract completed successfully for job {job_id}")
            print(f"  Blocks extracted: {len(response.get('Blocks', []))}")
            
            # Save results to S3
            result_key = f"textract-results/{job_id}.json"
            result_body = json.dumps(response, default=str)
            
            s3.put_object(
                Bucket=bucket,
                Key=result_key,
                Body=result_body,
                ContentType='application/json',
                Metadata={
                    'jobId': job_id,
                    'docType': doc_type,
                    'processedAt': context.aws_request_id
                }
            )
            
            print(f"Results saved to s3://{bucket}/{result_key}")
            
            # Optional: HTTP callback to Django backend
            if callback_url:
                send_callback(callback_url, job_id, response)
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'jobId': job_id,
                    'status': 'completed',
                    'resultKey': result_key
                })
            }
            
        except textract.exceptions.InvalidParameterException as e:
            print(f"Invalid Textract parameter: {str(e)}")
            raise
        except textract.exceptions.UnsupportedDocumentException as e:
            print(f"Unsupported document format: {str(e)}")
            raise
        except Exception as e:
            print(f"Error processing job: {str(e)}")
            raise


def send_callback(callback_url, job_id, textract_response):
    """
    Send HTTP POST callback to Django backend with extraction results.
    Includes HMAC signature for security.
    """
    try:
        import urllib.request
        
        payload = json.dumps({
            'jobId': job_id,
            'result': textract_response
        }, default=str)
        
        # HMAC signature
        secret = os.environ.get('CALLBACK_SECRET', '')
        headers = {'Content-Type': 'application/json'}
        
        if secret:
            sig = hmac.new(
                secret.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            headers['X-PB-Signature'] = sig
            print(f"Callback with HMAC signature to {callback_url}")
        else:
            print(f"Callback without HMAC (no secret) to {callback_url}")
        
        req = urllib.request.Request(
            callback_url,
            data=payload.encode('utf-8'),
            headers=headers,
            method='POST'
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            status = response.getcode()
            body = response.read().decode('utf-8')
            print(f"Callback response {status}: {body[:200]}")
            
    except Exception as cb_err:
        print(f"Callback failed (non-fatal): {str(cb_err)}")
        # Don't raise - S3 polling fallback will handle it

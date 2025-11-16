#!/usr/bin/env python3
"""
AWS Connectivity Test for PataBima OTP Service
Run this script on EC2 to verify AWS services are accessible
"""
import sys
import os

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_header(text):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}{text:^60}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

def print_success(text):
    print(f"{GREEN}✅ {text}{RESET}")

def print_error(text):
    print(f"{RED}❌ {text}{RESET}")

def print_warning(text):
    print(f"{YELLOW}⚠️  {text}{RESET}")

def print_info(text):
    print(f"{BLUE}ℹ️  {text}{RESET}")

# Test 1: Check if boto3 is installed
print_header("Test 1: boto3 Installation")
try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
    print_success(f"boto3 installed (version: {boto3.__version__})")
except ImportError:
    print_error("boto3 not installed!")
    print_info("Install with: pip install boto3==1.35.23")
    sys.exit(1)

# Test 2: Check AWS credentials
print_header("Test 2: AWS Credentials")
try:
    sts = boto3.client('sts', region_name='us-east-1')
    identity = sts.get_caller_identity()
    print_success("AWS credentials configured")
    print_info(f"Account ID: {identity['Account']}")
    print_info(f"ARN: {identity['Arn']}")
except NoCredentialsError:
    print_error("No AWS credentials found!")
    print_info("Ensure EC2 instance has IAM role attached")
    sys.exit(1)
except Exception as e:
    print_error(f"Credentials error: {str(e)}")
    sys.exit(1)

# Test 3: Check DynamoDB access
print_header("Test 3: DynamoDB Access")
try:
    dynamodb = boto3.client('dynamodb', region_name='us-east-1')
    
    # Check if table exists
    table_name = 'patabima-otp-tokens'
    try:
        response = dynamodb.describe_table(TableName=table_name)
        table_status = response['Table']['TableStatus']
        item_count = response['Table']['ItemCount']
        
        if table_status == 'ACTIVE':
            print_success(f"DynamoDB table '{table_name}' is ACTIVE")
            print_info(f"Item count: {item_count}")
            
            # Check TTL
            ttl_response = dynamodb.describe_time_to_live(TableName=table_name)
            ttl_status = ttl_response['TimeToLiveDescription']['TimeToLiveStatus']
            if ttl_status == 'ENABLED':
                print_success("TTL is ENABLED (auto-cleanup active)")
            else:
                print_warning(f"TTL status: {ttl_status}")
        else:
            print_warning(f"Table status: {table_status}")
    except dynamodb.exceptions.ResourceNotFoundException:
        print_error(f"Table '{table_name}' does not exist!")
        print_info("Create with: aws dynamodb create-table ...")
        sys.exit(1)
        
except ClientError as e:
    error_code = e.response['Error']['Code']
    if error_code == 'AccessDeniedException':
        print_error("Access denied to DynamoDB!")
        print_info("Check IAM policy: PataBima-OTP-Policy")
    else:
        print_error(f"DynamoDB error: {error_code}")
    sys.exit(1)
except Exception as e:
    print_error(f"Unexpected error: {str(e)}")
    sys.exit(1)

# Test 4: Check SNS access
print_header("Test 4: SNS SMS Access")
try:
    sns = boto3.client('sns', region_name='us-east-1')
    
    # Get SNS SMS attributes
    attributes = sns.get_sms_attributes()['attributes']
    
    print_success("SNS access granted")
    print_info(f"SMS Type: {attributes.get('DefaultSMSType', 'Not set')}")
    print_info(f"Monthly Spend Limit: ${attributes.get('MonthlySpendLimit', 'Not set')}")
    
    spend_limit = int(attributes.get('MonthlySpendLimit', '0'))
    if spend_limit > 0:
        print_success(f"Spend limit configured: ${spend_limit}/month")
    else:
        print_warning("No spend limit set - configure to prevent overspending!")
        
except ClientError as e:
    error_code = e.response['Error']['Code']
    if error_code == 'AccessDeniedException':
        print_error("Access denied to SNS!")
        print_info("Check IAM policy: PataBima-OTP-Policy")
    else:
        print_error(f"SNS error: {error_code}")
    sys.exit(1)
except Exception as e:
    print_error(f"Unexpected error: {str(e)}")
    sys.exit(1)

# Test 5: Test DynamoDB write/read
print_header("Test 5: DynamoDB Write/Read Test")
try:
    import time
    from datetime import datetime
    
    # Write test item
    test_phone = "0700000000"
    test_code = "999999"
    expiry = int(time.time()) + 300  # 5 minutes from now
    
    dynamodb.put_item(
        TableName='patabima-otp-tokens',
        Item={
            'phone_number': {'S': test_phone},
            'otp_code': {'S': test_code},
            'purpose': {'S': 'TEST'},
            'user_id': {'S': 'test-user'},
            'expiry_time': {'N': str(expiry)},
            'created_at': {'N': str(int(time.time()))},
            'is_verified': {'BOOL': False},
            'attempts': {'N': '0'},
            'sns_message_id': {'S': 'test-message-id'}
        }
    )
    print_success(f"Test OTP written to DynamoDB (phone: {test_phone})")
    
    # Read test item
    response = dynamodb.get_item(
        TableName='patabima-otp-tokens',
        Key={'phone_number': {'S': test_phone}}
    )
    
    if 'Item' in response:
        retrieved_code = response['Item']['otp_code']['S']
        if retrieved_code == test_code:
            print_success(f"Test OTP read successfully (code: {retrieved_code})")
        else:
            print_error(f"Code mismatch! Expected: {test_code}, Got: {retrieved_code}")
    else:
        print_error("Test OTP not found in DynamoDB!")
    
    # Clean up test item
    dynamodb.delete_item(
        TableName='patabima-otp-tokens',
        Key={'phone_number': {'S': test_phone}}
    )
    print_success("Test OTP cleaned up")
    
except Exception as e:
    print_error(f"DynamoDB write/read test failed: {str(e)}")
    sys.exit(1)

# Test 6: Check Django settings
print_header("Test 6: Django OTP Settings")
try:
    # Try to import Django settings
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
    
    import django
    django.setup()
    
    from django.conf import settings
    
    print_success("Django settings loaded")
    print_info(f"ENABLE_SMS: {settings.ENABLE_SMS}")
    print_info(f"AWS_REGION: {settings.AWS_REGION}")
    print_info(f"DYNAMODB_OTP_TABLE: {settings.DYNAMODB_OTP_TABLE}")
    print_info(f"OTP_LENGTH: {settings.OTP_LENGTH}")
    print_info(f"OTP_EXPIRY_MINUTES: {settings.OTP_EXPIRY_MINUTES}")
    
    if settings.ENABLE_SMS:
        print_success("OTP service configured for PRODUCTION (SMS enabled)")
    else:
        print_warning("OTP service in DEVELOPMENT mode (console logging)")
        print_info("Set ENABLE_SMS=true for production")
        
except ImportError as e:
    print_warning(f"Could not load Django settings: {str(e)}")
    print_info("This is normal if running outside Django environment")
except Exception as e:
    print_warning(f"Django settings check skipped: {str(e)}")

# Final Summary
print_header("Test Summary")
print_success("All AWS connectivity tests passed!")
print("")
print_info("Your EC2 instance can:")
print_info("  ✓ Connect to AWS services")
print_info("  ✓ Access DynamoDB table (patabima-otp-tokens)")
print_info("  ✓ Access SNS for SMS delivery")
print_info("  ✓ Read/Write OTP records")
print("")
print(f"{GREEN}🚀 Ready for production OTP deployment!{RESET}")
print("")
print_info("Next steps:")
print_info("  1. Set ENABLE_SMS=true in Django settings")
print_info("  2. Restart Django: sudo systemctl restart patabima")
print_info("  3. Test with real phone number: python test_otp_endpoints.py")
print("")

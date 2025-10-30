# AWS Configuration

This directory contains all AWS-related configuration files, policies, Lambda deployment packages, and scripts for the PataBima application.

## 📁 Structure

```
aws-config/
├── policies/         # IAM policies, S3 bucket policies, CORS configs
├── lambda/          # Lambda deployment packages and test payloads
└── scripts/         # AWS deployment and management scripts
```

## 🔐 Policies Directory

### IAM Policies

**Claims Signer Policy** (`claims-signer-inline-policy.json`)
- Inline policy for claims document signing
- S3 access permissions for claims bucket
- Used by claims processing service

**Lambda Inline Policy** (`lambda-inline-policy.json`)
- Permissions for Lambda function execution
- Textract API access
- S3 bucket read/write permissions

**Trust Policy** (`trust-policy.json`)
- Lambda execution role trust policy
- Defines which services can assume the role

### S3 Bucket Policies

**Uploads Bucket Policy** (`s3-bucket-policy-uploads.json`)
- Public/private access configuration for uploads bucket
- CORS settings for file uploads
- Used for policy documents, claims documents

**Campaign Banners Policy** (`s3-campaign-banners-public-policy.json`)
- Public read access for campaign banner images
- CloudFront integration
- Used by frontend for campaign carousel

**CORS Configuration** (`s3-cors-uploads.json`)
- Cross-Origin Resource Sharing settings
- Allowed methods: GET, POST, PUT
- Allowed origins: Frontend domains

## 📦 Lambda Directory

### Deployment Packages

**lambda.zip** - Current Lambda deployment package
**lambda-deployed.zip** - Production Lambda package

### Test Payloads

**test-lambda-payload.json** - Sample request payload for Lambda testing
**test-lambda-response.json** - Expected Lambda response format
**test-lambda-response2.json** - Alternative response format

### Lambda Function Details

**Function**: AWS Textract OCR Processing  
**Runtime**: Python 3.x  
**Handler**: index.handler  
**Purpose**: Extract text from uploaded document images

**Trigger**: S3 upload event  
**Output**: Extracted text data sent to backend API

## 🛠️ Scripts Directory

### Deployment Scripts

**apply-s3-public-policy.ps1** - PowerShell script to apply S3 bucket policies
```powershell
.\aws-config\scripts\apply-s3-public-policy.ps1
```

**Usage**:
- Applies public read policy to campaign banners bucket
- Updates CORS configuration
- Verifies policy application

## 🚀 Quick Start

### Apply S3 Policies

```powershell
# Navigate to scripts directory
cd aws-config/scripts

# Apply campaign banners public policy
.\apply-s3-public-policy.ps1
```

### Deploy Lambda Function

```bash
# Package Lambda function
cd lambda_build
zip -r ../aws-config/lambda/lambda.zip .

# Deploy using AWS CLI
aws lambda update-function-code \
  --function-name pataBima-textract-ocr \
  --zip-file fileb://aws-config/lambda/lambda.zip
```

### Test Lambda Function

```bash
# Invoke Lambda with test payload
aws lambda invoke \
  --function-name pataBima-textract-ocr \
  --payload file://aws-config/lambda/test-lambda-payload.json \
  --cli-binary-format raw-in-base64-out \
  response.json
```

## 📋 AWS Resources

### S3 Buckets
- **patabima-uploads** - Policy documents, claims documents
- **patabima-campaign-banners** - Campaign banner images (public)
- **patabima-textract-temp** - Temporary storage for Textract processing

### Lambda Functions
- **pataBima-textract-ocr** - Document OCR processing
- **pataBima-claims-signer** - Claims document signing

### IAM Roles
- **PataBimaLambdaExecutionRole** - Lambda execution permissions
- **PataBimaClaimsSignerRole** - Claims signing permissions

## 🔧 Configuration Management

### Environment Variables

Lambda functions use these environment variables:
```
BACKEND_API_URL=https://api.patabima.com
S3_BUCKET_UPLOADS=patabima-uploads
S3_BUCKET_TEMP=patabima-textract-temp
AWS_REGION=us-east-1
```

### Policy Updates

When updating policies:
1. Edit JSON file in `policies/` directory
2. Test policy syntax with AWS Policy Validator
3. Apply using AWS CLI or PowerShell script
4. Verify permissions with test requests

## 🔒 Security Best Practices

- ✅ **Least Privilege**: Policies grant minimum required permissions
- ✅ **Bucket Encryption**: S3 buckets use server-side encryption
- ✅ **CORS Restrictions**: Only allow specific frontend origins
- ✅ **Lambda Timeouts**: Set appropriate timeouts to prevent runaway costs
- ✅ **IAM Roles**: Use roles instead of access keys where possible

## 📝 Notes

- All policy files are JSON format
- Lambda packages are pre-zipped for deployment
- Test payloads match production event structure
- CORS configuration allows frontend file uploads

## 🔗 Related Documentation

- [AWS Deployment Guide](../docs/aws-deployment/)
- [Textract Setup](../docs/backend/textract/)
- [Backend Services](../docs/BACKEND_SERVICES_GUIDE.md)

---

**Last Updated**: October 17, 2025  
**AWS Region**: us-east-1  
**Deployment Method**: AWS CLI + PowerShell

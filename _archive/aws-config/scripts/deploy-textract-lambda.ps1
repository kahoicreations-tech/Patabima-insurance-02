# Deploy Textract Lambda Function to AWS
# This script packages and deploys the lambda_textract.py function with all necessary AWS resources

param(
    [string]$Region = "us-east-1",
    [string]$S3Bucket = "patabima-backend-dev-uploads",
    [string]$FunctionName = "patabima-textract-processor",
    [string]$RoleName = "PatabimaTextractLambdaRole",
    [switch]$CreateQueue,
    [switch]$SkipPackaging,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PataBima Textract Lambda Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ROOT = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$LAMBDA_BUILD_DIR = Join-Path $PROJECT_ROOT "lambda_build"
$LAMBDA_SOURCE = Join-Path $LAMBDA_BUILD_DIR "lambda_textract.py"
$PACKAGE_DIR = Join-Path $LAMBDA_BUILD_DIR "package"
$ZIP_FILE = Join-Path $LAMBDA_BUILD_DIR "lambda_textract.zip"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Region: $Region"
Write-Host "  S3 Bucket: $S3Bucket"
Write-Host "  Function Name: $FunctionName"
Write-Host "  Role Name: $RoleName"
Write-Host "  Lambda Source: $LAMBDA_SOURCE"
Write-Host ""

# Check AWS CLI
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✓ AWS CLI detected: $awsVersion" -ForegroundColor Green
}
catch {
    Write-Host "✗ AWS CLI not found. Please install: https://aws.amazon.com/cli/" -ForegroundColor Red
    exit 1
}

# Check if source exists
if (-not (Test-Path $LAMBDA_SOURCE)) {
    Write-Host "✗ Lambda source not found: $LAMBDA_SOURCE" -ForegroundColor Red
    exit 1
}

if ($DryRun) {
    Write-Host "`n[DRY RUN MODE - No changes will be made]`n" -ForegroundColor Yellow
}

# Step 1: Create IAM Role for Lambda
Write-Host "`n[Step 1/6] Creating IAM Role..." -ForegroundColor Cyan

$TRUST_POLICY = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
"@

$LAMBDA_POLICY = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::$S3Bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "textract:AnalyzeDocument",
        "textract:DetectDocumentText"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:${Region}:*:patabima-textract-queue"
    }
  ]
}
"@

# Check if role exists
$roleExists = aws iam get-role --role-name $RoleName 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✓ Role '$RoleName' already exists" -ForegroundColor Green
    $roleArn = ($roleExists | ConvertFrom-Json).Role.Arn
}
else {
    if (-not $DryRun) {
        # Create role
        $TRUST_POLICY | Out-File -FilePath "$LAMBDA_BUILD_DIR\trust-policy.json" -Encoding utf8
        aws iam create-role --role-name $RoleName --assume-role-policy-document "file://$LAMBDA_BUILD_DIR\trust-policy.json" --description "Lambda execution role for PataBima Textract processing" | Out-Null
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "✗ Failed to create IAM role" -ForegroundColor Red
            exit 1
        }
        
        # Attach policy
        $LAMBDA_POLICY | Out-File -FilePath "$LAMBDA_BUILD_DIR\lambda-policy.json" -Encoding utf8
        aws iam put-role-policy --role-name $RoleName --policy-name "PatabimaTextractPolicy" --policy-document "file://$LAMBDA_BUILD_DIR\lambda-policy.json" | Out-Null
        
        Write-Host "  ✓ Created role '$RoleName'" -ForegroundColor Green
        
        # Get role ARN
        $roleInfo = aws iam get-role --role-name $RoleName | ConvertFrom-Json
        $roleArn = $roleInfo.Role.Arn
        
        # Wait for role to propagate
        Write-Host "  ⏳ Waiting 10 seconds for role to propagate..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
    else {
        Write-Host "  [DRY RUN] Would create role '$RoleName'" -ForegroundColor Yellow
        $roleArn = "arn:aws:iam::123456789012:role/$RoleName"
    }
}

Write-Host "  Role ARN: $roleArn" -ForegroundColor Gray

# Step 2: Create SQS Queue (optional)
if ($CreateQueue) {
    Write-Host "`n[Step 2/6] Creating SQS Queue..." -ForegroundColor Cyan
    
    $queueName = "patabima-textract-queue"
    
    if (-not $DryRun) {
        $queueUrl = aws sqs create-queue --queue-name $queueName --region $Region 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            $queueUrlParsed = ($queueUrl | ConvertFrom-Json).QueueUrl
            Write-Host "  ✓ Queue created: $queueUrlParsed" -ForegroundColor Green
            
            # Get Queue ARN
            $queueAttrs = aws sqs get-queue-attributes --queue-url $queueUrlParsed --attribute-names QueueArn | ConvertFrom-Json
            $queueArn = $queueAttrs.Attributes.QueueArn
            Write-Host "  Queue ARN: $queueArn" -ForegroundColor Gray
        }
        else {
            Write-Host "  ⚠ Queue may already exist or creation failed" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "  [DRY RUN] Would create queue '$queueName'" -ForegroundColor Yellow
    }
}
else {
    Write-Host "`n[Step 2/6] Skipping SQS Queue (use -CreateQueue to create)" -ForegroundColor Gray
}

# Step 3: Package Lambda Function
if (-not $SkipPackaging) {
    Write-Host "`n[Step 3/6] Packaging Lambda Function..." -ForegroundColor Cyan
    
    # Clean previous package
    if (Test-Path $PACKAGE_DIR) {
        Remove-Item -Recurse -Force $PACKAGE_DIR
    }
    if (Test-Path $ZIP_FILE) {
        Remove-Item -Force $ZIP_FILE
    }
    
    New-Item -ItemType Directory -Path $PACKAGE_DIR -Force | Out-Null
    
    # Copy Lambda source
    Copy-Item $LAMBDA_SOURCE -Destination (Join-Path $PACKAGE_DIR "lambda_function.py")
    
    # Note: boto3 is included in Lambda runtime, no need to package it
    Write-Host "  ✓ Lambda source copied" -ForegroundColor Green
    
    # Create ZIP
    Push-Location $PACKAGE_DIR
    Compress-Archive -Path * -DestinationPath $ZIP_FILE -Force
    Pop-Location
    
    $zipSize = (Get-Item $ZIP_FILE).Length / 1KB
    Write-Host "  ✓ Package created: $ZIP_FILE ($([math]::Round($zipSize, 2)) KB)" -ForegroundColor Green
}
else {
    Write-Host "`n[Step 3/6] Skipping packaging (using existing ZIP)" -ForegroundColor Gray
}

# Step 4: Create/Update Lambda Function
Write-Host "`n[Step 4/6] Deploying Lambda Function..." -ForegroundColor Cyan

$functionExists = aws lambda get-function --function-name $FunctionName --region $Region 2>$null
if ($LASTEXITCODE -eq 0) {
    # Update existing function
    if (-not $DryRun) {
        Write-Host "  Updating existing function..." -ForegroundColor Yellow
        aws lambda update-function-code `
            --function-name $FunctionName `
            --zip-file "fileb://$ZIP_FILE" `
            --region $Region | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Function code updated" -ForegroundColor Green
        }
        else {
            Write-Host "  ✗ Failed to update function code" -ForegroundColor Red
            exit 1
        }
        
        # Update configuration
        aws lambda update-function-configuration `
            --function-name $FunctionName `
            --timeout 300 `
            --memory-size 512 `
            --environment "Variables={S3_BUCKET=$S3Bucket}" `
            --region $Region | Out-Null
        
        Write-Host "  ✓ Function configuration updated" -ForegroundColor Green
    }
    else {
        Write-Host "  [DRY RUN] Would update function '$FunctionName'" -ForegroundColor Yellow
    }
}
else {
    # Create new function
    if (-not $DryRun) {
        Write-Host "  Creating new function..." -ForegroundColor Yellow
        aws lambda create-function `
            --function-name $FunctionName `
            --runtime python3.11 `
            --role $roleArn `
            --handler lambda_function.lambda_handler `
            --zip-file "fileb://$ZIP_FILE" `
            --timeout 300 `
            --memory-size 512 `
            --environment "Variables={S3_BUCKET=$S3Bucket}" `
            --region $Region | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Function created successfully" -ForegroundColor Green
        }
        else {
            Write-Host "  ✗ Failed to create function" -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "  [DRY RUN] Would create function '$FunctionName'" -ForegroundColor Yellow
    }
}

# Step 5: Add SQS Trigger (if queue exists)
if ($CreateQueue) {
    Write-Host "`n[Step 5/6] Configuring SQS Trigger..." -ForegroundColor Cyan
    
    if (-not $DryRun) {
        $queueUrlResponse = aws sqs get-queue-url --queue-name "patabima-textract-queue" --region $Region 2>$null
        
        if ($LASTEXITCODE -eq 0) {
            $queueUrl = ($queueUrlResponse | ConvertFrom-Json).QueueUrl
            $queueAttrs = aws sqs get-queue-attributes --queue-url $queueUrl --attribute-names QueueArn | ConvertFrom-Json
            $queueArn = $queueAttrs.Attributes.QueueArn
            
            # Check if event source mapping already exists
            $mappings = aws lambda list-event-source-mappings --function-name $FunctionName --region $Region | ConvertFrom-Json
            $existingMapping = $mappings.EventSourceMappings | Where-Object { $_.EventSourceArn -eq $queueArn }
            
            if ($existingMapping) {
                Write-Host "  ✓ SQS trigger already configured" -ForegroundColor Green
            }
            else {
                aws lambda create-event-source-mapping `
                    --function-name $FunctionName `
                    --event-source-arn $queueArn `
                    --batch-size 10 `
                    --region $Region | Out-Null
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  ✓ SQS trigger added" -ForegroundColor Green
                }
                else {
                    Write-Host "  ⚠ Failed to add SQS trigger (may need manual configuration)" -ForegroundColor Yellow
                }
            }
        }
    }
    else {
        Write-Host "  [DRY RUN] Would configure SQS trigger" -ForegroundColor Yellow
    }
}
else {
    Write-Host "`n[Step 5/6] Skipping SQS trigger (queue not created)" -ForegroundColor Gray
}

# Step 6: Test Lambda Function
Write-Host "`n[Step 6/6] Testing Lambda Function..." -ForegroundColor Cyan

$testEvent = @"
{
  "Records": [
    {
      "body": "{\"jobId\": \"test-job-123\", \"objectKey\": \"dev/test-agent/2025/11/test-doc.jpg\", \"docType\": \"logbook\"}"
    }
  ]
}
"@

if (-not $DryRun) {
    Write-Host "  Running test invocation..." -ForegroundColor Yellow
    $testEvent | Out-File -FilePath "$LAMBDA_BUILD_DIR\test-event.json" -Encoding utf8
    
    $invokeResult = aws lambda invoke `
        --function-name $FunctionName `
        --payload "file://$LAMBDA_BUILD_DIR\test-event.json" `
        --region $Region `
        "$LAMBDA_BUILD_DIR\test-response.json" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Test invocation successful" -ForegroundColor Green
        
        if (Test-Path "$LAMBDA_BUILD_DIR\test-response.json") {
            $response = Get-Content "$LAMBDA_BUILD_DIR\test-response.json" -Raw
            Write-Host "  Response:" -ForegroundColor Gray
            Write-Host "  $response" -ForegroundColor Gray
        }
    }
    else {
        Write-Host "  ⚠ Test invocation failed (function may work in production)" -ForegroundColor Yellow
        Write-Host "  Error: $invokeResult" -ForegroundColor Gray
    }
}
else {
    Write-Host "  [DRY RUN] Would test function invocation" -ForegroundColor Yellow
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Update Django .env with SQS Queue URL:" -ForegroundColor White
Write-Host "   SQS_QUEUE_URL=https://sqs.$Region.amazonaws.com/<account-id>/patabima-textract-queue" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Verify S3 bucket permissions allow Lambda access" -ForegroundColor White
Write-Host ""
Write-Host "3. Test document upload in the app" -ForegroundColor White
Write-Host ""
Write-Host "Lambda Function Name: $FunctionName" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "[DRY RUN] No actual changes were made. Remove -DryRun to deploy." -ForegroundColor Yellow
}

#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Quick deployment script for PataBima AWS Textract infrastructure
.DESCRIPTION
    Automates the deployment of Lambda, SQS, and related AWS resources for document processing
.EXAMPLE
    .\quick-deploy-textract.ps1
#>

$ErrorActionPreference = 'Stop'

Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "   PataBima - AWS Textract Document Processing Deployment" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan

# Step 1: Check prerequisites
Write-Host "`n[1/6] Checking prerequisites..." -ForegroundColor Yellow

# Check AWS CLI
try {
    $awsVersion = aws --version 2>&1
    Write-Host "  ✓ AWS CLI installed: $($awsVersion -split "`n" | Select-Object -First 1)" -ForegroundColor Green
} catch {
    Write-Host "  ✗ AWS CLI not found. Please install: https://aws.amazon.com/cli/" -ForegroundColor Red
    exit 1
}

# Check AWS credentials
try {
    $identity = aws sts get-caller-identity 2>&1 | ConvertFrom-Json
    Write-Host "  ✓ AWS credentials configured" -ForegroundColor Green
    Write-Host "    Account: $($identity.Account)" -ForegroundColor Gray
    Write-Host "    User: $($identity.Arn)" -ForegroundColor Gray
} catch {
    Write-Host "  ✗ AWS credentials not configured. Run: aws configure" -ForegroundColor Red
    exit 1
}

# Step 2: Configuration
Write-Host "`n[2/6] Configuration..." -ForegroundColor Yellow

$env = 'dev'
$region = 'us-east-1'
$bucketName = 'patabima-backend-dev-uploads'

Write-Host "  Environment: $env" -ForegroundColor Gray
Write-Host "  Region: $region" -ForegroundColor Gray
Write-Host "  S3 Bucket: $bucketName" -ForegroundColor Gray

# Step 3: Check/Create S3 Bucket
Write-Host "`n[3/6] Checking S3 bucket..." -ForegroundColor Yellow

try {
    aws s3 ls "s3://$bucketName" --region $region 2>&1 | Out-Null
    Write-Host "  ✓ S3 bucket exists: $bucketName" -ForegroundColor Green
} catch {
    Write-Host "  ! Bucket doesn't exist. Creating..." -ForegroundColor Yellow
    try {
        aws s3 mb "s3://$bucketName" --region $region
        Write-Host "  ✓ S3 bucket created: $bucketName" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Failed to create bucket: $_" -ForegroundColor Red
        exit 1
    }
}

# Step 4: Generate or use existing callback secret
Write-Host "`n[4/6] Callback secret..." -ForegroundColor Yellow

$envFile = Join-Path $PSScriptRoot ".." ".." "insurance-app" ".env"
$existingSecret = $null

if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    if ($content -match 'CALLBACK_SECRET=([^\s]+)') {
        $existingSecret = $matches[1]
        Write-Host "  ✓ Using existing secret from .env" -ForegroundColor Green
    }
}

if (-not $existingSecret) {
    $secret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Host "  ✓ Generated new callback secret" -ForegroundColor Green
    Write-Host "    Secret: $secret" -ForegroundColor Gray
    Write-Host "    (Save this for Django .env configuration)" -ForegroundColor Yellow
} else {
    $secret = $existingSecret
}

# Step 5: Deploy AWS Infrastructure
Write-Host "`n[5/6] Deploying AWS infrastructure..." -ForegroundColor Yellow
Write-Host "  This may take 2-5 minutes..." -ForegroundColor Gray

try {
    $deployScript = Join-Path $PSScriptRoot "deploy-textract.ps1"
    & $deployScript -Env $env -Region $region -BucketName $bucketName -CallbackSecret $secret
    
    Write-Host "`n  ✓ AWS infrastructure deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "`n  ✗ Deployment failed: $_" -ForegroundColor Red
    exit 1
}

# Step 6: Get outputs and update .env
Write-Host "`n[6/6] Updating Django configuration..." -ForegroundColor Yellow

try {
    $stackName = "patabima-textract-$env"
    $outputs = aws cloudformation describe-stacks --stack-name $stackName --region $region | ConvertFrom-Json
    $queueUrl = ($outputs.Stacks[0].Outputs | Where-Object { $_.OutputKey -eq 'QueueUrl' }).OutputValue
    
    Write-Host "  ✓ Retrieved SQS Queue URL" -ForegroundColor Green
    Write-Host "    URL: $queueUrl" -ForegroundColor Gray
    
    # Update or create .env file
    if (Test-Path $envFile) {
        $content = Get-Content $envFile -Raw
        
        # Update or add each variable
        $updates = @{
            'S3_BUCKET' = $bucketName
            'AWS_REGION' = $region
            'RESULTS_S3_BUCKET' = $bucketName
            'RESULTS_S3_PREFIX' = 'results'
            'RESULTS_KEY_TEMPLATE' = 'results/{jobId}.json'
            'SQS_QUEUE_URL' = $queueUrl
            'CALLBACK_SECRET' = $secret
            'DOCS_MOCK_AWS' = 'false'
        }
        
        foreach ($key in $updates.Keys) {
            if ($content -match "(?m)^$key=") {
                $content = $content -replace "(?m)^$key=.*", "$key=$($updates[$key])"
            } else {
                $content += "`n$key=$($updates[$key])"
            }
        }
        
        Set-Content -Path $envFile -Value $content.TrimEnd()
        Write-Host "  ✓ Updated .env file" -ForegroundColor Green
    } else {
        Write-Host "  ! .env file not found at: $envFile" -ForegroundColor Yellow
        Write-Host "    Please create it manually with the values above" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Failed to update configuration: $_" -ForegroundColor Red
}

# Summary
Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "   Deployment Complete!" -ForegroundColor Green
Write-Host "=====================================================================" -ForegroundColor Cyan

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Restart Django server:" -ForegroundColor White
Write-Host "     cd insurance-app && python manage.py runserver 0.0.0.0:8000" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Test document upload via Motor 2 flow" -ForegroundColor White
Write-Host ""
Write-Host "  3. Monitor Lambda logs:" -ForegroundColor White
Write-Host "     aws logs tail /aws/lambda/patabima-textract-processor-$env --follow" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Check S3 results:" -ForegroundColor White
Write-Host "     aws s3 ls s3://$bucketName/results/" -ForegroundColor Gray

Write-Host "`n📚 Documentation:" -ForegroundColor Cyan
Write-Host "  - Full guide: AWS_TEXTRACT_DEPLOYMENT_GUIDE.md" -ForegroundColor Gray
Write-Host "  - Troubleshooting: docs/aws-docs-pipeline-runbook.md" -ForegroundColor Gray

Write-Host "`n✨ Resources Created:" -ForegroundColor Cyan
Write-Host "  - Lambda: patabima-textract-processor-$env" -ForegroundColor Gray
Write-Host "  - SQS Queue: patabima-textract-$env" -ForegroundColor Gray
Write-Host "  - DLQ: patabima-textract-dlq-$env" -ForegroundColor Gray
Write-Host "  - IAM Role: patabima-textract-role-$env" -ForegroundColor Gray

Write-Host "`n====================================================================`n" -ForegroundColor Cyan

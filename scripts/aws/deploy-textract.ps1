param(
  [string]$Env = 'dev',
  [string]$Region = 'us-east-1',
  [string]$BucketName = 'patabima-backend-dev-uploads',
  [string]$CodeS3Bucket = 'patabima-backend-dev-uploads',
  [string]$CodeS3Key = "lambda/textract_processor-$Env.zip",
  [Parameter(Mandatory = $true)] [string]$CallbackSecret
)

$ErrorActionPreference = 'Stop'

Write-Host "Zipping Lambda code..."
$repoRoot = (Split-Path -Path $PSScriptRoot -Parent) | Split-Path -Parent
Set-Location $repoRoot

$zipPath = Join-Path $repoRoot 'lambda.zip'
$lambdaSrc = Join-Path $repoRoot 'scripts/aws/textract_processor.py'
if (-not (Test-Path $lambdaSrc)) { throw "Lambda source not found: $lambdaSrc" }
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path $lambdaSrc -DestinationPath $zipPath -Force

Write-Host "Uploading code to s3://$CodeS3Bucket/$CodeS3Key"
aws s3 cp $zipPath "s3://$CodeS3Bucket/$CodeS3Key" --region $Region | Out-Null

Write-Host "Deploying CloudFormation stack..."
$StackName = "patabima-textract-$Env"
aws cloudformation deploy `
  --stack-name $StackName `
  --template-file "scripts/aws/textract-stack.yaml" `
  --capabilities CAPABILITY_NAMED_IAM `
  --region $Region `
  --parameter-overrides `
  Env=$Env `
  BucketName=$BucketName `
  CodeS3Bucket=$CodeS3Bucket `
  CodeS3Key=$CodeS3Key `
  CallbackSecret=$CallbackSecret

Write-Host "Fetching outputs..."
$outs = aws cloudformation describe-stacks --stack-name $StackName --region $Region | ConvertFrom-Json
$map = @{}
foreach ($o in $outs.Stacks[0].Outputs) { $map[$o.OutputKey] = $o.OutputValue }

Write-Host "Done. SQS QueueUrl:" $map['QueueUrl']
Write-Host "Set these in Django env and restart:" 
Write-Host "  SQS_QUEUE_URL=$($map['QueueUrl'])"
Write-Host "  DOCS_MOCK_AWS=false"
Write-Host "  DOCS_HMAC_SECRET=(same CallbackSecret)"
Write-Host "  DJANGO_API_URL=http://10.0.2.2:8000  # or your public base URL"

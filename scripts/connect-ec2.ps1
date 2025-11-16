# Connect to PataBima EC2 Instance via SSM Session Manager
# This script allows direct terminal access from your local PowerShell to EC2

Write-Host "🔌 PataBima EC2 Connection Tool" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$AWS_REGION = "us-east-1"
$INSTANCE_TAG = "PataBima-Production"

# Set AWS region
$env:AWS_DEFAULT_REGION = $AWS_REGION

Write-Host "📍 Region: $AWS_REGION" -ForegroundColor Yellow

# Step 1: Check if AWS CLI is installed
Write-Host ""
Write-Host "Checking AWS CLI installation..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version 2>&1
    Write-Host "✅ AWS CLI found: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install AWS CLI from: https://aws.amazon.com/cli/" -ForegroundColor Yellow
    Write-Host "Or run: winget install Amazon.AWSCLI" -ForegroundColor Yellow
    exit 1
}

# Step 2: Check if Session Manager plugin is installed
Write-Host ""
Write-Host "Checking Session Manager plugin..." -ForegroundColor Yellow
try {
    $ssmPluginCheck = session-manager-plugin 2>&1
    Write-Host "✅ Session Manager plugin found" -ForegroundColor Green
} catch {
    Write-Host "❌ Session Manager plugin not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing Session Manager plugin..." -ForegroundColor Yellow
    Write-Host ""
    
    # Download and install SSM plugin
    $pluginUrl = "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/windows/SessionManagerPluginSetup.exe"
    $installerPath = "$env:TEMP\SessionManagerPluginSetup.exe"
    
    Write-Host "Downloading from: $pluginUrl" -ForegroundColor Gray
    Invoke-WebRequest -Uri $pluginUrl -OutFile $installerPath
    
    Write-Host "Installing... (this may take a minute)" -ForegroundColor Gray
    Start-Process -FilePath $installerPath -Args "/quiet /norestart" -Wait
    
    Remove-Item $installerPath -Force
    
    Write-Host "✅ Session Manager plugin installed!" -ForegroundColor Green
    Write-Host "⚠️  Please restart your terminal and run this script again." -ForegroundColor Yellow
    exit 0
}

# Step 3: Check AWS credentials
Write-Host ""
Write-Host "Checking AWS credentials..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity --output json 2>&1 | ConvertFrom-Json
    Write-Host "✅ Authenticated as: $($identity.UserId)" -ForegroundColor Green
    Write-Host "   Account: $($identity.Account)" -ForegroundColor Gray
} catch {
    Write-Host "❌ AWS credentials not configured!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run: aws configure" -ForegroundColor Yellow
    Write-Host "And enter your AWS Access Key ID and Secret Access Key" -ForegroundColor Yellow
    exit 1
}

# Step 4: Find the EC2 instance
Write-Host ""
Write-Host "Finding PataBima EC2 instance..." -ForegroundColor Yellow

$instanceInfo = aws ec2 describe-instances `
    --filters "Name=tag:Name,Values=$INSTANCE_TAG" "Name=instance-state-name,Values=running" `
    --query 'Reservations[0].Instances[0].[InstanceId,State.Name,PublicIpAddress]' `
    --output json 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error finding instance!" -ForegroundColor Red
    Write-Host $instanceInfo -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Tip: Make sure your EC2 instance has the tag: Name=PataBima-Production" -ForegroundColor Yellow
    exit 1
}

$instance = $instanceInfo | ConvertFrom-Json

if (-not $instance -or $instance.Count -eq 0) {
    Write-Host "❌ No running instance found with tag: $INSTANCE_TAG" -ForegroundColor Red
    Write-Host ""
    Write-Host "Available instances:" -ForegroundColor Yellow
    aws ec2 describe-instances --query 'Reservations[].Instances[].[InstanceId,State.Name,Tags[?Key==`Name`].Value|[0]]' --output table
    exit 1
}

$INSTANCE_ID = $instance[0]
$INSTANCE_STATE = $instance[1]
$PUBLIC_IP = $instance[2]

Write-Host "✅ Found instance!" -ForegroundColor Green
Write-Host "   Instance ID: $INSTANCE_ID" -ForegroundColor Gray
Write-Host "   State: $INSTANCE_STATE" -ForegroundColor Gray
Write-Host "   Public IP: $PUBLIC_IP" -ForegroundColor Gray

# Step 5: Check if instance is registered with SSM
Write-Host ""
Write-Host "Checking SSM registration..." -ForegroundColor Yellow

$ssmInfo = aws ssm describe-instance-information `
    --filters "Key=InstanceIds,Values=$INSTANCE_ID" `
    --query 'InstanceInformationList[0].[PingStatus,AgentVersion]' `
    --output json 2>&1

if ($LASTEXITCODE -ne 0 -or $ssmInfo -eq "null" -or -not $ssmInfo) {
    Write-Host "⚠️  Instance not registered with SSM!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "This means the SSM agent is not running on the instance." -ForegroundColor Yellow
    Write-Host "You need to:" -ForegroundColor Yellow
    Write-Host "  1. Connect to the instance using SSH (if you have the key)" -ForegroundColor Gray
    Write-Host "  2. Or use AWS Console -> EC2 -> Connect -> Session Manager" -ForegroundColor Gray
    Write-Host "  3. Run: sudo systemctl start amazon-ssm-agent" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Alternatively, I can show you how to use SSH if you have the key..." -ForegroundColor Yellow
    exit 1
}

$ssmStatus = $ssmInfo | ConvertFrom-Json
Write-Host "✅ SSM Agent Status: $($ssmStatus[0])" -ForegroundColor Green
Write-Host "   Agent Version: $($ssmStatus[1])" -ForegroundColor Gray

# Step 6: Connect!
Write-Host ""
Write-Host "🚀 Connecting to EC2 instance..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You will be connected to: $INSTANCE_ID" -ForegroundColor Yellow
Write-Host "Type 'exit' to disconnect" -ForegroundColor Gray
Write-Host ""

# Start the session
aws ssm start-session --target $INSTANCE_ID

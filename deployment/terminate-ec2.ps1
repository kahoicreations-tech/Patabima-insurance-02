#!/usr/bin/env pwsh
#########################################################
# PataBima EC2 Complete Termination (Nuclear Option)
# WARNING: This DESTROYS the EC2 instance completely
#########################################################

param(
    [Parameter(Mandatory=$false)]
    [string]$InstanceId = "i-0d0f116005d812275",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host ""
Write-Host "==========================================" -ForegroundColor Red
Write-Host "  ⚠️  EC2 TERMINATION WARNING ⚠️" -ForegroundColor Red
Write-Host "==========================================" -ForegroundColor Red
Write-Host ""

# Get instance details
Write-Host "Fetching instance details..." -ForegroundColor Yellow
$instanceInfo = aws ec2 describe-instances --instance-ids $InstanceId --region $Region --query 'Reservations[0].Instances[0].[InstanceId,State.Name,PublicIpAddress,InstanceType,LaunchTime]' --output json | ConvertFrom-Json

Write-Host ""
Write-Host "You are about to PERMANENTLY DELETE:" -ForegroundColor Red
Write-Host "  Instance ID:   $($instanceInfo[0])" -ForegroundColor White
Write-Host "  Status:        $($instanceInfo[1])" -ForegroundColor White
Write-Host "  Public IP:     $($instanceInfo[2])" -ForegroundColor White
Write-Host "  Type:          $($instanceInfo[3])" -ForegroundColor White
Write-Host "  Launched:      $($instanceInfo[4])" -ForegroundColor White
Write-Host ""
Write-Host "THIS ACTION CANNOT BE UNDONE!" -ForegroundColor Red -BackgroundColor Black
Write-Host ""
Write-Host "What will be LOST:" -ForegroundColor Red
Write-Host "  ❌ The entire EC2 instance" -ForegroundColor White
Write-Host "  ❌ All deployed application code" -ForegroundColor White
Write-Host "  ❌ All configuration files" -ForegroundColor White
Write-Host "  ❌ All logs and temporary data" -ForegroundColor White
Write-Host "  ❌ The current public IP address ($($instanceInfo[2]))" -ForegroundColor White
Write-Host ""
Write-Host "What will REMAIN:" -ForegroundColor Green
Write-Host "  ✓ RDS Database (all data safe)" -ForegroundColor White
Write-Host "  ✓ S3 buckets (all files safe)" -ForegroundColor White
Write-Host "  ✓ IAM roles and policies" -ForegroundColor White
Write-Host "  ✓ Security groups" -ForegroundColor White
Write-Host "  ✓ SSH key pair (aws-eb)" -ForegroundColor White
Write-Host ""

# Triple confirmation
Write-Host "Type 'DELETE-INSTANCE' to confirm termination: " -ForegroundColor Yellow -NoNewline
$confirm1 = Read-Host

if ($confirm1 -ne "DELETE-INSTANCE") {
    Write-Host "Termination cancelled." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Are you ABSOLUTELY SURE? Type 'YES-TERMINATE' to proceed: " -ForegroundColor Red -NoNewline
$confirm2 = Read-Host

if ($confirm2 -ne "YES-TERMINATE") {
    Write-Host "Termination cancelled." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Final confirmation. Type the instance ID '$InstanceId' to proceed: " -ForegroundColor Red -NoNewline
$confirm3 = Read-Host

if ($confirm3 -ne $InstanceId) {
    Write-Host "Termination cancelled." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "Proceeding with termination..." -ForegroundColor Red
Write-Host ""

# Terminate the instance
Write-Host "Sending termination command..." -ForegroundColor Yellow
aws ec2 terminate-instances --instance-ids $InstanceId --region $Region

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Yellow
    Write-Host "✓ Instance Termination Initiated" -ForegroundColor Yellow
    Write-Host "==========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Instance $InstanceId is now shutting down." -ForegroundColor White
    Write-Host "It will be fully terminated within a few minutes." -ForegroundColor White
    Write-Host ""
    Write-Host "To create a new EC2 instance, run:" -ForegroundColor Cyan
    Write-Host "  .\deployment\create-fresh-ec2.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Note: You will get a NEW public IP address." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Termination failed!" -ForegroundColor Red
    Write-Host "Check AWS console or IAM permissions." -ForegroundColor Yellow
    exit 1
}

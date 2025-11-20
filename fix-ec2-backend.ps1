# Fix EC2 Backend HTTPS Redirect Issue
# This script disables HTTPS redirect temporarily to allow HTTP connections

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "PataBima EC2 Backend Quick Fix" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$EC2_IP = "44.200.182.180"
$EC2_USER = "ec2-user"

Write-Host "Issue: Backend is forcing HTTPS redirect without SSL certificate" -ForegroundColor Yellow
Write-Host "Solution: Temporarily disable HTTPS redirect for HTTP access`n" -ForegroundColor Green

Write-Host "Target: $EC2_USER@$EC2_IP`n" -ForegroundColor White

# Check if user has SSH key
$sshKeyPath = "$env:USERPROFILE\.ssh\aws-eb"
if (-not (Test-Path $sshKeyPath)) {
    Write-Host "❌ SSH key not found at: $sshKeyPath" -ForegroundColor Red
    Write-Host "`nYou need to:" -ForegroundColor Yellow
    Write-Host "1. Download the aws-eb.pem key from AWS Console" -ForegroundColor Gray
    Write-Host "2. Save it to: $sshKeyPath" -ForegroundColor Gray
    Write-Host "3. Run: icacls `"$sshKeyPath`" /inheritance:r /grant:r `"$($env:USERNAME):R`"`n" -ForegroundColor Gray
    exit 1
}

Write-Host "✓ SSH key found`n" -ForegroundColor Green

Write-Host "Running fix commands on EC2...`n" -ForegroundColor Cyan

# Create the commands to run on EC2
$commands = @"
echo "SECURE_SSL_REDIRECT=False" | sudo tee -a /var/www/patabima/.env
sudo systemctl restart patabima
sleep 3
sudo systemctl status patabima --no-pager -l
echo ""
echo "Testing API endpoint..."
curl -I http://localhost/api/v1/health/
"@

# Execute via SSH
Write-Host "Executing commands..." -ForegroundColor Cyan
ssh -i $sshKeyPath -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" $commands

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n================================" -ForegroundColor Green
    Write-Host "✓ Fix Applied Successfully!" -ForegroundColor Green
    Write-Host "================================`n" -ForegroundColor Green
    
    Write-Host "Testing from your local machine...`n" -ForegroundColor Cyan
    
    try {
        $response = Invoke-WebRequest -Uri "http://$EC2_IP/api/v1/health/" -Method GET -TimeoutSec 10 -UseBasicParsing
        Write-Host "✓ API is responding!" -ForegroundColor Green
        Write-Host "Status: $($response.StatusCode)" -ForegroundColor White
        Write-Host "Content: $($response.Content)`n" -ForegroundColor Gray
        
        Write-Host "================================" -ForegroundColor Cyan
        Write-Host "Your frontend should now work!" -ForegroundColor Green
        Write-Host "================================`n" -ForegroundColor Cyan
    } catch {
        Write-Host "⚠ Could not test from local machine" -ForegroundColor Yellow
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`nBut the fix was applied on EC2. Try your app now.`n" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n❌ Fix failed. Please check SSH connection.`n" -ForegroundColor Red
    Write-Host "Manual fix:" -ForegroundColor Yellow
    Write-Host "1. ssh -i $sshKeyPath $EC2_USER@$EC2_IP" -ForegroundColor Gray
    Write-Host '2. echo "SECURE_SSL_REDIRECT=False" | sudo tee -a /var/www/patabima/.env' -ForegroundColor Gray
    Write-Host "3. sudo systemctl restart patabima`n" -ForegroundColor Gray
}

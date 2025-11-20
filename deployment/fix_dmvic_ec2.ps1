# Fix DMVIC Configuration on EC2 - Windows PowerShell Version
# Run this in AWS CloudShell

$EC2_IP = "44.200.182.180"
$APP_DIR = "/var/www/patabima"

Write-Host "=== Fixing DMVIC Configuration on EC2 ===" -ForegroundColor Green

# Step 1: Create credentials directory
Write-Host "`nStep 1: Creating DMVIC credentials directory..." -ForegroundColor Yellow
ssh -i ~/.ssh/aws-eb ec2-user@$EC2_IP @"
cd /var/www/patabima/insurance-app
sudo mkdir -p dmvic_credentials
sudo chown ec2-user:ec2-user dmvic_credentials
chmod 755 dmvic_credentials
"@

# Step 2: Upload PFX certificate
Write-Host "`nStep 2: Uploading PFX certificate..." -ForegroundColor Yellow
# You'll need to first upload PatabimaAgencyUAT.pfx to CloudShell, then run:
# scp -i ~/.ssh/aws-eb PatabimaAgencyUAT.pfx ec2-user@44.200.182.180:/var/www/patabima/insurance-app/dmvic_credentials/

Write-Host @"

MANUAL STEP REQUIRED:
1. Upload PatabimaAgencyUAT.pfx to CloudShell:
   - In CloudShell, click Actions > Upload file
   - Select: insurance-app/dmvic_credentials/PatabimaAgencyUAT.pfx

2. Then run this command in CloudShell:
   scp -i ~/.ssh/aws-eb ~/PatabimaAgencyUAT.pfx ec2-user@44.200.182.180:/var/www/patabima/insurance-app/dmvic_credentials/

Press Enter when done...
"@ -ForegroundColor Cyan

Read-Host

# Step 3: Set permissions
Write-Host "`nStep 3: Setting permissions..." -ForegroundColor Yellow
ssh -i ~/.ssh/aws-eb ec2-user@$EC2_IP @"
cd /var/www/patabima/insurance-app/dmvic_credentials
chmod 600 PatabimaAgencyUAT.pfx
ls -la
"@

# Step 4: Update systemd service
Write-Host "`nStep 4: Updating systemd service with DMVIC variables..." -ForegroundColor Yellow

$dmvicConfig = @"

# DMVIC Integration
Environment="DMVIC_ENABLED=true"
Environment="DMVIC_BASE_URL=https://uat-api.dmvic.com"
Environment="DMVIC_USERNAME=patabimaagencyapi@dmvic.info"
Environment="DMVIC_PASSWORD=6te224oIUP3l"
Environment="DMVIC_CLIENT_ID=097C69C262EF4350B89E6163E1CEB397"
Environment="DMVIC_MEMBER_CODE=PATABIMA"
Environment="DMVIC_PFX_PATH=dmvic_credentials/PatabimaAgencyUAT.pfx"
Environment="DMVIC_PASSPHRASE=UPfUvocVVOANLqPn"
"@

ssh -i ~/.ssh/aws-eb ec2-user@$EC2_IP "echo '$dmvicConfig' | sudo tee -a /etc/systemd/system/patabima.service > /dev/null"

# Step 5: Reload and restart
Write-Host "`nStep 5: Reloading systemd and restarting service..." -ForegroundColor Yellow
ssh -i ~/.ssh/aws-eb ec2-user@$EC2_IP @"
sudo systemctl daemon-reload
sudo systemctl restart patabima
sleep 3
sudo systemctl status patabima --no-pager
"@

Write-Host "`n=== DMVIC Configuration Complete! ===" -ForegroundColor Green
Write-Host "Test endpoint: http://44.200.182.180/api/insurance/dmvic/search-vehicle/" -ForegroundColor Cyan

# Complete SSH Setup for EC2 - Direct Commands
# Run these commands in order from PowerShell

Write-Host "`n🔐 Complete SSH Setup for EC2" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray

$commands = @"

STEP 1: Generate SSH Key Locally (using ssh-keygen)
════════════════════════════════════════════════════════════════════

ssh-keygen -t rsa -b 4096 -f `$env:USERPROFILE\.ssh\patabima-ec2 -N '""'

This creates:
  - Private key: C:\Users\USER\.ssh\patabima-ec2
  - Public key:  C:\Users\USER\.ssh\patabima-ec2.pub


STEP 2: Copy Public Key to Clipboard
════════════════════════════════════════════════════════════════════

Get-Content `$env:USERPROFILE\.ssh\patabima-ec2.pub | Set-Clipboard
Write-Host "✅ Public key copied to clipboard!" -ForegroundColor Green


STEP 3: Add Public Key to EC2 (Browser SSH - Already Open!)
════════════════════════════════════════════════════════════════════

In the EC2 browser SSH terminal that's open, run:

# Create .ssh directory if doesn't exist
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add your public key (paste from clipboard)
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# Set correct permissions
chmod 600 ~/.ssh/authorized_keys


STEP 4: Test SSH Connection from Local PowerShell
════════════════════════════════════════════════════════════════════

ssh -i `$env:USERPROFILE\.ssh\patabima-ec2 ec2-user@44.200.182.180


STEP 5: Update Backend Code on EC2 (via SSH)
════════════════════════════════════════════════════════════════════

# Pull latest code
ssh -i `$env:USERPROFILE\.ssh\patabima-ec2 ec2-user@44.200.182.180 "cd /var/www/patabima && git pull origin main"

# Install dependencies
ssh -i `$env:USERPROFILE\.ssh\patabima-ec2 ec2-user@44.200.182.180 "cd /var/www/patabima && source venv/bin/activate && pip install -r requirements.txt"

# Run migrations
ssh -i `$env:USERPROFILE\.ssh\patabima-ec2 ec2-user@44.200.182.180 "cd /var/www/patabima && source venv/bin/activate && export `$(grep -v '^#' .env | xargs) && python manage.py migrate"

# Collect static files
ssh -i `$env:USERPROFILE\.ssh\patabima-ec2 ec2-user@44.200.182.180 "cd /var/www/patabima && source venv/bin/activate && export `$(grep -v '^#' .env | xargs) && python manage.py collectstatic --noinput"

# Restart service
ssh -i `$env:USERPROFILE\.ssh\patabima-ec2 ec2-user@44.200.182.180 "sudo systemctl restart patabima"


STEP 6: Check Service Status
════════════════════════════════════════════════════════════════════

ssh -i `$env:USERPROFILE\.ssh\patabima-ec2 ec2-user@44.200.182.180 "sudo systemctl status patabima --no-pager"


QUICK COMMANDS (After SSH is set up):
════════════════════════════════════════════════════════════════════

# Connect interactively
ssh -i `$env:USERPROFILE\.ssh\patabima-ec2 ec2-user@44.200.182.180

# View logs
ssh -i `$env:USERPROFILE\.ssh\patabima-ec2 ec2-user@44.200.182.180 "sudo journalctl -u patabima -n 50 --no-pager"

# Restart service
ssh -i `$env:USERPROFILE\.ssh\patabima-ec2 ec2-user@44.200.182.180 "sudo systemctl restart patabima"

# Django shell
ssh -i `$env:USERPROFILE\.ssh\patabima-ec2 ec2-user@44.200.182.180 -t "cd /var/www/patabima && source venv/bin/activate && export `$(grep -v '^#' .env | xargs) && python manage.py shell"


ONE-LINER: Full Update
════════════════════════════════════════════════════════════════════

ssh -i `$env:USERPROFILE\.ssh\patabima-ec2 ec2-user@44.200.182.180 "cd /var/www/patabima && git pull origin main && source venv/bin/activate && pip install -r requirements.txt && export `$(grep -v '^#' .env | xargs) && python manage.py migrate && python manage.py collectstatic --noinput && sudo systemctl restart patabima && sudo systemctl status patabima --no-pager"

"@

Write-Host $commands -ForegroundColor White

Write-Host "`n═══════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "💡 TIP: Create PowerShell alias for easier access:" -ForegroundColor Yellow
Write-Host @"

Add to your PowerShell profile (~\Documents\PowerShell\Microsoft.PowerShell_profile.ps1):

function ec2 {
    ssh -i `$env:USERPROFILE\.ssh\patabima-ec2 ec2-user@44.200.182.180 `@args
}

Then use:
  ec2                           # Connect interactively
  ec2 "ls -la /var/www/patabima" # Run command
"@ -ForegroundColor DarkGray

Write-Host "`n═══════════════════════════════════════════`n" -ForegroundColor DarkGray

# Offer to run Step 1 automatically
$response = Read-Host "Would you like to generate the SSH key now? (Y/N)"
if ($response -eq 'Y' -or $response -eq 'y') {
  Write-Host "`n🔑 Generating SSH key..." -ForegroundColor Cyan
  ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\patabima-ec2" -N '""'
    
  if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ SSH key generated successfully!" -ForegroundColor Green
    Write-Host "📁 Location: $env:USERPROFILE\.ssh\patabima-ec2`n" -ForegroundColor White
        
    Write-Host "Copying public key to clipboard..." -ForegroundColor Yellow
    Get-Content "$env:USERPROFILE\.ssh\patabima-ec2.pub" | Set-Clipboard
    Write-Host "✅ Public key copied to clipboard!`n" -ForegroundColor Green
        
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "📋 NEXT: Add this key to EC2" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
        
    Write-Host "In the EC2 browser SSH (already open), run:`n" -ForegroundColor White
    Write-Host "mkdir -p ~/.ssh && chmod 700 ~/.ssh" -ForegroundColor Green
    Write-Host "echo '" -NoNewline -ForegroundColor Green
    Write-Host (Get-Content "$env:USERPROFILE\.ssh\patabima-ec2.pub" -Raw).Trim() -NoNewline -ForegroundColor Yellow
    Write-Host "' >> ~/.ssh/authorized_keys" -ForegroundColor Green
    Write-Host "chmod 600 ~/.ssh/authorized_keys`n" -ForegroundColor Green
        
    Write-Host "Then test connection:" -ForegroundColor Cyan
    Write-Host "ssh -i $env:USERPROFILE\.ssh\patabima-ec2 ec2-user@44.200.182.180`n" -ForegroundColor White
  }
}

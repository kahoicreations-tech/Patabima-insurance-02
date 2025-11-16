# EC2 Direct Command Execution via SSH
# Execute commands on EC2 directly from local PowerShell using SSH

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('status', 'logs', 'restart', 'migrate', 'collectstatic', 'create-admin', 'update', 'shell', 'custom')]
    [string]$Action = 'status',
    
    [Parameter(Mandatory=$false)]
    [string]$CustomCommand = ''
)

$EC2_IP = '44.200.182.180'
$EC2_USER = 'ec2-user'
$KeyPath = "$env:USERPROFILE\.ssh\patabima-ec2-key.pem"
$ProjectPath = '/var/www/patabima'

function Execute-SSHCommand {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "`n⚡ $Description" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray
    
    if (-not (Test-Path $KeyPath)) {
        Write-Host "❌ SSH key not found: $KeyPath" -ForegroundColor Red
        Write-Host "Run: .\deployment\setup-ec2-ssh.ps1`n" -ForegroundColor Yellow
        return $false
    }
    
    Write-Host "Executing on EC2 via SSH...`n" -ForegroundColor Yellow
    
    # Execute command via SSH
    $Output = ssh -i $KeyPath -o ConnectTimeout=10 -o StrictHostKeyChecking=no $EC2_USER@$EC2_IP $Command 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "📤 Output:" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════" -ForegroundColor DarkGray
        Write-Host $Output -ForegroundColor White
        Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray
        return $true
    } else {
        Write-Host "❌ Command failed" -ForegroundColor Red
        Write-Host $Output -ForegroundColor Red
        Write-Host "`n💡 Troubleshooting:" -ForegroundColor Yellow
        Write-Host "  1. Run: .\deployment\setup-ec2-ssh.ps1 -Action test-connection" -ForegroundColor White
        Write-Host "  2. Check security group allows SSH (port 22)" -ForegroundColor White
        Write-Host "  3. Verify public key is in EC2 ~/.ssh/authorized_keys`n" -ForegroundColor White
        return $false
    }
}

Write-Host "`n🚀 EC2 SSH Direct Execution - $Action" -ForegroundColor Cyan
Write-Host "Instance: $EC2_IP" -ForegroundColor DarkGray
Write-Host ""

switch ($Action) {
    'status' {
        $cmd = "sudo systemctl status patabima --no-pager"
        Execute-SSHCommand -Command $cmd -Description "Check Django Service Status"
    }
    
    'logs' {
        $cmd = "sudo journalctl -u patabima -n 50 --no-pager"
        Execute-SSHCommand -Command $cmd -Description "View Last 50 Log Lines"
    }
    
    'restart' {
        $cmd = "sudo systemctl restart patabima && sudo systemctl status patabima --no-pager"
        Execute-SSHCommand -Command $cmd -Description "Restart Django Service"
    }
    
    'migrate' {
        $cmd = "cd $ProjectPath && source venv/bin/activate && export `$(grep -v '^#' .env | xargs) && python manage.py migrate"
        Execute-SSHCommand -Command $cmd -Description "Run Database Migrations"
    }
    
    'collectstatic' {
        $cmd = "cd $ProjectPath && source venv/bin/activate && export `$(grep -v '^#' .env | xargs) && python manage.py collectstatic --noinput"
        Execute-SSHCommand -Command $cmd -Description "Collect Static Files"
    }
    
    'create-admin' {
        $cmd = "cd $ProjectPath && source venv/bin/activate && export `$(grep -v '^#' .env | xargs) && python manage.py shell -c 'from django.contrib.auth import get_user_model; User = get_user_model(); user, created = User.objects.get_or_create(phonenumber=\"0741590055\"); user.set_password(\"Best254#\"); user.is_staff = True; user.is_admin = True; user.email = \"admin@patabima.com\"; user.save(); print(f\"Admin: {user.phonenumber}, Staff: {user.is_staff}, Admin: {user.is_admin}\")'"
        
        if (Execute-SSHCommand -Command $cmd -Description "Create Admin User (0741590055 / Best254#)") {
            Write-Host "🎉 Test login at: http://44.200.182.180/admin/" -ForegroundColor Green
            Write-Host "   Username: 0741590055" -ForegroundColor White
            Write-Host "   Password: Best254#`n" -ForegroundColor White
        }
    }
    
    'update' {
        Write-Host "📦 Running full update workflow..." -ForegroundColor Cyan
        Write-Host ""
        
        # Pull code
        if (Execute-SSHCommand -Command "cd $ProjectPath && git pull origin main" -Description "Step 1/5: Pull Latest Code") {
            
            # Install dependencies
            Execute-SSHCommand -Command "cd $ProjectPath && source venv/bin/activate && pip install -r requirements.txt" -Description "Step 2/5: Install Dependencies"
            
            # Migrate
            Execute-SSHCommand -Command "cd $ProjectPath && source venv/bin/activate && export `$(grep -v '^#' .env | xargs) && python manage.py migrate" -Description "Step 3/5: Run Migrations"
            
            # Collect static
            Execute-SSHCommand -Command "cd $ProjectPath && source venv/bin/activate && export `$(grep -v '^#' .env | xargs) && python manage.py collectstatic --noinput" -Description "Step 4/5: Collect Static Files"
            
            # Restart
            Execute-SSHCommand -Command "sudo systemctl restart patabima && sudo systemctl status patabima --no-pager" -Description "Step 5/5: Restart Service"
            
            Write-Host "`n✅ Update complete!" -ForegroundColor Green
            Write-Host "🔍 Verify at: http://44.200.182.180/admin/`n" -ForegroundColor Cyan
        }
    }
    
    'shell' {
        Write-Host "Opening interactive Django shell on EC2...`n" -ForegroundColor Yellow
        
        if (Test-Path $KeyPath) {
            ssh -i $KeyPath -t $EC2_USER@$EC2_IP "cd $ProjectPath && source venv/bin/activate && export `$(grep -v '^#' .env | xargs) && python manage.py shell"
        } else {
            Write-Host "❌ SSH key not found: $KeyPath" -ForegroundColor Red
            Write-Host "Run: .\deployment\setup-ec2-ssh.ps1`n" -ForegroundColor Yellow
        }
    }
    
    'custom' {
        if (-not $CustomCommand) {
            Write-Host "❌ Error: -CustomCommand parameter required" -ForegroundColor Red
            Write-Host "Example: .\ec2-ssh-exec.ps1 -Action custom -CustomCommand 'ls -la /var/www/patabima'`n" -ForegroundColor Yellow
            exit 1
        }
        
        Execute-SSHCommand -Command $CustomCommand -Description "Execute Custom Command"
    }
}

Write-Host "💡 Quick Commands:" -ForegroundColor Yellow
Write-Host "  Status:        .\deployment\ec2-ssh-exec.ps1 -Action status" -ForegroundColor DarkGray
Write-Host "  Logs:          .\deployment\ec2-ssh-exec.ps1 -Action logs" -ForegroundColor DarkGray
Write-Host "  Restart:       .\deployment\ec2-ssh-exec.ps1 -Action restart" -ForegroundColor DarkGray
Write-Host "  Create Admin:  .\deployment\ec2-ssh-exec.ps1 -Action create-admin" -ForegroundColor DarkGray
Write-Host "  Full Update:   .\deployment\ec2-ssh-exec.ps1 -Action update" -ForegroundColor DarkGray
Write-Host "  Django Shell:  .\deployment\ec2-ssh-exec.ps1 -Action shell" -ForegroundColor DarkGray
Write-Host "  Custom:        .\deployment\ec2-ssh-exec.ps1 -Action custom -CustomCommand 'your command'`n" -ForegroundColor DarkGray

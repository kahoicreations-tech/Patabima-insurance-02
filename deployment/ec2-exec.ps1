# EC2 Direct Command Execution via AWS SSM
# Execute commands on EC2 directly from local PowerShell

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('logs', 'restart', 'status', 'migrate', 'collectstatic', 'create-admin', 'update', 'shell', 'custom')]
    [string]$Action = 'status',
    
    [Parameter(Mandatory=$false)]
    [string]$CustomCommand = ''
)

$InstanceId = 'i-0d0f116005d812275'
$Region = 'us-east-1'
$ProjectPath = '/var/www/patabima'

function Execute-SSMCommand {
    param(
        [string]$Command,
        [string]$Description
    )
    
    Write-Host "`n⚡ $Description" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray
    Write-Host "Executing on EC2...`n" -ForegroundColor Yellow
    
    # Create JSON parameters file to avoid escaping issues
    $ParamsJson = @{
        commands = @($Command)
    } | ConvertTo-Json -Compress
    
    # Send command via SSM
    $CommandId = aws ssm send-command `
        --instance-ids $InstanceId `
        --document-name "AWS-RunShellScript" `
        --parameters $ParamsJson `
        --region $Region `
        --output text `
        --query 'Command.CommandId' 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to send command" -ForegroundColor Red
        Write-Host "Error: $CommandId`n" -ForegroundColor Red
        
        # Check if SSM agent is running
        Write-Host "💡 Troubleshooting:" -ForegroundColor Yellow
        Write-Host "1. Check if SSM Agent is running on EC2" -ForegroundColor White
        Write-Host "2. Verify IAM role has AmazonSSMManagedInstanceCore policy" -ForegroundColor White
        Write-Host "3. Use browser SSH as alternative: .\ec2-ssh.ps1 -Action connect`n" -ForegroundColor White
        return $false
    }
    
    Write-Host "✅ Command sent (ID: $CommandId)" -ForegroundColor Green
    Write-Host "⏳ Waiting for output...`n" -ForegroundColor Yellow
    
    # Wait for command to complete
    Start-Sleep -Seconds 3
    
    # Get command output
    $Output = aws ssm get-command-invocation `
        --command-id $CommandId `
        --instance-id $InstanceId `
        --region $Region `
        --output json 2>&1 | ConvertFrom-Json
    
    if ($Output.Status -eq 'Success') {
        Write-Host "📤 Output:" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════" -ForegroundColor DarkGray
        Write-Host $Output.StandardOutputContent -ForegroundColor White
        
        if ($Output.StandardErrorContent) {
            Write-Host "`n⚠️  Errors:" -ForegroundColor Yellow
            Write-Host $Output.StandardErrorContent -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Command failed with status: $($Output.Status)" -ForegroundColor Red
        Write-Host $Output.StandardErrorContent -ForegroundColor Red
    }
    
    Write-Host "`n═══════════════════════════════════════════`n" -ForegroundColor DarkGray
    return $true
}

Write-Host "`n🚀 EC2 Direct Execution - $Action" -ForegroundColor Cyan
Write-Host "Instance: $InstanceId" -ForegroundColor DarkGray
Write-Host ""

switch ($Action) {
    'status' {
        $cmd = "sudo systemctl status patabima --no-pager"
        Execute-SSMCommand -Command $cmd -Description "Check Django Service Status"
    }
    
    'logs' {
        $cmd = "sudo journalctl -u patabima -n 50 --no-pager"
        Execute-SSMCommand -Command $cmd -Description "View Last 50 Log Lines"
    }
    
    'restart' {
        $cmd = "sudo systemctl restart patabima && sudo systemctl status patabima --no-pager"
        Execute-SSMCommand -Command $cmd -Description "Restart Django Service"
    }
    
    'migrate' {
        $cmd = "cd $ProjectPath && source venv/bin/activate && export `$(grep -v '^#' .env | xargs) && python manage.py migrate"
        Execute-SSMCommand -Command $cmd -Description "Run Database Migrations"
    }
    
    'collectstatic' {
        $cmd = "cd $ProjectPath && source venv/bin/activate && export `$(grep -v '^#' .env | xargs) && python manage.py collectstatic --noinput"
        Execute-SSMCommand -Command $cmd -Description "Collect Static Files"
    }
    
    'create-admin' {
        $adminCmd = @"
cd $ProjectPath && source venv/bin/activate && export `$(grep -v '^#' .env | xargs) && python manage.py shell -c \"from django.contrib.auth import get_user_model; User = get_user_model(); user, created = User.objects.get_or_create(phonenumber='0741590055'); user.set_password('Best254#'); user.is_staff = True; user.is_admin = True; user.email = 'admin@patabima.com'; user.save(); print(f'✅ Admin created: {user.phonenumber}, Staff: {user.is_staff}, Admin: {user.is_admin}')\"
"@
        Execute-SSMCommand -Command $adminCmd -Description "Create Admin User (0741590055 / Best254#)"
        
        if ($?) {
            Write-Host "🎉 Test login at: http://44.200.182.180/admin/" -ForegroundColor Green
            Write-Host "   Username: 0741590055" -ForegroundColor White
            Write-Host "   Password: Best254#`n" -ForegroundColor White
        }
    }
    
    'update' {
        Write-Host "📦 Running full update workflow..." -ForegroundColor Cyan
        Write-Host ""
        
        # Pull code
        $pullCmd = "cd $ProjectPath && git pull origin main"
        if (Execute-SSMCommand -Command $pullCmd -Description "Step 1/5: Pull Latest Code") {
            
            # Install dependencies
            $installCmd = "cd $ProjectPath && source venv/bin/activate && pip install -r requirements.txt"
            Execute-SSMCommand -Command $installCmd -Description "Step 2/5: Install Dependencies"
            
            # Migrate
            $migrateCmd = "cd $ProjectPath && source venv/bin/activate && export `$(grep -v '^#' .env | xargs) && python manage.py migrate"
            Execute-SSMCommand -Command $migrateCmd -Description "Step 3/5: Run Migrations"
            
            # Collect static
            $staticCmd = "cd $ProjectPath && source venv/bin/activate && export `$(grep -v '^#' .env | xargs) && python manage.py collectstatic --noinput"
            Execute-SSMCommand -Command $staticCmd -Description "Step 4/5: Collect Static Files"
            
            # Restart
            $restartCmd = "sudo systemctl restart patabima && sudo systemctl status patabima --no-pager"
            Execute-SSMCommand -Command $restartCmd -Description "Step 5/5: Restart Service"
            
            Write-Host "`n✅ Update complete!" -ForegroundColor Green
            Write-Host "🔍 Verify at: http://44.200.182.180/admin/`n" -ForegroundColor Cyan
        }
    }
    
    'shell' {
        $shellCmd = "cd $ProjectPath && source venv/bin/activate && export `$(grep -v '^#' .env | xargs) && python manage.py shell"
        Write-Host "⚠️  Interactive shell not supported via SSM" -ForegroundColor Yellow
        Write-Host "Use browser SSH instead: .\ec2-ssh.ps1 -Action connect`n" -ForegroundColor Cyan
    }
    
    'custom' {
        if (-not $CustomCommand) {
            Write-Host "❌ Error: -CustomCommand parameter required" -ForegroundColor Red
            Write-Host "Example: .\ec2-exec.ps1 -Action custom -CustomCommand 'ls -la /var/www/patabima'`n" -ForegroundColor Yellow
            exit 1
        }
        
        Execute-SSMCommand -Command $CustomCommand -Description "Execute Custom Command"
    }
}

Write-Host "💡 Quick Commands:" -ForegroundColor Yellow
Write-Host "  Status:        .\ec2-exec.ps1 -Action status" -ForegroundColor DarkGray
Write-Host "  Logs:          .\ec2-exec.ps1 -Action logs" -ForegroundColor DarkGray
Write-Host "  Restart:       .\ec2-exec.ps1 -Action restart" -ForegroundColor DarkGray
Write-Host "  Create Admin:  .\ec2-exec.ps1 -Action create-admin" -ForegroundColor DarkGray
Write-Host "  Full Update:   .\ec2-exec.ps1 -Action update" -ForegroundColor DarkGray
Write-Host "  Custom:        .\ec2-exec.ps1 -Action custom -CustomCommand 'your command'`n" -ForegroundColor DarkGray

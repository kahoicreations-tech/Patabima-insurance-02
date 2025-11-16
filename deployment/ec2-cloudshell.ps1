# EC2 Management via AWS CloudShell
# Execute commands on EC2 using AWS CloudShell (no SSH key needed)

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('open', 'create-admin', 'status', 'logs', 'restart', 'update', 'migrate')]
    [string]$Action = 'open'
)

$InstanceId = 'i-0d0f116005d812275'
$Region = 'us-east-1'
$ProjectPath = '/var/www/patabima'

Write-Host "`n🌩️  EC2 Management via CloudShell - $Action" -ForegroundColor Cyan
Write-Host "Instance: $InstanceId`n" -ForegroundColor DarkGray

switch ($Action) {
    'open' {
        Write-Host "📡 Opening AWS CloudShell..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "CloudShell will open in your browser with AWS CLI pre-configured!" -ForegroundColor Green
        Write-Host "No SSH keys needed! 🎉`n" -ForegroundColor Green
        
        # Open CloudShell in browser
        Start-Process "https://console.aws.amazon.com/cloudshell/home?region=$Region"
        
        Write-Host "Once CloudShell opens, you can run these commands:" -ForegroundColor Cyan
        Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray
        
        Write-Host "# Quick actions (copy-paste these):" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "# 1. Create admin user" -ForegroundColor Green
        Write-Host ".\ec2-cloudshell.ps1 -Action create-admin" -ForegroundColor White
        Write-Host ""
        Write-Host "# 2. Check service status" -ForegroundColor Green
        Write-Host ".\ec2-cloudshell.ps1 -Action status" -ForegroundColor White
        Write-Host ""
        Write-Host "# 3. View logs" -ForegroundColor Green
        Write-Host ".\ec2-cloudshell.ps1 -Action logs" -ForegroundColor White
        Write-Host ""
        Write-Host "# 4. Full update" -ForegroundColor Green
        Write-Host ".\ec2-cloudshell.ps1 -Action update`n" -ForegroundColor White
    }
    
    'create-admin' {
        Write-Host "📋 Copy and paste this command in CloudShell:" -ForegroundColor Yellow
        Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray
        
        $cmd = @"
aws ssm send-command \
  --instance-ids $InstanceId \
  --document-name "AWS-RunShellScript" \
  --region $Region \
  --parameters 'commands=[
    "cd $ProjectPath",
    "source venv/bin/activate",
    "export `$(grep -v '\''^#'\'' .env | xargs)",
    "python manage.py shell -c \"from django.contrib.auth import get_user_model; User = get_user_model(); user, created = User.objects.get_or_create(phonenumber='\''0741590055'\''); user.set_password('\''Best254#'\''); user.is_staff = True; user.is_admin = True; user.email = '\''admin@patabima.com'\''; user.save(); print(f'\''Admin: {user.phonenumber}, Staff: {user.is_staff}, Admin: {user.is_admin}'\'')\""
  ]' \
  --output text \
  --query 'Command.CommandId'
"@
        
        Write-Host $cmd -ForegroundColor White
        Write-Host ""
        Write-Host "Then get the output with:" -ForegroundColor Yellow
        Write-Host "aws ssm get-command-invocation --command-id <COMMAND_ID> --instance-id $InstanceId --region $Region --query 'StandardOutputContent' --output text" -ForegroundColor White
        Write-Host ""
        Write-Host "🎉 After success, test login at: http://44.200.182.180/admin/" -ForegroundColor Green
        Write-Host "   Username: 0741590055" -ForegroundColor Cyan
        Write-Host "   Password: Best254#`n" -ForegroundColor Cyan
        
        # Copy to clipboard
        Set-Clipboard -Value $cmd
        Write-Host "✅ Command copied to clipboard! Just paste in CloudShell`n" -ForegroundColor Green
    }
    
    'status' {
        $cmd = @"
aws ssm send-command \
  --instance-ids $InstanceId \
  --document-name "AWS-RunShellScript" \
  --region $Region \
  --parameters 'commands=["sudo systemctl status patabima --no-pager"]' \
  --output text \
  --query 'Command.CommandId'
"@
        
        Write-Host "📋 Copy and paste in CloudShell:" -ForegroundColor Yellow
        Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray
        Write-Host $cmd -ForegroundColor White
        Write-Host ""
        
        Set-Clipboard -Value $cmd
        Write-Host "✅ Command copied to clipboard!`n" -ForegroundColor Green
    }
    
    'logs' {
        $cmd = @"
aws ssm send-command \
  --instance-ids $InstanceId \
  --document-name "AWS-RunShellScript" \
  --region $Region \
  --parameters 'commands=["sudo journalctl -u patabima -n 50 --no-pager"]' \
  --output text \
  --query 'Command.CommandId'
"@
        
        Write-Host "📋 Copy and paste in CloudShell:" -ForegroundColor Yellow
        Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray
        Write-Host $cmd -ForegroundColor White
        Write-Host ""
        
        Set-Clipboard -Value $cmd
        Write-Host "✅ Command copied to clipboard!`n" -ForegroundColor Green
    }
    
    'restart' {
        $cmd = @"
aws ssm send-command \
  --instance-ids $InstanceId \
  --document-name "AWS-RunShellScript" \
  --region $Region \
  --parameters 'commands=["sudo systemctl restart patabima && sudo systemctl status patabima --no-pager"]' \
  --output text \
  --query 'Command.CommandId'
"@
        
        Write-Host "📋 Copy and paste in CloudShell:" -ForegroundColor Yellow
        Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray
        Write-Host $cmd -ForegroundColor White
        Write-Host ""
        
        Set-Clipboard -Value $cmd
        Write-Host "✅ Command copied to clipboard!`n" -ForegroundColor Green
    }
    
    'migrate' {
        $cmd = @"
aws ssm send-command \
  --instance-ids $InstanceId \
  --document-name "AWS-RunShellScript" \
  --region $Region \
  --parameters 'commands=[
    "cd $ProjectPath",
    "source venv/bin/activate",
    "export `$(grep -v '\''^#'\'' .env | xargs)",
    "python manage.py migrate"
  ]' \
  --output text \
  --query 'Command.CommandId'
"@
        
        Write-Host "📋 Copy and paste in CloudShell:" -ForegroundColor Yellow
        Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray
        Write-Host $cmd -ForegroundColor White
        Write-Host ""
        
        Set-Clipboard -Value $cmd
        Write-Host "✅ Command copied to clipboard!`n" -ForegroundColor Green
    }
    
    'update' {
        Write-Host "📦 Full Update Workflow" -ForegroundColor Yellow
        Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray
        
        $cmd = @"
# Step 1: Pull latest code
aws ssm send-command \
  --instance-ids $InstanceId \
  --document-name "AWS-RunShellScript" \
  --region $Region \
  --parameters 'commands=["cd $ProjectPath && git pull origin main"]' \
  --output text \
  --query 'Command.CommandId'

# Step 2: Install dependencies
aws ssm send-command \
  --instance-ids $InstanceId \
  --document-name "AWS-RunShellScript" \
  --region $Region \
  --parameters 'commands=["cd $ProjectPath && source venv/bin/activate && pip install -r requirements.txt"]' \
  --output text \
  --query 'Command.CommandId'

# Step 3: Migrate database
aws ssm send-command \
  --instance-ids $InstanceId \
  --document-name "AWS-RunShellScript" \
  --region $Region \
  --parameters 'commands=[
    "cd $ProjectPath",
    "source venv/bin/activate",
    "export `$(grep -v '\''^#'\'' .env | xargs)",
    "python manage.py migrate"
  ]' \
  --output text \
  --query 'Command.CommandId'

# Step 4: Collect static files
aws ssm send-command \
  --instance-ids $InstanceId \
  --document-name "AWS-RunShellScript" \
  --region $Region \
  --parameters 'commands=[
    "cd $ProjectPath",
    "source venv/bin/activate", 
    "export `$(grep -v '\''^#'\'' .env | xargs)",
    "python manage.py collectstatic --noinput"
  ]' \
  --output text \
  --query 'Command.CommandId'

# Step 5: Restart service
aws ssm send-command \
  --instance-ids $InstanceId \
  --document-name "AWS-RunShellScript" \
  --region $Region \
  --parameters 'commands=["sudo systemctl restart patabima && sudo systemctl status patabima --no-pager"]' \
  --output text \
  --query 'Command.CommandId'
"@
        
        Write-Host $cmd -ForegroundColor White
        Write-Host ""
        
        Set-Clipboard -Value $cmd
        Write-Host "✅ Commands copied to clipboard! Paste in CloudShell and run step by step`n" -ForegroundColor Green
    }
}

Write-Host "💡 Quick Commands:" -ForegroundColor Yellow
Write-Host "  Open CloudShell:  .\ec2-cloudshell.ps1 -Action open" -ForegroundColor DarkGray
Write-Host "  Create Admin:     .\ec2-cloudshell.ps1 -Action create-admin" -ForegroundColor DarkGray
Write-Host "  Check Status:     .\ec2-cloudshell.ps1 -Action status" -ForegroundColor DarkGray
Write-Host "  View Logs:        .\ec2-cloudshell.ps1 -Action logs" -ForegroundColor DarkGray
Write-Host "  Restart Service:  .\ec2-cloudshell.ps1 -Action restart" -ForegroundColor DarkGray
Write-Host "  Full Update:      .\ec2-cloudshell.ps1 -Action update`n" -ForegroundColor DarkGray

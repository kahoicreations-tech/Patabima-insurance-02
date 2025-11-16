# Sync Local Backend Changes to EC2
# This script uploads modified Django files and restarts services

param(
    [switch]$FullSync,
    [switch]$QuickSync,
    [switch]$AdminOnly
)

$EC2_IP = "44.200.182.180"
$EC2_USER = "ec2-user"
$EC2_PATH = "/var/www/patabima"
$LOCAL_PATH = "C:\Users\USER\Desktop\PATABIMA01\insurance-app"

Write-Host "`n🚀 PataBima Backend Sync to EC2`n" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "Target: $EC2_IP" -ForegroundColor White
Write-Host "Path: $EC2_PATH" -ForegroundColor White
Write-Host ""

# Files to sync (changed files)
$filesToSync = @(
    "app/admin.py",
    "app/models.py",
    "insurance/settings.py",
    "create_admin.py"
)

if ($AdminOnly) {
    Write-Host "📦 Syncing Admin Files Only..." -ForegroundColor Yellow
    $filesToSync = @("app/admin.py", "create_admin.py")
}

if ($FullSync) {
    Write-Host "📦 Full Sync Mode..." -ForegroundColor Yellow
    Write-Host "⚠️  This will sync entire app/ directory" -ForegroundColor Yellow
    Write-Host ""
}

# Generate rsync/scp commands for user to run
Write-Host "📋 Commands to Run in Git Bash or WSL:`n" -ForegroundColor Cyan

if ($FullSync) {
    Write-Host "# Full sync (entire app directory)" -ForegroundColor DarkGray
    Write-Host "rsync -avz --exclude='__pycache__' --exclude='*.pyc' --exclude='migrations/__pycache__' \\" -ForegroundColor White
    Write-Host "  $LOCAL_PATH/app/ \\" -ForegroundColor White
    Write-Host "  ${EC2_USER}@${EC2_IP}:${EC2_PATH}/app/" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "# Sync modified files" -ForegroundColor DarkGray
    foreach ($file in $filesToSync) {
        $localFile = Join-Path $LOCAL_PATH $file
        $remoteFile = "$EC2_PATH/$($file -replace '\\', '/')"
        
        if (Test-Path $localFile) {
            Write-Host "scp '$localFile' ${EC2_USER}@${EC2_IP}:${remoteFile}" -ForegroundColor White
        } else {
            Write-Host "# ⚠️  File not found: $file" -ForegroundColor Yellow
        }
    }
    Write-Host ""
}

Write-Host "# After upload, restart Django service" -ForegroundColor DarkGray
Write-Host "ssh ${EC2_USER}@${EC2_IP}" -ForegroundColor White
Write-Host ""

# EC2 commands to run after sync
$ec2Commands = @"
# Navigate to project
cd /var/www/patabima

# Activate virtual environment
source venv/bin/activate

# Load environment variables
export `$(grep -v '^#' .env | xargs)

# Run migrations (if models changed)
python manage.py migrate

# Collect static files (if admin changed)
python manage.py collectstatic --noinput

# Restart Gunicorn service
sudo systemctl restart patabima

# Check service status
sudo systemctl status patabima

# View logs
sudo journalctl -u patabima -n 50 --no-pager
"@

Write-Host "════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "`n📝 Commands to Run on EC2:`n" -ForegroundColor Cyan
Write-Host $ec2Commands -ForegroundColor White
Write-Host ""
Write-Host "════════════════════════════════════════" -ForegroundColor DarkGray

# Alternative: Using Git (recommended)
Write-Host "`n💡 Alternative: Use Git (Recommended)`n" -ForegroundColor Magenta

Write-Host "# On Local:" -ForegroundColor Yellow
Write-Host "git add ." -ForegroundColor White
Write-Host "git commit -m 'Updated admin panel and models'" -ForegroundColor White
Write-Host "git push origin main" -ForegroundColor White
Write-Host ""

Write-Host "# On EC2:" -ForegroundColor Yellow
Write-Host "ssh ${EC2_USER}@${EC2_IP}" -ForegroundColor White
Write-Host "cd $EC2_PATH" -ForegroundColor White
Write-Host "git pull origin main" -ForegroundColor White
Write-Host "source venv/bin/activate" -ForegroundColor White
Write-Host "python manage.py migrate" -ForegroundColor White
Write-Host "python manage.py collectstatic --noinput" -ForegroundColor White
Write-Host "sudo systemctl restart patabima" -ForegroundColor White
Write-Host ""

Write-Host "════════════════════════════════════════" -ForegroundColor DarkGray

# Generate file for easy copy-paste
$commandsFile = Join-Path $PSScriptRoot "ec2_sync_commands.txt"
$allCommands = @"
═══════════════════════════════════════════════════════════════
PataBima EC2 Sync Commands - Generated $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
═══════════════════════════════════════════════════════════════

METHOD 1: Git Sync (Recommended)
────────────────────────────────────────────────────────────────

# On Local Machine:
git add .
git commit -m "Updated admin panel and models"
git push origin main

# On EC2 (via AWS Console → EC2 Instance Connect):
cd /var/www/patabima
git pull origin main
source venv/bin/activate
export `$(grep -v '^#' .env | xargs)
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart patabima
sudo systemctl status patabima


METHOD 2: Direct File Upload (if no Git)
────────────────────────────────────────────────────────────────

# Upload files via SCP (Git Bash/WSL):
scp "$LOCAL_PATH/app/admin.py" ${EC2_USER}@${EC2_IP}:${EC2_PATH}/app/
scp "$LOCAL_PATH/app/models.py" ${EC2_USER}@${EC2_IP}:${EC2_PATH}/app/
scp "$LOCAL_PATH/create_admin.py" ${EC2_USER}@${EC2_IP}:${EC2_PATH}/

# Then SSH to EC2:
ssh ${EC2_USER}@${EC2_IP}
cd /var/www/patabima
source venv/bin/activate
export `$(grep -v '^#' .env | xargs)
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart patabima


VERIFICATION
────────────────────────────────────────────────────────────────

# Check service status:
sudo systemctl status patabima nginx

# View recent logs:
sudo journalctl -u patabima -n 100 --no-pager

# Test API:
curl -sS "http://localhost/api/v1/motor2/categories/" | python -m json.tool

# Test admin:
curl -I "http://localhost/admin/login/"


TROUBLESHOOTING
────────────────────────────────────────────────────────────────

# If service fails to start:
sudo journalctl -u patabima -n 200 --no-pager

# Check for Python errors:
cd /var/www/patabima
source venv/bin/activate
python manage.py check

# Test manually:
gunicorn --bind 0.0.0.0:8000 insurance.wsgi:application

═══════════════════════════════════════════════════════════════
"@

Set-Content -Path $commandsFile -Value $allCommands -Force
Write-Host "`n✅ Commands saved to: $commandsFile" -ForegroundColor Green
Write-Host ""

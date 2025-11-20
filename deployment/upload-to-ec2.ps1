# Direct File Upload to EC2 (Bypass Git)
# Upload files from local machine directly to EC2 using SCP

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet('setup', 'upload-all', 'upload-backend', 'upload-file', 'sync')]
    [string]$Action = 'setup',
    
    [Parameter(Mandatory = $false)]
    [string]$FilePath = '',
    
    [Parameter(Mandatory = $false)]
    [string]$RemotePath = ''
)

$EC2_IP = '44.200.182.180'
$EC2_USER = 'ec2-user'
$LOCAL_BACKEND = 'C:\Users\USER\Desktop\PATABIMA01\insurance-app'
$REMOTE_BACKEND = '/var/www/patabima'

Write-Host "`n📤 Direct EC2 File Upload - $Action`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray

switch ($Action) {
    'setup' {
        Write-Host "🔧 Setting up direct file upload to EC2`n" -ForegroundColor Yellow
        
        Write-Host "You have 2 options:`n" -ForegroundColor Cyan
        
        Write-Host "OPTION 1: Use Browser SSH (NO SSH KEY NEEDED) ✨ EASIEST" -ForegroundColor Green
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Host "Just paste commands in browser SSH terminal!`n" -ForegroundColor White
        
        Write-Host "To upload a single file:" -ForegroundColor Yellow
        Write-Host @"
1. In browser SSH, run:
   cat > /tmp/myfile.py << 'EOF'
   
2. Paste your file content
   
3. Type: EOF and press Enter
   
4. Move file:
   sudo mv /tmp/myfile.py /var/www/patabima/path/to/file.py
   sudo chown ec2-user:ec2-user /var/www/patabima/path/to/file.py
"@ -ForegroundColor White

        Write-Host "`n`nOPTION 2: Use SCP with SSH Key (RECOMMENDED FOR BULK UPLOADS)" -ForegroundColor Green
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
        Write-Host "First, generate SSH key and add to EC2:`n" -ForegroundColor White
        
        Write-Host "Step 1: Generate key (run in PowerShell):" -ForegroundColor Cyan
        Write-Host "ssh-keygen -t rsa -b 4096 -f `$env:USERPROFILE\.ssh\patabima-ec2 -N ''" -ForegroundColor White
        
        Write-Host "`nStep 2: Copy public key:" -ForegroundColor Cyan
        Write-Host "Get-Content `$env:USERPROFILE\.ssh\patabima-ec2.pub" -ForegroundColor White
        
        Write-Host "`nStep 3: Add to EC2 (in browser SSH):" -ForegroundColor Cyan
        Write-Host @"
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
"@ -ForegroundColor White

        Write-Host "`nStep 4: Test connection:" -ForegroundColor Cyan
        Write-Host "ssh -i `$env:USERPROFILE\.ssh\patabima-ec2 ec2-user@$EC2_IP`n" -ForegroundColor White
        
        Write-Host "`nStep 5: Use upload scripts:" -ForegroundColor Cyan
        Write-Host ".\deployment\upload-to-ec2.ps1 -Action upload-all`n" -ForegroundColor White
    }
    
    'upload-all' {
        $keyPath = "$env:USERPROFILE\.ssh\patabima-ec2"
        
        if (-not (Test-Path $keyPath)) {
            Write-Host "❌ SSH key not found: $keyPath" -ForegroundColor Red
            Write-Host "Run: .\deployment\upload-to-ec2.ps1 -Action setup`n" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "📦 Uploading entire backend to EC2..." -ForegroundColor Cyan
        Write-Host "Source: $LOCAL_BACKEND" -ForegroundColor DarkGray
        Write-Host "Destination: $EC2_IP`:$REMOTE_BACKEND`n" -ForegroundColor DarkGray
        
        # Create backup on EC2 first
        Write-Host "1️⃣ Creating backup on EC2..." -ForegroundColor Yellow
        ssh -i $keyPath $EC2_USER@$EC2_IP "sudo cp -r $REMOTE_BACKEND ${REMOTE_BACKEND}_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        
        # Upload files using rsync (if available) or scp
        Write-Host "2️⃣ Uploading files..." -ForegroundColor Yellow
        
        # Exclude patterns
        $exclude = @(
            '--exclude=__pycache__',
            '--exclude=*.pyc',
            '--exclude=.git',
            '--exclude=venv',
            '--exclude=.env',
            '--exclude=staticfiles',
            '--exclude=media'
        )
        
        # Try rsync first (faster for incremental updates)
        $rsyncAvailable = Get-Command rsync -ErrorAction SilentlyContinue
        
        if ($rsyncAvailable) {
            Write-Host "Using rsync (incremental upload)..." -ForegroundColor Green
            rsync -avz --progress `
                -e "ssh -i $keyPath" `
                $exclude `
                "$LOCAL_BACKEND/" `
                "${EC2_USER}@${EC2_IP}:$REMOTE_BACKEND/"
        }
        else {
            Write-Host "⚠️  rsync not found, using scp (slower)..." -ForegroundColor Yellow
            Write-Host "Install rsync for faster uploads: winget install rsync`n" -ForegroundColor DarkGray
            
            scp -i $keyPath -r $LOCAL_BACKEND/* ${EC2_USER}@${EC2_IP}:$REMOTE_BACKEND/
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Upload complete!" -ForegroundColor Green
            
            # Run post-upload commands
            Write-Host "`n3️⃣ Running post-upload commands..." -ForegroundColor Yellow
            ssh -i $keyPath $EC2_USER@$EC2_IP @"
cd $REMOTE_BACKEND
source venv/bin/activate
pip install -r requirements.txt
export `$(grep -v '^#' .env | xargs)
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart patabima
sudo systemctl status patabima --no-pager
"@
            
            Write-Host "`n✅ Backend updated successfully!" -ForegroundColor Green
            Write-Host "🔍 Verify at: http://$EC2_IP/admin/`n" -ForegroundColor Cyan
        }
        else {
            Write-Host "`n❌ Upload failed!" -ForegroundColor Red
        }
    }
    
    'upload-backend' {
        $keyPath = "$env:USERPROFILE\.ssh\patabima-ec2"
        
        if (-not (Test-Path $keyPath)) {
            Write-Host "❌ SSH key not found: $keyPath" -ForegroundColor Red
            Write-Host "Run: .\deployment\upload-to-ec2.ps1 -Action setup`n" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "📦 Uploading backend files only (Python + migrations)..." -ForegroundColor Cyan
        
        # Upload specific backend files
        $filesToUpload = @(
            "app\*.py",
            "app\models\*.py",
            "app\views\*.py",
            "app\serializers\*.py",
            "app\migrations\*.py",
            "insurance-app\*.py",
            "manage.py",
            "requirements.txt"
        )
        
        foreach ($pattern in $filesToUpload) {
            $files = Get-ChildItem -Path $LOCAL_BACKEND -Filter $pattern -Recurse -File
            
            foreach ($file in $files) {
                $relativePath = $file.FullName.Substring($LOCAL_BACKEND.Length + 1)
                $remoteDir = Split-Path "$REMOTE_BACKEND/$relativePath" -Parent
                
                Write-Host "Uploading: $relativePath" -ForegroundColor Gray
                
                # Create remote directory
                ssh -i $keyPath $EC2_USER@$EC2_IP "mkdir -p $remoteDir"
                
                # Upload file
                scp -i $keyPath $file.FullName "${EC2_USER}@${EC2_IP}:$REMOTE_BACKEND/$relativePath"
            }
        }
        
        Write-Host "`n✅ Backend files uploaded!" -ForegroundColor Green
        Write-Host "Run migrations: .\deployment\upload-to-ec2.ps1 -Action sync`n" -ForegroundColor Yellow
    }
    
    'upload-file' {
        if (-not $FilePath -or -not $RemotePath) {
            Write-Host "❌ Error: -FilePath and -RemotePath required" -ForegroundColor Red
            Write-Host "Example: .\deployment\upload-to-ec2.ps1 -Action upload-file -FilePath 'C:\path\to\file.py' -RemotePath '/var/www/patabima/app/file.py'`n" -ForegroundColor Yellow
            exit 1
        }
        
        $keyPath = "$env:USERPROFILE\.ssh\patabima-ec2"
        
        if (-not (Test-Path $keyPath)) {
            Write-Host "❌ SSH key not found: $keyPath" -ForegroundColor Red
            Write-Host "Run: .\deployment\upload-to-ec2.ps1 -Action setup`n" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "📤 Uploading single file..." -ForegroundColor Cyan
        Write-Host "Local:  $FilePath" -ForegroundColor DarkGray
        Write-Host "Remote: $RemotePath`n" -ForegroundColor DarkGray
        
        scp -i $keyPath $FilePath "${EC2_USER}@${EC2_IP}:$RemotePath"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ File uploaded successfully!`n" -ForegroundColor Green
        }
        else {
            Write-Host "`n❌ Upload failed!`n" -ForegroundColor Red
        }
    }
    
    'sync' {
        $keyPath = "$env:USERPROFILE\.ssh\patabima-ec2"
        
        if (-not (Test-Path $keyPath)) {
            Write-Host "❌ SSH key not found: $keyPath" -ForegroundColor Red
            Write-Host "Run: .\deployment\upload-to-ec2.ps1 -Action setup`n" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "🔄 Syncing and restarting backend..." -ForegroundColor Cyan
        
        ssh -i $keyPath $EC2_USER@$EC2_IP @"
cd $REMOTE_BACKEND
source venv/bin/activate
export `$(grep -v '^#' .env | xargs)
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart patabima
sudo systemctl status patabima --no-pager
"@
        
        Write-Host "`n✅ Backend synced and restarted!`n" -ForegroundColor Green
    }
}

Write-Host "═══════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "💡 Quick Commands:" -ForegroundColor Yellow
Write-Host "  Setup SSH:      .\deployment\upload-to-ec2.ps1 -Action setup" -ForegroundColor DarkGray
Write-Host "  Upload All:     .\deployment\upload-to-ec2.ps1 -Action upload-all" -ForegroundColor DarkGray
Write-Host "  Upload Backend: .\deployment\upload-to-ec2.ps1 -Action upload-backend" -ForegroundColor DarkGray
Write-Host "  Upload File:    .\deployment\upload-to-ec2.ps1 -Action upload-file -FilePath 'local.py' -RemotePath '/var/www/patabima/app/file.py'" -ForegroundColor DarkGray
Write-Host "  Sync & Restart: .\deployment\upload-to-ec2.ps1 -Action sync`n" -ForegroundColor DarkGray

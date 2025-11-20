# Setup SSH Access to EC2 Instance
# This script helps you configure SSH key pair for direct EC2 access

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet('create-key', 'download-key', 'test-connection', 'setup-all')]
    [string]$Action = 'setup-all'
)

$InstanceId = 'i-0d0f116005d812275'
$Region = 'us-east-1'
$EC2_IP = '44.200.182.180'
$KeyName = 'patabima-ec2-key'
$SSHDir = "$env:USERPROFILE\.ssh"
$KeyPath = "$SSHDir\$KeyName.pem"

Write-Host "`n🔐 EC2 SSH Setup - $Action`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray

function Create-SSHDirectory {
    if (-not (Test-Path $SSHDir)) {
        Write-Host "📁 Creating .ssh directory..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path $SSHDir -Force | Out-Null
        Write-Host "✅ Created: $SSHDir`n" -ForegroundColor Green
    }
    else {
        Write-Host "✅ .ssh directory exists: $SSHDir`n" -ForegroundColor Green
    }
}

function Create-KeyPair {
    Write-Host "🔑 Creating new EC2 key pair..." -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray
    
    # Check if key already exists in AWS
    $existingKey = aws ec2 describe-key-pairs --key-names $KeyName --region $Region 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "⚠️  Key pair '$KeyName' already exists in AWS!" -ForegroundColor Yellow
        Write-Host "Options:" -ForegroundColor Cyan
        Write-Host "  1. Use existing key (if you have the .pem file)" -ForegroundColor White
        Write-Host "  2. Delete and recreate (WARNING: will break existing connections)" -ForegroundColor White
        Write-Host "`nTo delete existing key:" -ForegroundColor Yellow
        Write-Host "  aws ec2 delete-key-pair --key-name $KeyName --region $Region`n" -ForegroundColor DarkGray
        return
    }
    
    # Create new key pair
    Write-Host "Creating key pair in AWS..." -ForegroundColor Yellow
    $KeyMaterial = aws ec2 create-key-pair `
        --key-name $KeyName `
        --region $Region `
        --query 'KeyMaterial' `
        --output text
    
    if ($LASTEXITCODE -eq 0) {
        # Save key to file
        Create-SSHDirectory
        $KeyMaterial | Out-File -FilePath $KeyPath -Encoding ASCII -NoNewline
        
        # Set proper permissions (Windows)
        icacls $KeyPath /inheritance:r
        icacls $KeyPath /grant:r "$($env:USERNAME):(R)"
        
        Write-Host "✅ Key pair created successfully!" -ForegroundColor Green
        Write-Host "📁 Saved to: $KeyPath`n" -ForegroundColor White
        
        Write-Host "⚠️  IMPORTANT: Attach this key to your EC2 instance!" -ForegroundColor Yellow
        Write-Host "Run: .\deployment\setup-ec2-ssh.ps1 -Action attach-key`n" -ForegroundColor Cyan
    }
    else {
        Write-Host "❌ Failed to create key pair" -ForegroundColor Red
    }
}

function Attach-KeyToInstance {
    Write-Host "📎 Attaching key to EC2 instance..." -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray
    
    Write-Host "⚠️  Manual steps required (AWS doesn't allow changing keys on running instances):`n" -ForegroundColor Yellow
    
    Write-Host "METHOD 1: Stop instance and change key (DOWNTIME REQUIRED)" -ForegroundColor Cyan
    Write-Host "1. Stop the instance:" -ForegroundColor White
    Write-Host "   aws ec2 stop-instances --instance-ids $InstanceId --region $Region" -ForegroundColor DarkGray
    Write-Host "2. Wait for stopped state" -ForegroundColor White
    Write-Host "3. Detach root volume" -ForegroundColor White
    Write-Host "4. Attach to temporary instance" -ForegroundColor White
    Write-Host "5. Add public key to authorized_keys" -ForegroundColor White
    Write-Host "6. Reattach and start instance`n" -ForegroundColor White
    
    Write-Host "METHOD 2: Use EC2 Instance Connect to add key (NO DOWNTIME) ✨ RECOMMENDED" -ForegroundColor Green
    Write-Host "1. Go to: https://console.aws.amazon.com/ec2/" -ForegroundColor White
    Write-Host "2. Select instance: $InstanceId" -ForegroundColor White
    Write-Host "3. Click 'Connect' → 'EC2 Instance Connect'" -ForegroundColor White
    Write-Host "4. Once connected, run:" -ForegroundColor White
    Write-Host "   echo 'YOUR_PUBLIC_KEY' >> ~/.ssh/authorized_keys" -ForegroundColor DarkGray
    Write-Host "   chmod 600 ~/.ssh/authorized_keys`n" -ForegroundColor DarkGray
    
    Write-Host "To generate public key from your .pem file:" -ForegroundColor Yellow
    Write-Host "  ssh-keygen -y -f $KeyPath`n" -ForegroundColor DarkGray
}

function Test-SSHConnection {
    Write-Host "🧪 Testing SSH connection..." -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray
    
    if (-not (Test-Path $KeyPath)) {
        Write-Host "❌ Key file not found: $KeyPath" -ForegroundColor Red
        Write-Host "Run: .\deployment\setup-ec2-ssh.ps1 -Action create-key`n" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Testing connection to ec2-user@$EC2_IP..." -ForegroundColor Yellow
    Write-Host "Command: ssh -i $KeyPath ec2-user@$EC2_IP`n" -ForegroundColor DarkGray
    
    ssh -i $KeyPath -o ConnectTimeout=10 ec2-user@$EC2_IP "echo '✅ SSH connection successful!' && uname -a"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ SSH connection working!`n" -ForegroundColor Green
        Write-Host "You can now connect with:" -ForegroundColor Cyan
        Write-Host "  ssh -i $KeyPath ec2-user@$EC2_IP`n" -ForegroundColor White
        
        Write-Host "Or use the direct execution script:" -ForegroundColor Cyan
        Write-Host "  .\deployment\ec2-ssh-exec.ps1 -Action status`n" -ForegroundColor White
    }
    else {
        Write-Host "`n❌ SSH connection failed" -ForegroundColor Red
        Write-Host "`nCommon issues:" -ForegroundColor Yellow
        Write-Host "  1. Public key not added to EC2 instance" -ForegroundColor White
        Write-Host "  2. Security group doesn't allow SSH (port 22)" -ForegroundColor White
        Write-Host "  3. Wrong username (should be 'ec2-user' for Amazon Linux)" -ForegroundColor White
        Write-Host "  4. Key file permissions incorrect`n" -ForegroundColor White
    }
}

function Show-NextSteps {
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray
    
    if (Test-Path $KeyPath) {
        Write-Host "✅ SSH key exists: $KeyPath`n" -ForegroundColor Green
        
        Write-Host "1️⃣  Generate public key:" -ForegroundColor Cyan
        Write-Host "    ssh-keygen -y -f $KeyPath`n" -ForegroundColor White
        
        Write-Host "2️⃣  Add public key to EC2 (use Browser SSH):" -ForegroundColor Cyan
        Write-Host "    a. Connect: https://console.aws.amazon.com/ec2/ → Instance Connect" -ForegroundColor White
        Write-Host "    b. Run: echo 'PASTE_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys" -ForegroundColor White
        Write-Host "    c. Run: chmod 600 ~/.ssh/authorized_keys`n" -ForegroundColor White
        
        Write-Host "3️⃣  Test connection:" -ForegroundColor Cyan
        Write-Host "    .\deployment\setup-ec2-ssh.ps1 -Action test-connection`n" -ForegroundColor White
        
        Write-Host "4️⃣  Use direct execution:" -ForegroundColor Cyan
        Write-Host "    .\deployment\ec2-ssh-exec.ps1 -Action create-admin`n" -ForegroundColor White
    }
    else {
        Write-Host "1️⃣  Create SSH key pair:" -ForegroundColor Cyan
        Write-Host "    .\deployment\setup-ec2-ssh.ps1 -Action create-key`n" -ForegroundColor White
    }
}

switch ($Action) {
    'create-key' {
        Create-KeyPair
        Show-NextSteps
    }
    
    'download-key' {
        Write-Host "⚠️  You cannot download existing keys from AWS" -ForegroundColor Yellow
        Write-Host "If you lost your key, you must create a new one.`n" -ForegroundColor White
        Show-NextSteps
    }
    
    'test-connection' {
        Test-SSHConnection
    }
    
    'setup-all' {
        Create-SSHDirectory
        
        if (Test-Path $KeyPath) {
            Write-Host "✅ Key already exists: $KeyPath`n" -ForegroundColor Green
            Test-SSHConnection
        }
        else {
            Write-Host "No SSH key found. Let's create one!`n" -ForegroundColor Yellow
            Create-KeyPair
        }
        
        Show-NextSteps
    }
}

Write-Host "═══════════════════════════════════════════`n" -ForegroundColor DarkGray

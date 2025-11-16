<#
.SYNOPSIS
  One-time CLI deployment script for PataBima backend (Django) to EC2 + optional frontend API URL update.

.DESCRIPTION
  - Uploads backend .env to EC2
  - Syncs repository to EC2
  - Installs/updates Python venv and requirements
  - Runs Django migrations and optionally collectstatic
  - Configures and restarts Gunicorn + Nginx (optional)
  - Optionally runs certbot for HTTPS
  - Optionally updates frontend EXPO_PUBLIC_API_BASE_URL
  - Validates backend health endpoint

.PARAMETER Host
  SSH host e.g. ubuntu@ec2-11-22-33-44.compute.amazonaws.com

.PARAMETER KeyPath
  Path to your SSH private key (.pem)

.PARAMETER EnvFilePath
  Local path to backend .env file that will be uploaded to EC2

.PARAMETER Domain
  Public domain for Nginx server_name and HTTPS (optional). If omitted, Nginx will use a wildcard server_name _ and HTTP only.

.PARAMETER ApiUrl
  Frontend API base URL (optional). If provided, script updates frontend/.env accordingly.

.PARAMETER RemotePath
  Remote project root path (default: /home/ubuntu/Patabimavs20)

.PARAMETER BuildStatic
  If specified, collects static files (python manage.py collectstatic)

.PARAMETER SetupNginx
  If specified, writes Nginx site and Gunicorn unit files and restarts services

.PARAMETER SetupCertbot
  If specified, runs certbot for the provided Domain (requires SetupNginx and Domain)

.EXAMPLE
  ./one_time_deploy.ps1 -Host ubuntu@ec2-11-22-33-44.compute.amazonaws.com -KeyPath C:\keys\pata.pem -EnvFilePath ..\insurance-app\.env -Domain api.your-domain.com -ApiUrl https://api.your-domain.com -BuildStatic -SetupNginx -SetupCertbot

#>

[CmdletBinding()] param(
  [Parameter(Mandatory = $true)] [string]$SSHHost,
  [Parameter(Mandatory = $true)] [string]$KeyPath,
  [Parameter(Mandatory = $true)] [string]$EnvFilePath,
  [string]$Domain,
  [string]$ApiUrl,
  [string]$RemotePath = "/home/ubuntu/Patabimavs20",
  [switch]$BuildStatic,
  [switch]$SetupNginx,
  [switch]$SetupCertbot,
  [switch]$Testing
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Test-Command {
  param([string]$Name)
  $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Run-RemoteCommand {
  param([string]$Command)
  & ssh -i $KeyPath $SSHHost $Command
}

function Copy-ToRemote {
  param([string]$Local, [string]$Remote)
  & scp -i $KeyPath $Local "${SSHHost}:$Remote"
}

Write-Host "=== PataBima One-Time Deployment ===" -ForegroundColor Cyan
Write-Host "Host: $SSHHost"
if ($Domain) { Write-Host "Domain: $Domain" }
if ($ApiUrl) { Write-Host "Frontend API URL: $ApiUrl" }
Write-Host "RemotePath: $RemotePath"

# Pre-flight checks
if (-not (Test-Path $EnvFilePath)) { throw "EnvFilePath not found: $EnvFilePath" }
if (-not (Test-Command ssh)) { throw "ssh command not found. Install OpenSSH client and retry." }
if (-not (Test-Command scp)) { throw "scp command not found. Install OpenSSH client and retry." }

# Create log directory
$logDir = Join-Path $PSScriptRoot 'logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logPath = Join-Path $logDir "deploy-$timestamp.log"
Start-Transcript -Path $logPath | Out-Null

try {
  # 1) Upload .env to EC2
  Write-Host "Uploading backend .env to EC2..." -ForegroundColor Yellow
  Copy-ToRemote -Local $EnvFilePath -Remote "~/pata.env"

  # 2) Package repository excluding heavy directories
  Write-Host "Packaging repository..." -ForegroundColor Yellow
  $zip = Join-Path $PSScriptRoot 'deploy.zip'
  if (Test-Path $zip) { Remove-Item $zip -Force }
  # Exclude common heavy folders
  $excludes = @('node_modules', '*.git*', '*.cache*', '*.log')
  $root = Resolve-Path (Join-Path $PSScriptRoot '..')
  Push-Location $root
  # Compress-Archive -Exclude parameter isn't recursive by wildcard; use two-step approach
  $items = Get-ChildItem -Force | Where-Object { $_.Name -notmatch '^\.git$' -and $_.Name -ne 'node_modules' }
  Compress-Archive -Path $items.FullName -DestinationPath $zip -Force
  Pop-Location

  # 3) Upload package
  Write-Host "Uploading package to EC2..." -ForegroundColor Yellow
  Copy-ToRemote -Local $zip -Remote "~/deploy.zip"

  # 4) Remote setup: unpack, install, migrate, optional collectstatic
  Write-Host "Running remote install and migration..." -ForegroundColor Yellow
  $remoteBoot = @"
set -e
sudo apt-get update -y
sudo apt-get install -y python3-venv python3-pip nginx unzip libpq-dev
mkdir -p $RemotePath
cd $RemotePath
unzip -o ~/deploy.zip
cd insurance-app
# Move env into place
mv -f ~/pata.env .env
python3 -m venv venv || true
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate --noinput
"@
  if ($BuildStatic) { $remoteBoot += "\npython manage.py collectstatic --noinput\n" }

  # 5) Configure runtime
  if ($SetupNginx) {
    $serverName = ($Domain) ? "$Domain www.$Domain" : "_"
    $gunicornUnit = @"
[Unit]
Description=Gunicorn daemon for PataBima Django API
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=$RemotePath/insurance-app
EnvironmentFile=$RemotePath/insurance-app/.env
ExecStart=$RemotePath/insurance-app/venv/bin/gunicorn --access-logfile - --workers 3 --bind unix:$RemotePath/insurance-app/gunicorn.sock insurance-app.wsgi:application

[Install]
WantedBy=multi-user.target
"@
    $nginxConf = @"
server {
    listen 80;
    server_name $serverName;

    location = /favicon.ico { access_log off; log_not_found off; }
    location /static/ { root $RemotePath/insurance-app; }
    location /media/  { root $RemotePath/insurance-app; }
    location / { include proxy_params; proxy_pass http://unix:$RemotePath/insurance-app/gunicorn.sock; }
}
"@

    # Upload config files
    $tmpUnit = Join-Path $PSScriptRoot 'gunicorn.service'
    $tmpNginx = Join-Path $PSScriptRoot 'patabima.nginx'
    Set-Content -Path $tmpUnit -Value $gunicornUnit -Encoding UTF8
    Set-Content -Path $tmpNginx -Value $nginxConf -Encoding UTF8
    Copy-ToRemote -Local $tmpUnit -Remote "/tmp/gunicorn.service"
    Copy-ToRemote -Local $tmpNginx -Remote "/tmp/patabima"

    $remoteBoot += @"
sudo mv /tmp/gunicorn.service /etc/systemd/system/gunicorn.service
sudo mv /tmp/patabima /etc/nginx/sites-available/patabima
sudo ln -sf /etc/nginx/sites-available/patabima /etc/nginx/sites-enabled/patabima
sudo systemctl daemon-reload
sudo systemctl enable gunicorn
sudo systemctl restart gunicorn
sudo nginx -t && sudo systemctl restart nginx
"@

    if ($SetupCertbot) {
      if (-not $Domain) { throw "SetupCertbot requires -Domain to be provided." }
      $remoteBoot += @"
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d $Domain -d www.$Domain --non-interactive --agree-tos -m admin@$Domain || true
"@
    }
  }
  else {
    if ($Testing) {
      # Testing mode: run Gunicorn directly on :8000 (no Nginx)
      $remoteBoot += @"
nohup $RemotePath/insurance-app/venv/bin/gunicorn insurance-app.wsgi:application --bind 0.0.0.0:8000 --workers 3 --access-logfile - > $RemotePath/gunicorn.log 2>&1 &
"@
    }
    else {
      # No Nginx/Testing: leave services installed and ready; user can start manually
      $remoteBoot += @"
# Services prepared. You can run gunicorn manually if needed.
"@
    }
  }

  # Write and run remote bootstrap
  $remoteScript = "/tmp/pb_boot.sh"
  $tmpBoot = Join-Path $PSScriptRoot 'pb_boot.sh'
  Set-Content -Path $tmpBoot -Value $remoteBoot -Encoding UTF8
  Copy-ToRemote -Local $tmpBoot -Remote $remoteScript
  Invoke-Remote -Command "bash $remoteScript"

  # 6) Validate health
  # Determine host DNS/IP for health check when no domain provided
  $hostOnly = ($SSHHost -split '@')[-1]
  $healthUrl = if ($Domain) { "https://$Domain/api/v1/health/" } else { "http://$hostOnly:8000/api/v1/health/" }
  Write-Host "Validating health: $healthUrl" -ForegroundColor Yellow
  try {
    $resp = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 15
    Write-Host "Health OK: $($resp.StatusCode)" -ForegroundColor Green
  }
  catch {
    Write-Warning "Health check failed: $($_.Exception.Message)"
  }

  # 7) Update frontend API URL if provided
  if ($ApiUrl) {
    $frontendEnv = Join-Path $PSScriptRoot '..' 'frontend' '.env'
    Set-Content -Path $frontendEnv -Value "EXPO_PUBLIC_API_BASE_URL=$ApiUrl" -Encoding UTF8
    Write-Host "Updated frontend .env with EXPO_PUBLIC_API_BASE_URL=$ApiUrl" -ForegroundColor Green
  }

  Write-Host "Deployment complete." -ForegroundColor Green
}
catch {
  Write-Error $_.Exception.Message
  exit 1
}
finally {
  Stop-Transcript | Out-Null
  if (Test-Path $zip) { Remove-Item $zip -Force }
}

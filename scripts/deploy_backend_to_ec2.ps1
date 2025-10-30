param(
  [Parameter(Mandatory = $true)]
  [string]$Host,  # ubuntu@ec2-x-x-x-x.compute.amazonaws.com
  [Parameter(Mandatory = $true)]
  [string]$KeyPath,  # Path to .pem key
  [string]$RemotePath = "/home/ubuntu/Patabimavs20",
  [switch]$BuildStatic
)

$ErrorActionPreference = 'Stop'

Write-Host "Syncing repository to $Host:$RemotePath"

# Compress local repo (excluding node_modules and git)
$zip = Join-Path $PSScriptRoot 'deploy.zip'
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path "..\*" -DestinationPath $zip -Force -CompressionLevel Optimal -Exclude *.git*, node_modules/*

# Upload archive
& scp -i $KeyPath $zip "$Host:~/deploy.zip"

# Remote commands
$remote = @"
set -e
mkdir -p $RemotePath
cd $RemotePath
unzip -o ~/deploy.zip
cd insurance-app
python3 -m venv venv || true
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate --noinput
if [ "$BuildStatic" = "True" ]; then python manage.py collectstatic --noinput; fi
sudo systemctl restart gunicorn || true
sudo systemctl restart nginx || true
"@

& ssh -i $KeyPath $Host $remote
Write-Host "Deployment complete."

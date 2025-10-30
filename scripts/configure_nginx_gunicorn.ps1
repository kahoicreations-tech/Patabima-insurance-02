param(
  [Parameter(Mandatory = $true)]
  [string]$Host,
  [Parameter(Mandatory = $true)]
  [string]$KeyPath,
  [Parameter(Mandatory = $true)]
  [string]$Domain
)

$ErrorActionPreference = 'Stop'

$unit = @"
[Unit]
Description=Gunicorn daemon for PataBima Django API
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/Patabimavs20/insurance-app
EnvironmentFile=/home/ubuntu/Patabimavs20/insurance-app/.env
ExecStart=/home/ubuntu/Patabimavs20/insurance-app/venv/bin/gunicorn --access-logfile - --workers 3 --bind unix:/home/ubuntu/Patabimavs20/insurance-app/gunicorn.sock insurance-app.wsgi:application

[Install]
WantedBy=multi-user.target
"@

$nginx = @"
server {
    listen 80;
    server_name $Domain www.$Domain;

    location = /favicon.ico { access_log off; log_not_found off; }
    location /static/ { root /home/ubuntu/Patabimavs20/insurance-app; }
    location /media/ { root /home/ubuntu/Patabimavs20/insurance-app; }
    location / { include proxy_params; proxy_pass http://unix:/home/ubuntu/Patabimavs20/insurance-app/gunicorn.sock; }
}
"@

Set-Content -Path (Join-Path $PSScriptRoot 'gunicorn.service') -Value $unit
Set-Content -Path (Join-Path $PSScriptRoot 'patabima.nginx') -Value $nginx

& scp -i $KeyPath (Join-Path $PSScriptRoot 'gunicorn.service') "$Host:/tmp/gunicorn.service"
& scp -i $KeyPath (Join-Path $PSScriptRoot 'patabima.nginx') "$Host:/tmp/patabima"

$remote = @"
sudo mv /tmp/gunicorn.service /etc/systemd/system/gunicorn.service
sudo mv /tmp/patabima /etc/nginx/sites-available/patabima
sudo ln -sf /etc/nginx/sites-available/patabima /etc/nginx/sites-enabled/patabima
sudo systemctl daemon-reload
sudo systemctl enable gunicorn
sudo systemctl restart gunicorn
sudo nginx -t && sudo systemctl restart nginx
"@

& ssh -i $KeyPath $Host $remote
Write-Host "Nginx and Gunicorn configured for $Domain"

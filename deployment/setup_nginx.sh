#!/bin/bash
# PataBima Nginx Setup Script
# Run this on your EC2 instance to configure Nginx

set -e

echo "========================================="
echo "PataBima Nginx Configuration Setup"
echo "========================================="

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
  echo "Please run with sudo: sudo bash setup_nginx.sh"
  exit 1
fi

# Step 1: Install Nginx
echo "[1/7] Installing Nginx..."
apt-get update
apt-get install -y nginx

# Step 2: Create media and static directories
echo "[2/7] Creating media and static directories..."
mkdir -p /var/www/patabima/media/campaign_banners
mkdir -p /var/www/patabima/staticfiles
chown -R ubuntu:ubuntu /var/www/patabima

# Step 3: Copy media files from Django project (if they exist)
echo "[3/7] Copying media files from Django project..."
if [ -d "/home/ubuntu/patabima/insurance-app/media" ]; then
    cp -r /home/ubuntu/patabima/insurance-app/media/* /var/www/patabima/media/ || true
    echo "Media files copied successfully"
else
    echo "Warning: Django media directory not found. Please upload campaign images later."
fi

# Step 4: Collect Django static files
echo "[4/7] Collecting Django static files..."
cd /home/ubuntu/patabima || cd /home/ubuntu/PATABIMA* || echo "Django project directory not found"

if [ -f "insurance-app/manage.py" ]; then
    # Assuming you have a virtual environment
    if [ -d "venv" ]; then
        source venv/bin/activate
        python insurance-app/manage.py collectstatic --noinput --settings=insurance-app.settings
        deactivate
    else
        python3 insurance-app/manage.py collectstatic --noinput --settings=insurance-app.settings
    fi
    
    # Copy collected static files
    if [ -d "insurance-app/staticfiles" ]; then
        cp -r insurance-app/staticfiles/* /var/www/patabima/staticfiles/
        echo "Static files collected and copied"
    fi
else
    echo "Warning: Django manage.py not found. Static files not collected."
fi

# Step 5: Copy Nginx configuration
echo "[5/7] Configuring Nginx..."
cat > /etc/nginx/sites-available/patabima <<'EOF'
server {
    listen 80;
    server_name ec2-34-203-241-81.compute-1.amazonaws.com;
    client_max_body_size 100M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Static files
    location /static/ {
        alias /var/www/patabima/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Media files (campaign images, policy documents, etc.)
    location /media/ {
        alias /var/www/patabima/media/;
        expires 7d;
        add_header Cache-Control "public";
        
        # Enable CORS for image loading from React Native
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
    }

    # Proxy all other requests to Gunicorn
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Admin interface
    location /admin/ {
        proxy_pass http://127.0.0.1:8000/admin/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:8000/api/v1/health/;
        access_log off;
    }
}
EOF

# Step 6: Enable site and remove default
echo "[6/7] Enabling site configuration..."
ln -sf /etc/nginx/sites-available/patabima /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Step 7: Restart services
echo "[7/7] Restarting services..."
systemctl restart nginx
systemctl enable nginx

# Restart Gunicorn if it's running as a service
if systemctl is-active --quiet gunicorn; then
    systemctl restart gunicorn
    echo "Gunicorn restarted"
fi

echo ""
echo "========================================="
echo "✅ Nginx Setup Complete!"
echo "========================================="
echo ""
echo "Your app should now be accessible at:"
echo "  - http://ec2-34-203-241-81.compute-1.amazonaws.com"
echo "  - http://ec2-34-203-241-81.compute-1.amazonaws.com/admin/"
echo ""
echo "Next steps:"
echo "1. Verify Nginx is running: sudo systemctl status nginx"
echo "2. Test the admin: curl -I http://ec2-34-203-241-81.compute-1.amazonaws.com/admin/"
echo "3. Upload campaign images to: /var/www/patabima/media/campaign_banners/"
echo ""
echo "File permissions:"
echo "  - Media dir owner: $(ls -ld /var/www/patabima/media | awk '{print $3":"$4}')"
echo "  - Static dir owner: $(ls -ld /var/www/patabima/staticfiles | awk '{print $3":"$4}')"
echo ""

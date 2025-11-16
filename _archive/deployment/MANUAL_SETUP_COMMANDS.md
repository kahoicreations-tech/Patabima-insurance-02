# EC2 Admin Setup - Manual Commands

## Step-by-Step Instructions

Since we don't have direct SSH/SSM access, please follow these steps manually:

### Option 1: AWS Console (Easiest)

1. **Open EC2 Instance Connect in your browser:**

   - Go to: https://console.aws.amazon.com/ec2/
   - Click on instance `i-0041c3db00d399836`
   - Click "Connect" button (top right)
   - Select "EC2 Instance Connect" tab
   - Click "Connect"

2. **Once connected, copy and paste this entire block:**

```bash
# Install Nginx
sudo apt-get update
sudo apt-get install -y nginx

# Create directories
sudo mkdir -p /var/www/patabima/media/campaign_banners
sudo mkdir -p /var/www/patabima/staticfiles
sudo chown -R ubuntu:ubuntu /var/www/patabima

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/patabima > /dev/null <<'EOF'
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

# Enable the site
sudo ln -sf /etc/nginx/sites-available/patabima /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Show status
echo "========================================"
echo "✅ Setup Complete!"
echo "========================================"
echo "Nginx status:"
sudo systemctl status nginx --no-pager | head -20

echo ""
echo "Testing endpoints:"
curl -I http://localhost/admin/ 2>&1 | head -5
echo ""
curl -I http://localhost/health 2>&1 | head -5
```

3. **Verify it worked:**

You should see:

- ✅ Nginx status: `active (running)`
- ✅ Admin endpoint returning HTTP 200 or 302

### Your Admin Links:

After setup completes, your admin will be accessible at:

**Primary URL (via Nginx):**

```
http://ec2-34-203-241-81.compute-1.amazonaws.com/admin/
```

**Backup URL (direct to Gunicorn - already working):**

```
http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/admin/
```

### Create Superuser (If Needed)

If you need to create an admin user, run this in the EC2 console:

```bash
# Find your Django project directory
cd ~
find . -name "manage.py" -type f 2>/dev/null

# Once found, navigate to it (example):
cd ~/patabima/insurance-app
# OR
cd ~/PATABIMA*/insurance-app

# Create superuser
python3 manage.py createsuperuser

# Follow prompts:
# Username: admin
# Email: your@email.com
# Password: (choose a strong password)
```

### Option 2: Use AWS Session Manager Browser Extension

If you have the AWS Session Manager plugin installed:

```powershell
# From PowerShell on your local machine
aws ssm start-session --target i-0041c3db00d399836
```

Then paste the setup commands above.

### Option 3: PuTTY or SSH Client

If you have a `.pem` key file:

1. Convert `.pem` to `.ppk` using PuTTYgen (if using PuTTY)
2. Connect to: `ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com`
3. Paste the setup commands

---

## Troubleshooting

### If Nginx fails to start:

```bash
# Check error logs
sudo tail -f /var/log/nginx/error.log

# Check if port 80 is blocked
sudo netstat -tulpn | grep :80
```

### If admin still doesn't work:

```bash
# Check Gunicorn is running
ps aux | grep gunicorn

# Check Gunicorn is on port 8000
sudo netstat -tulpn | grep :8000

# Test direct connection
curl http://localhost:8000/admin/
```

### To upload campaign images:

```bash
# From EC2 terminal
cd /var/www/patabima/media/campaign_banners/

# Upload via wget
sudo wget https://example.com/your-image.jpg

# Or from your local machine via SCP (if SSH works):
# scp -i key.pem image.jpg ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com:/tmp/
# Then move it: sudo mv /tmp/image.jpg /var/www/patabima/media/campaign_banners/
```

---

## Summary

After completing these steps:

✅ Admin accessible at: **http://ec2-34-203-241-81.compute-1.amazonaws.com/admin/**
✅ No port 8000 needed
✅ Campaign images will load properly
✅ Static files (CSS/JS) will work
✅ Everything that worked on localhost will work on EC2

**The port :8000 version will continue to work as a backup.**

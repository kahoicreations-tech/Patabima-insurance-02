# EC2 Nginx Setup Guide

## Problem

The admin panel works on **port 8000** (`http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/admin/`) but fails without the port because Nginx isn't configured to proxy traffic to Gunicorn.

## Solution

Set up Nginx as a reverse proxy to:

- Forward HTTP traffic (port 80) to Gunicorn (port 8000)
- Serve media files directly (campaign images, documents)
- Serve static files (CSS, JS, admin assets)

## Quick Setup (Automated)

### Option 1: Run the Setup Script

1. **Upload the setup script to EC2:**

   ```powershell
   scp -i "your-key.pem" deployment/setup_nginx.sh ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com:~/
   ```

2. **SSH into EC2 and run the script:**

   ```bash
   ssh -i "your-key.pem" ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com
   sudo bash setup_nginx.sh
   ```

3. **Test the setup:**

   ```bash
   # Check Nginx status
   sudo systemctl status nginx

   # Test admin access (should return 200 or 302)
   curl -I http://localhost/admin/

   # Test from your local machine
   curl -I http://ec2-34-203-241-81.compute-1.amazonaws.com/admin/
   ```

### Option 2: Manual Setup

If you prefer manual control, follow these steps:

#### Step 1: Install Nginx

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

#### Step 2: Create Media & Static Directories

```bash
sudo mkdir -p /var/www/patabima/media/campaign_banners
sudo mkdir -p /var/www/patabima/staticfiles
sudo chown -R ubuntu:ubuntu /var/www/patabima
```

#### Step 3: Copy Django Media Files

```bash
# Find your Django project directory
cd /home/ubuntu/patabima  # Or wherever your project is

# Copy media files
if [ -d "insurance-app/media" ]; then
    sudo cp -r insurance-app/media/* /var/www/patabima/media/
fi
```

#### Step 4: Collect Django Static Files

```bash
# Activate virtual environment if you have one
source venv/bin/activate  # Or skip if not using venv

# Collect static files
cd insurance-app
python manage.py collectstatic --noinput

# Copy to Nginx directory
sudo cp -r staticfiles/* /var/www/patabima/staticfiles/
```

#### Step 5: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/patabima
```

Paste this configuration:

```nginx
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
```

#### Step 6: Enable the Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/patabima /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t
```

#### Step 7: Restart Services

```bash
# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx

# If you have Gunicorn as a service, restart it too
sudo systemctl restart gunicorn  # If applicable
```

## Verification

### 1. Check Services Are Running

```bash
# Nginx
sudo systemctl status nginx

# Gunicorn (if running as service)
sudo systemctl status gunicorn

# Or check the process
ps aux | grep gunicorn
```

### 2. Test Endpoints

```bash
# Health check
curl http://localhost/health

# Admin (should redirect to login or show login page)
curl -I http://localhost/admin/

# API endpoint
curl http://localhost/api/v1/motor/categories
```

### 3. Test from Your Browser

- Admin: http://ec2-34-203-241-81.compute-1.amazonaws.com/admin/
- Health: http://ec2-34-203-241-81.compute-1.amazonaws.com/health
- API: http://ec2-34-203-241-81.compute-1.amazonaws.com/api/v1/motor/categories

### 4. Test Campaign Images

```bash
# List campaign images
ls -lh /var/www/patabima/media/campaign_banners/

# Test image access
curl -I http://localhost/media/campaign_banners/2148410809_1.jpg
```

## Update Frontend Environment Variable

Once Nginx is working, you can **optionally** update your frontend to use port 80 (no port needed):

**frontend/.env:**

```env
# Before (current - works fine)
EXPO_PUBLIC_API_BASE_URL=http://ec2-34-203-241-81.compute-1.amazonaws.com:8000

# After (once Nginx is configured)
EXPO_PUBLIC_API_BASE_URL=http://ec2-34-203-241-81.compute-1.amazonaws.com
```

**⚠️ Note:** You don't need to change this immediately. Port 8000 works fine. This is just cleaner.

## Troubleshooting

### Nginx Won't Start

```bash
# Check configuration syntax
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log

# Check port 80 is not in use
sudo netstat -tulpn | grep :80
```

### Admin Returns 502 Bad Gateway

```bash
# Check Gunicorn is running
ps aux | grep gunicorn

# Check Gunicorn logs
sudo journalctl -u gunicorn -n 50

# Verify Gunicorn is listening on port 8000
sudo netstat -tulpn | grep :8000
```

### Campaign Images Still 404

```bash
# Check file exists
ls -lh /var/www/patabima/media/campaign_banners/

# Check permissions
sudo chown -R ubuntu:ubuntu /var/www/patabima/media
sudo chmod -R 755 /var/www/patabima/media

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### Permission Denied Errors

```bash
# Fix ownership
sudo chown -R ubuntu:www-data /var/www/patabima
sudo chmod -R 755 /var/www/patabima

# Ensure Nginx user can read files
sudo usermod -a -G ubuntu www-data
```

## Uploading Campaign Images

If campaign images are missing, upload them:

### Method 1: Via SCP

```powershell
# From your local machine
scp -i "your-key.pem" path/to/image.jpg ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com:/var/www/patabima/media/campaign_banners/
```

### Method 2: Via Django Admin

1. Go to: http://ec2-34-203-241-81.compute-1.amazonaws.com/admin/
2. Login with superuser credentials
3. Navigate to **Campaigns**
4. Edit a campaign and upload the banner image
5. Django will automatically save to the correct location

### Method 3: Direct on Server

```bash
# SSH into EC2
ssh -i "your-key.pem" ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com

# Use wget or curl to download images
cd /var/www/patabima/media/campaign_banners/
sudo wget https://example.com/image.jpg
sudo chown ubuntu:ubuntu *.jpg
```

## Security Group Configuration

Ensure your EC2 Security Group allows inbound traffic:

| Type  | Protocol | Port Range | Source    | Description           |
| ----- | -------- | ---------- | --------- | --------------------- |
| HTTP  | TCP      | 80         | 0.0.0.0/0 | Public HTTP access    |
| HTTPS | TCP      | 443        | 0.0.0.0/0 | Public HTTPS (future) |
| SSH   | TCP      | 22         | Your IP   | SSH access            |

**⚠️ Important:** Port 8000 should NOT be open to the public once Nginx is configured. Remove it from security group rules.

## Future: HTTPS Setup

Once Nginx is working, you can add SSL/TLS:

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate (requires a domain name)
sudo certbot --nginx -d yourdomain.com
```

For now, HTTP is fine for testing.

## Summary

After running the setup:

✅ Admin accessible at: http://ec2-34-203-241-81.compute-1.amazonaws.com/admin/
✅ API accessible at: http://ec2-34-203-241-81.compute-1.amazonaws.com/api/
✅ Campaign images served from /media/
✅ Static files (CSS/JS) served from /static/
✅ Port 8000 no longer exposed directly

Everything that worked on localhost will work exactly the same on EC2, just without the `:8000` port.

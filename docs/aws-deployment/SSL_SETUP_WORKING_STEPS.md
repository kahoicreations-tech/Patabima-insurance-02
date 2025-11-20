# SSL Setup Working Steps - api.hugo-shopping.com

**Date Completed**: November 19, 2025  
**Domain**: hugo-shopping.com  
**Subdomain**: api.hugo-shopping.com  
**EC2 IP**: 44.200.182.180  
**Status**: ✅ Successfully Configured

---

## Overview

This document contains the **exact steps and commands that worked** to set up SSL for PataBima backend using `api.hugo-shopping.com` subdomain. All commands have been tested and verified working.

---

## Step 1: DNS Configuration in cPanel

**Action**: Create A record for subdomain

**Steps**:
1. Login to cPanel for `hugo-shopping.com`
2. Navigate to: **Domains → Zone Editor**
3. Click **"+ A Record"** button next to `hugo-shopping.com`
4. Fill in the form:
   - **Type**: A (already selected)
   - **Name**: `api`
   - **TTL**: `300`
   - **Address**: `44.200.182.180`
5. Click **"Add Record"** or **"Save"**

**Result**: 
```
DNS Record Created:
api.hugo-shopping.com → 44.200.182.180
```

**Verification Command** (Windows PowerShell):
```powershell
nslookup api.hugo-shopping.com
```

**Expected Output**:
```
Server:  UnKnown
Address:  192.168.0.1

Non-authoritative answer:
Name:    api.hugo-shopping.com
Address: 44.200.182.180
```

**Status**: ✅ DNS propagation complete (verified)

---

## Step 2: Connect to EC2 Instance

**Method Used**: EC2 Instance Connect (browser-based)

**Steps**:
1. Open AWS Console → EC2 Dashboard
2. Select instance: `i-0d0f116005d812275`
3. Click **"Connect"** button (top right)
4. Choose **"EC2 Instance Connect"** tab
5. Username: `ec2-user` (default)
6. Click **"Connect"** button

**Result**: Browser terminal opens with prompt:
```
[ec2-user@ip-172-31-75-47 ~]$
```

**Alternative Method** (SSH with key):
```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.200.182.180
```

**Status**: ✅ Connected successfully via EC2 Instance Connect

---

## Step 3: Install Certbot for SSL

**Action**: Install Let's Encrypt SSL tool

**Command**:
```bash
sudo dnf install -y certbot python3-certbot-nginx
```

**What it installs**:
- `certbot` - Let's Encrypt certificate management tool
- `python3-certbot-nginx` - Nginx plugin for automatic configuration

**Expected Output**:
```
Installed:
  certbot-2.x.x
  python3-certbot-nginx-2.x.x
Complete!
```

**Verification**:
```bash
certbot --version
```

**Status**: ✅ Certbot installed successfully

---

## Step 4: Update Nginx Configuration

**Action**: Add new subdomain to Nginx server_name

**Step 4.1**: Check current configuration
```bash
sudo cat /etc/nginx/conf.d/patabima.conf | grep server_name
```

**Output Before**:
```nginx
server_name 44.200.182.180 api.patabima.co.ke;
```

**Step 4.2**: Edit Nginx configuration
```bash
sudo nano /etc/nginx/conf.d/patabima.conf
```

**Step 4.3**: Update server_name line

**Find this line**:
```nginx
server_name 44.200.182.180 api.patabima.co.ke;
```

**Change to**:
```nginx
server_name 44.200.182.180 api.patabima.co.ke api.hugo-shopping.com;
```

**Save**: `Ctrl+O`, `Enter`, `Ctrl+X`

**Step 4.4**: Test Nginx configuration
```bash
sudo nginx -t
```

**Expected Output**:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Step 4.5**: Reload Nginx
```bash
sudo systemctl reload nginx
```

**Verification**:
```bash
sudo cat /etc/nginx/conf.d/patabima.conf | grep server_name
```

**Output After**:
```nginx
server_name 44.200.182.180 api.patabima.co.ke api.hugo-shopping.com;
```

**Status**: ✅ Nginx configured for new subdomain

---

## Step 5: Obtain Let's Encrypt SSL Certificate

**Action**: Request SSL certificate for api.hugo-shopping.com

**Command**:
```bash
sudo certbot --nginx -d api.hugo-shopping.com --email admin@hugo-shopping.com --non-interactive --agree-tos --redirect
```

**Command Breakdown**:
- `--nginx` - Use Nginx plugin (auto-configures)
- `-d api.hugo-shopping.com` - Domain to secure
- `--email admin@hugo-shopping.com` - Contact email
- `--non-interactive` - No prompts (automated)
- `--agree-tos` - Accept Let's Encrypt Terms of Service
- `--redirect` - Auto-redirect HTTP → HTTPS

**Expected Output**:
```
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Account registered.
Requesting a certificate for api.hugo-shopping.com

Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/api.hugo-shopping.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/api.hugo-shopping.com/privkey.pem
This certificate expires on 2026-02-16.
These files will be updated when the certificate renews.
Certbot has set up a scheduled task to automatically renew this certificate in the background.

Deploying certificate
Successfully deployed certificate for api.hugo-shopping.com to /etc/nginx/conf.d/patabima.conf
Congratulations! You have successfully enabled HTTPS on https://api.hugo-shopping.com
```

**What Certbot Did Automatically**:
1. ✅ Validated domain ownership (HTTP challenge)
2. ✅ Issued SSL certificate (valid 90 days)
3. ✅ Saved certificate files to `/etc/letsencrypt/live/api.hugo-shopping.com/`
4. ✅ Updated Nginx config with SSL server block
5. ✅ Configured HTTP to HTTPS redirect
6. ✅ Set up auto-renewal via systemd timer

**Certificate Details**:
```
Certificate Path: /etc/letsencrypt/live/api.hugo-shopping.com/fullchain.pem
Private Key Path: /etc/letsencrypt/live/api.hugo-shopping.com/privkey.pem
Issue Date: November 19, 2025
Expiry Date: February 16, 2026 (90 days)
Auto-Renewal: Enabled (checks daily, renews at 60 days)
```

**Status**: ✅ SSL certificate obtained and deployed successfully

---

## Step 6: Update Django Environment Settings

**Action**: Configure Django for HTTPS security

**Step 6.1**: Edit Django .env file
```bash
sudo nano /var/www/patabima/.env
```

**Step 6.2**: Verify/Update Configuration Lines

**Line 3 - ALLOWED_HOSTS**:
```bash
ALLOWED_HOSTS=44.200.182.180,api.patabima.co.ke,api.hugo-shopping.com
```

**Line 5 - SECURE_PROXY_SSL_HEADER**:
```bash
SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO,https
```

**Line 6 - CSRF_TRUSTED_ORIGINS** (ADD THIS LINE):
```bash
CSRF_TRUSTED_ORIGINS=https://api.patabima.co.ke,https://api.hugo-shopping.com
```

**Line 18 - CORS_ALLOWED_ORIGINS**:
```bash
CORS_ALLOWED_ORIGINS=https://api.patabima.co.ke,https://api.hugo-shopping.com
```

**Important Notes**:
- Use `https://` prefix for CSRF_TRUSTED_ORIGINS and CORS_ALLOWED_ORIGINS
- No spaces after commas
- Include both existing and new domains
- SECURE_PROXY_SSL_HEADER enables Django to detect HTTPS behind Nginx proxy

**Save**: `Ctrl+O`, `Enter`, `Ctrl+X`

**Status**: ✅ Django .env updated with HTTPS settings

---

## Step 7: Restart Services

**Action**: Apply all configuration changes

**Command**:
```bash
sudo systemctl restart patabima nginx
```

**What this restarts**:
- `patabima` - Django application (Gunicorn service)
- `nginx` - Web server

**Expected Output**: (no output = success)

**Verification**:
```bash
# Check both services are running
sudo systemctl status patabima
sudo systemctl status nginx
```

**Expected Status**:
```
● patabima.service - PataBima Django Application
   Active: active (running) since ...

● nginx.service - The nginx HTTP and reverse proxy server
   Active: active (running) since ...
```

**Status**: ✅ Both services restarted successfully

---

## Step 8: Test HTTPS Endpoints

**Action**: Verify SSL and API functionality

**Test 1: Health Endpoint**
```bash
curl https://api.hugo-shopping.com/api/v1/health/
```

**Expected Output**:
```json
{"status": "ok", "service": "pata-bima-api"}
```

**Test 2: Motor Categories Endpoint**
```bash
curl https://api.hugo-shopping.com/api/v1/motor2/categories/
```

**Expected Output**:
```json
{
  "categories": [
    {
      "id": "02a099fd-e88b-4b61-8f64-0e3eb7ee173f",
      "code": "PRIVATE",
      "name": "Private",
      "description": "Personal vehicles for private use",
      "icon": "🚗",
      ...
    },
    ...
  ]
}
```

**Test 3: Browser Verification**
1. Open browser
2. Navigate to: `https://api.hugo-shopping.com/api/v1/health/`
3. Check for:
   - ✅ SSL lock icon in address bar
   - ✅ Certificate valid (issued by Let's Encrypt)
   - ✅ JSON response displays

**Status**: ✅ HTTPS working, API responding correctly

---

## Important Notes

### URL Structure
The API uses `/api/v1/` prefix for all endpoints:

**Correct URLs**:
```
✅ https://api.hugo-shopping.com/api/v1/health/
✅ https://api.hugo-shopping.com/api/v1/motor2/categories/
✅ https://api.hugo-shopping.com/api/v1/motor2/subcategories/
✅ https://api.hugo-shopping.com/api/v1/motor2/pricing/compare-by-subcategory/
```

**Incorrect URLs**:
```
❌ https://api.hugo-shopping.com/api/motor2/categories/ (missing /v1/)
❌ https://api.hugo-shopping.com/motor2/categories/ (missing /api/v1/)
❌ http://api.hugo-shopping.com/api/v1/health/ (HTTP instead of HTTPS)
```

### SSL Certificate Auto-Renewal

Let's Encrypt certificates expire after 90 days but renew automatically:

**Check Auto-Renewal Status**:
```bash
sudo systemctl status certbot-renew.timer
```

**Test Renewal (Dry Run)**:
```bash
sudo certbot renew --dry-run
```

**Manual Renewal** (if needed):
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Multi-Domain Support

The current setup supports multiple domains on the same Django app:

**Configured Domains**:
1. `44.200.182.180` (Direct EC2 IP)
2. `api.patabima.co.ke` (Original domain)
3. `api.hugo-shopping.com` (New domain)

All three point to the same Django application and share the same database, S3 storage, and RDS instance.

---

## Configuration Files Summary

### /etc/nginx/conf.d/patabima.conf
```nginx
server {
    listen 80;
    server_name 44.200.182.180 api.patabima.co.ke api.hugo-shopping.com;
    
    # Certbot adds HTTP to HTTPS redirect here automatically
    
    location / {
        proxy_pass http://unix:/var/www/patabima/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /static/ {
        alias /var/www/patabima/staticfiles/;
    }
    
    location /media/ {
        alias /var/www/patabima/media/;
    }
}

# Certbot adds HTTPS server block (port 443) automatically
```

### /var/www/patabima/.env (Key Lines)
```bash
ALLOWED_HOSTS=44.200.182.180,api.patabima.co.ke,api.hugo-shopping.com
SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO,https
CSRF_TRUSTED_ORIGINS=https://api.patabima.co.ke,https://api.hugo-shopping.com
CORS_ALLOWED_ORIGINS=https://api.patabima.co.ke,https://api.hugo-shopping.com
```

---

## Adapting for Different Domain

To use these steps with a different domain (e.g., `api.newdomain.com`):

### 1. DNS Configuration
Replace in cPanel:
```
OLD: api.hugo-shopping.com → 44.200.182.180
NEW: api.newdomain.com → 44.200.182.180
```

### 2. Nginx Configuration
```bash
sudo nano /etc/nginx/conf.d/patabima.conf
```
Replace:
```nginx
OLD: server_name 44.200.182.180 api.patabima.co.ke api.hugo-shopping.com;
NEW: server_name 44.200.182.180 api.patabima.co.ke api.newdomain.com;
```

### 3. SSL Certificate
```bash
OLD: sudo certbot --nginx -d api.hugo-shopping.com --email admin@hugo-shopping.com ...
NEW: sudo certbot --nginx -d api.newdomain.com --email admin@newdomain.com ...
```

### 4. Django .env
```bash
sudo nano /var/www/patabima/.env
```
Replace:
```bash
OLD: ALLOWED_HOSTS=...,api.hugo-shopping.com
NEW: ALLOWED_HOSTS=...,api.newdomain.com

OLD: CSRF_TRUSTED_ORIGINS=...,https://api.hugo-shopping.com
NEW: CSRF_TRUSTED_ORIGINS=...,https://api.newdomain.com

OLD: CORS_ALLOWED_ORIGINS=...,https://api.hugo-shopping.com
NEW: CORS_ALLOWED_ORIGINS=...,https://api.newdomain.com
```

### 5. Restart Services
```bash
sudo systemctl restart patabima nginx
```

### 6. Test New Domain
```bash
curl https://api.newdomain.com/api/v1/health/
```

---

## Success Criteria Checklist

- [x] DNS A record created and propagated
- [x] nslookup returns correct EC2 IP
- [x] EC2 Instance Connect access established
- [x] Certbot installed on EC2
- [x] Nginx server_name updated
- [x] SSL certificate obtained from Let's Encrypt
- [x] Certificate deployed to Nginx
- [x] HTTP to HTTPS redirect configured
- [x] Auto-renewal enabled
- [x] Django ALLOWED_HOSTS updated
- [x] CSRF_TRUSTED_ORIGINS configured
- [x] CORS_ALLOWED_ORIGINS configured
- [x] Services restarted successfully
- [x] Health endpoint responding via HTTPS
- [x] Motor categories endpoint responding via HTTPS
- [x] SSL certificate visible in browser
- [ ] React Native app configured with HTTPS URL
- [ ] Frontend tested with new domain
- [ ] Motor insurance flow tested end-to-end

---

## Total Setup Time

- DNS propagation: 5-10 minutes
- EC2 access setup: 2 minutes
- Certbot installation: 2 minutes
- Nginx configuration: 3 minutes
- SSL certificate issuance: 2 minutes
- Django configuration: 3 minutes
- Service restart: 1 minute
- Testing: 2 minutes

**Total**: ~20-25 minutes

---

## Cost Analysis

**New Costs**: $0 (zero)
- Let's Encrypt SSL: Free
- Subdomain A record: Free (included with domain)
- EC2/RDS/S3: Already running (no additional cost)

**Existing Costs** (no change):
- Domain registration: ~$10-15/year (hugo-shopping.com)
- EC2 instance: ~$10/month (already running)
- RDS database: ~$20/month (already running)

**Total Additional Cost**: $0/year

---

## Troubleshooting Reference

### Issue: DNS not resolving
```bash
# Wait 5-30 minutes for propagation
# Then flush local DNS cache (Windows):
ipconfig /flushdns

# Try alternative DNS server:
nslookup api.hugo-shopping.com 8.8.8.8
```

### Issue: Certbot challenge failed
```bash
# Check port 80 is accessible:
sudo netstat -tlnp | grep :80

# Verify Nginx is running:
sudo systemctl status nginx

# Check security group allows HTTP (port 80)
```

### Issue: 404 on API endpoints
```bash
# Check URL has /api/v1/ prefix:
curl https://api.hugo-shopping.com/api/v1/health/

# Verify Django is running:
sudo systemctl status patabima

# Check Django logs:
sudo tail -f /var/www/patabima/logs/error.log
```

### Issue: CORS errors in app
```bash
# Verify CORS_ALLOWED_ORIGINS in .env:
sudo cat /var/www/patabima/.env | grep CORS

# Should show: https:// prefix
# Restart Django after changes:
sudo systemctl restart patabima
```

---

## Next Steps

1. **Frontend Integration**: Update React Native app to use `https://api.hugo-shopping.com`
2. **Testing**: Test complete motor insurance flow with HTTPS
3. **Documentation**: Update API docs with new domain
4. **Monitoring**: Set up SSL expiry monitoring (though auto-renewal is enabled)
5. **Backup**: Consider backing up SSL certificates (optional)

---

**Document Status**: ✅ Complete and Verified  
**Last Updated**: November 19, 2025  
**Tested By**: PataBima Development Team  
**Domain**: api.hugo-shopping.com  
**SSL Provider**: Let's Encrypt  
**Certificate Expiry**: February 16, 2026

# Connect Custom Domain with Free SSL to PataBima Backend

## Overview
This guide shows how to connect your domain **`hugo-shopping.com`** to the PataBima Django backend running on EC2, using **free SSL from Let's Encrypt**.

**Scenario:**
- You own the domain: `hugo-shopping.com` (visible in your cPanel)
- You want to use subdomain: `api.hugo-shopping.com` for PataBima backend
- You need free SSL/HTTPS (Let's Encrypt provides this)
- Your Django backend runs on EC2: `44.200.182.180`

**Result:** Your PataBima app will connect to `https://api.hugo-shopping.com`

---

## Prerequisites

✅ **Domain ownership** - You own `hugo-shopping.com` (confirmed in cPanel)
✅ **EC2 instance running** - PataBima backend at `44.200.182.180`
✅ **SSH access** - You can connect to EC2 instance
✅ **Subdomain chosen** - We'll use: `api.hugo-shopping.com`
✅ **cPanel access** - You can login to manage DNS records

---

## Quick Reference Card

### Your Configuration Details:
```
Domain: hugo-shopping.com
Subdomain: api.hugo-shopping.com
EC2 IP: 44.200.182.180
EC2 Instance: i-0d0f116005d812275
Email: admin@hugo-shopping.com
Final URL: https://api.hugo-shopping.com
```

### Quick Commands Checklist:
```bash
# 1. Verify DNS (after cPanel setup)
nslookup api.hugo-shopping.com

# 2. SSH to EC2
ssh -i ~/.ssh/aws-eb ec2-user@44.200.182.180

# 3. Install Certbot
sudo dnf install -y certbot python3-certbot-nginx

# 4. Get SSL Certificate
sudo certbot --nginx -d api.hugo-shopping.com --email admin@hugo-shopping.com --non-interactive --agree-tos --redirect

# 5. Update Django .env
sudo nano /var/www/patabima/.env
# Add: ALLOWED_HOSTS=44.200.182.180,api.hugo-shopping.com
# Add: CSRF_TRUSTED_ORIGINS=https://api.hugo-shopping.com
# Add: CORS_ALLOWED_ORIGINS=https://api.hugo-shopping.com

# 6. Restart Services
sudo systemctl restart patabima nginx

# 7. Test
curl https://api.hugo-shopping.com/api/motor2/categories/
```

---

## Step 1: Point Domain/Subdomain to EC2 Instance

### 1.1 Login to cPanel

**You're already here!** (Based on your screenshot)
- URL: `hugo-shopping.com/cpanel` or through hosting provider
- You should see 3 domains in your account

### 1.2 Navigate to DNS Zone Editor

**cPanel Dashboard → Domains section → Zone Editor**

You'll see your domains listed:
- Domain 1 (redacted)
- hugo-shopping.com ← **We'll use this one**
- Domain 3 (redacted)

### 1.3 Create DNS A Record for Subdomain

**Click "+ A Record" button next to `hugo-shopping.com`** (as shown in your screenshot)

You'll see a form to add a new DNS record:

| Field | Value | What to Enter |
|-------|-------|---------------|
| **Type** | A | A (already selected) |
| **Name** | api | Just type: `api` |
| **TTL** | 300 | 300 (5 minutes) |
| **Address** | 44.200.182.180 | 44.200.182.180 |

**Step-by-step in cPanel for hugo-shopping.com:**

1. Click **"+ A Record"** button next to `hugo-shopping.com`
2. **Type**: Already set to "A" (DNS A Record)
3. **Name**: Enter `api` (creates api.hugo-shopping.com)
4. **TTL**: Enter `300` (5 minutes for faster testing)
5. **Address**: Enter `44.200.182.180` (your EC2 IP)
6. Click **"Add Record"** or **"Save"** button

### 1.4 Subdomain Options for hugo-shopping.com

We'll use `api` but here are alternatives:

| Subdomain | Full URL | Purpose |
|-----------|----------|---------|
| `api` ✅ | `api.hugo-shopping.com` | **Recommended** - Standard API subdomain |
| `backend` | `backend.hugo-shopping.com` | Alternative backend services |
| `patabima` | `patabima.hugo-shopping.com` | Project-specific name |
| `insurance` | `insurance.hugo-shopping.com` | Business-specific name |

**We'll proceed with:** `api.hugo-shopping.com`

### 1.5 Alternative: Other DNS Providers

If your domain DNS is managed elsewhere (not cPanel):

**Namecheap:**
```
Type: A Record
Host: api
Value: 44.200.182.180
TTL: Automatic
```

**GoDaddy:**
```
Type: A
Name: api
Data: 44.200.182.180
TTL: 600 seconds
```

**Cloudflare:**
```
Type: A
Name: api
IPv4 address: 44.200.182.180
Proxy status: DNS only (gray cloud) ← IMPORTANT for SSL setup
TTL: Auto
```

**Result:** `api.hugo-shopping.com` → `44.200.182.180`

### 1.5 Verify DNS Propagation

**Wait 5-15 minutes after creating A record**, then test:

**Option 1: Windows PowerShell (Recommended)**
```powershell
# Test your subdomain
nslookup api.hugo-shopping.com

# Expected output:
Server:  UnKnown
Address:  192.168.1.1

Name:    api.hugo-shopping.com
Address: 44.200.182.180
```

**Option 2: Online DNS Checker Tools**
- **Global check**: https://www.whatsmydns.net/#A/api.hugo-shopping.com
- **Multiple servers**: https://dnschecker.org/
- **Detailed info**: https://mxtoolbox.com/SuperTool.aspx

**Option 3: cPanel DNS Zone Editor**
- Go back to Zone Editor
- You should see your new A record listed:
  ```
  api.hugo-shopping.com → 44.200.182.180 (Type: A)
  ```

**Troubleshooting DNS in cPanel:**

If not showing after 15 minutes:
1. Check the A record exists in Zone Editor
2. Verify you used correct subdomain name (just `api`, not `api.hugo-shopping.com`)
3. Try flushing local DNS cache:
   ```powershell
   ipconfig /flushdns
   ```
4. Try different DNS server:
   ```powershell
   nslookup api.hugo-shopping.com 8.8.8.8
   ```

---

## Step 2: Update EC2 Nginx Configuration

### 2.1 SSH into EC2 Instance

```bash
# From CloudShell or local terminal
ssh -i ~/.ssh/aws-eb ec2-user@44.200.182.180
```

### 2.2 Edit Nginx Configuration

```bash
# Open Nginx config file
sudo nano /etc/nginx/conf.d/patabima.conf
```

**Update `server_name` line:**

```nginx
server {
    listen 80;
    server_name 44.200.182.180 api.hugo-shopping.com;  # Your subdomain
    
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
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

### 2.3 Test and Reload Nginx

```bash
# Test configuration
sudo nginx -t

# Expected: syntax is ok, test is successful

# Reload Nginx
sudo systemctl reload nginx
```

### 2.4 Test HTTP Access

```bash
# From your local machine
curl -I http://api.hugo-shopping.com/api/motor2/categories/

# Should return: HTTP/1.1 200 OK
```

---

## Step 3: Install Let's Encrypt SSL (Free HTTPS)

### 3.1 Install Certbot

```bash
# Still SSH'd into EC2
sudo dnf install -y certbot python3-certbot-nginx
```

### 3.2 Obtain SSL Certificate

```bash
# Request SSL certificate for your subdomain
sudo certbot --nginx -d api.hugo-shopping.com \
  --non-interactive \
  --agree-tos \
  --email admin@hugo-shopping.com \
  --redirect
```

**What this does:**
- ✅ Validates domain ownership (via HTTP challenge)
- ✅ Issues free SSL certificate (valid 90 days)
- ✅ Automatically updates Nginx config for HTTPS
- ✅ Sets up auto-redirect from HTTP → HTTPS
- ✅ Configures auto-renewal

**Expected output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/api.hugo-shopping.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/api.hugo-shopping.com/privkey.pem
This certificate expires on 2026-02-16.
```

### 3.3 Verify SSL Certificate

```bash
# Test HTTPS access
curl -I https://api.hugo-shopping.com/api/motor2/categories/

# Should return: HTTP/2 200 (note HTTP/2, not HTTP/1.1)
```

---

## Step 4: Update Django Settings for HTTPS

### 4.1 Edit Django Environment File

```bash
# Still on EC2
sudo nano /var/www/patabima/.env
```

### 4.2 Update Configuration

**Find and update these lines:**

```bash
# Allowed hosts (add your subdomain)
ALLOWED_HOSTS=44.200.182.180,api.hugo-shopping.com

# CSRF trusted origins (add HTTPS subdomain)
CSRF_TRUSTED_ORIGINS=https://api.hugo-shopping.com

# CORS allowed origins (add HTTPS subdomain)
CORS_ALLOWED_ORIGINS=https://api.hugo-shopping.com

# Secure proxy SSL header (for HTTPS behind Nginx)
SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO,https

# Force HTTPS redirects (optional, for production)
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

### 4.3 Restart Django Application

```bash
# Restart Gunicorn service
sudo systemctl restart patabima

# Check status
sudo systemctl status patabima

# Should show: active (running)
```

### 4.4 Verify Django Recognizes HTTPS

```bash
# Test API endpoint
curl -H "Accept: application/json" https://api.hugo-shopping.com/api/motor2/categories/

# Should return JSON data with categories
```

---

## Step 5: Update React Native App Configuration

### 5.1 Update API Config File

**Edit:** `frontend/config/api.js` or `frontend/services/apiConfig.js`

```javascript
// frontend/config/api.js
const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'https://api.hugo-shopping.com'      // Use your HTTPS subdomain
    : 'https://api.hugo-shopping.com',     // Same for production
    
  ENDPOINTS: {
    MOTOR_CATEGORIES: '/api/motor2/categories/',
    MOTOR_SUBCATEGORIES: '/api/motor2/subcategories/',
    PRICING_COMPARE: '/api/motor2/pricing/compare-by-subcategory/',
    QUOTATIONS: '/api/motor2/quotations/',
    POLICIES: '/api/motor2/policies/',
    // ... other endpoints
  },
  
  TIMEOUT: 30000,
};

export default API_CONFIG;
```

### 5.2 Update DjangoAPIService (if using)

```javascript
// frontend/services/DjangoAPIService.js
class DjangoAPIService {
  constructor() {
    this.baseUrl = 'https://api.hugo-shopping.com';  // Your HTTPS subdomain
    this.token = null;
    // ... rest of implementation
  }
  
  // ... methods
}
```

### 5.3 Update Backend Switcher (if using)

```javascript
// frontend/screens/Settings/BackendSwitcherScreen.js
const PREDEFINED_BACKENDS = [
  {
    id: 'production',
    name: 'Production (AWS)',
    url: 'https://api.hugo-shopping.com',
    description: 'Live production server with SSL'
  },
  {
    id: 'ec2-ip',
    name: 'EC2 Direct IP',
    url: 'http://44.200.182.180',
    description: 'Direct EC2 access (HTTP only)'
  },
  // ... other options
];
```

---

## Step 6: Test Full Application Flow

### 6.1 Test from React Native Development

```bash
# Start Expo dev server
npm start

# Test API connection
# Open app → Settings → Backend Switcher
# Select "Production (AWS)" → Test Ping
# Should show: ✅ Connected to https://api.hugo-shopping.com
```

### 6.2 Build and Test APK

```bash
# Build production APK
eas build --platform android --profile production

# Download APK to phone
# Install and test:
# - Login flow
# - Motor insurance categories
# - Pricing comparisons
# - Quotation creation
```

### 6.3 Verify Motor Insurance Flow

**Test complete flow:**
1. Open Motor Insurance → Categories load
2. Select Private → Subcategories load
3. Select Third Party → Underwriters load
4. Fill vehicle details → Pricing calculates
5. Select underwriter → Premium displays
6. Complete KYC → Documents upload to S3
7. Submit quote → Policy created in RDS

**All should work over HTTPS with your domain!**

---

## Step 7: SSL Certificate Auto-Renewal

### 7.1 Verify Certbot Timer

```bash
# Check if auto-renewal is enabled
sudo systemctl status certbot-renew.timer

# Should show: active (running)
```

### 7.2 Test Renewal Process

```bash
# Dry run (test without actually renewing)
sudo certbot renew --dry-run

# Expected: Congratulations, all simulated renewals succeeded
```

### 7.3 Manual Renewal (if needed)

```bash
# Force renewal (only if certificate expires soon)
sudo certbot renew --force-renewal

# Restart Nginx after renewal
sudo systemctl restart nginx
```

**Note:** Let's Encrypt certificates auto-renew every 60 days (expire after 90 days).

---

## Common Issues and Solutions

### Issue 1: DNS Not Propagating

**Symptom:** `nslookup` doesn't resolve domain

**Solution:**
```bash
# Wait 5-30 minutes for DNS propagation
# Check propagation: https://www.whatsmydns.net/

# If using Cloudflare, disable proxy (gray cloud)
# If using DNSSEC, wait for longer propagation
```

### Issue 2: Certbot Challenge Failed

**Symptom:** `Failed authorization procedure`

**Solution:**
```bash
# Ensure port 80 is open in security group
aws ec2 describe-security-groups --group-ids sg-029645a9f7a7907c3

# Ensure Nginx is serving HTTP on port 80
sudo netstat -tlnp | grep :80

# Try certbot with verbose logging
sudo certbot --nginx -d api.hugo-shopping.com -v
```

### Issue 3: CORS Errors in App

**Symptom:** `Blocked by CORS policy`

**Solution:**
```bash
# Update Django settings with correct CORS origins
sudo nano /var/www/patabima/.env

# Add:
CORS_ALLOWED_ORIGINS=https://api.hugo-shopping.com
CORS_ALLOW_CREDENTIALS=True

# Restart Django
sudo systemctl restart patabima
```

### Issue 4: Mixed Content Warnings

**Symptom:** App loads but some resources fail

**Solution:**
```javascript
// Ensure ALL API calls use HTTPS
// Check for hardcoded HTTP URLs in:
// - API_CONFIG
// - Image URLs
// - External API calls (DMVIC, M-PESA)

// Update to HTTPS:
const imageUrl = `https://api.hugo-shopping.com/media/${filename}`;
```

### Issue 5: SSL Certificate Expired

**Symptom:** Browser shows "Your connection is not private"

**Solution:**
```bash
# SSH into EC2
ssh -i ~/.ssh/aws-eb ec2-user@44.200.182.180

# Renew certificate
sudo certbot renew

# Restart Nginx
sudo systemctl restart nginx
```

---

## Verification Checklist

Before considering setup complete, verify:

- [ ] DNS A record points to EC2 IP
- [ ] `nslookup api.yourdomain.com` resolves to `44.200.182.180`
- [ ] HTTP works: `curl http://api.yourdomain.com/api/motor2/categories/`
- [ ] HTTPS works: `curl https://api.yourdomain.com/api/motor2/categories/`
- [ ] SSL certificate valid (check in browser)
- [ ] HTTP auto-redirects to HTTPS
- [ ] Django ALLOWED_HOSTS includes domain
- [ ] CORS_ALLOWED_ORIGINS includes `https://api.yourdomain.com`
- [ ] React Native app connects successfully
- [ ] Motor insurance flow works end-to-end
- [ ] File uploads work (S3 integration)
- [ ] Certbot auto-renewal enabled

---

## Example: Complete Setup with Subdomain in cPanel

### Scenario: Using your `hugo-shopping.com` domain for PataBima

### Step 1: DNS Configuration in cPanel
```
cPanel → Zone Editor → Add Record:

Type: A
Name: api
TTL: 300
Address: 44.200.182.180

Result: api.hugo-shopping.com → 44.200.182.180
```

### Step 2: Verify DNS
```powershell
nslookup api.hugo-shopping.com
# Should return: 44.200.182.180
```

### Nginx Configuration
### Step 3: Nginx Configuration on EC2
```bash
# SSH into EC2
ssh -i ~/.ssh/aws-eb ec2-user@44.200.182.180

# Edit Nginx config
sudo nano /etc/nginx/conf.d/patabima.conf

# Add subdomain to server_name:
server_name 44.200.182.180 api.hugo-shopping.com;
```

### Step 4: SSL Certificate on EC2
```bash
# Still on EC2
sudo dnf install -y certbot python3-certbot-nginx

sudo certbot --nginx -d api.hugo-shopping.com \
  --email admin@hugo-shopping.com --non-interactive --agree-tos --redirect
```

### Step 5: Django Settings (.env) on EC2
```bash
sudo nano /var/www/patabima/.env

# Update these lines:
ALLOWED_HOSTS=44.200.182.180,api.hugo-shopping.com
CSRF_TRUSTED_ORIGINS=https://api.hugo-shopping.com
CORS_ALLOWED_ORIGINS=https://api.hugo-shopping.com
SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO,https

# Restart Django
sudo systemctl restart patabima
```

### Step 6: React Native Config
```javascript
// frontend/config/api.js
const API_CONFIG = {
  BASE_URL: 'https://api.hugo-shopping.com',
};
```

### Step 7: Test
```powershell
# From Windows PowerShell
curl https://api.hugo-shopping.com/api/motor2/categories/

# Should return:
# {"categories": [{"code": "PRIVATE", "name": "Private", ...}, ...]}
```

```javascript
// From React Native app
// Backend Switcher → Custom URL → https://api.hugo-shopping.com
// Test Ping → Result: ✅ Connected (150ms)
```

### Summary
- ✅ cPanel DNS: `api.hugo-shopping.com` → `44.200.182.180`
- ✅ EC2 Nginx: Serves requests for `api.hugo-shopping.com`
- ✅ EC2 SSL: Let's Encrypt certificate for `api.hugo-shopping.com`
- ✅ Django: Accepts requests from `api.hugo-shopping.com`
- ✅ React Native: Connects to `https://api.hugo-shopping.com`

## cPanel-Specific Tips

### Managing Subdomains in cPanel

**cPanel has TWO ways to create subdomains:**

#### Method 1: Subdomains Tool (Creates Directory)
- **Location**: cPanel → Domains → Subdomains
- **What it does**: Creates subdomain + folder in your hosting account
- **When to use**: If you want to host content on cPanel server
- **For PataBima**: ❌ Don't use this - we're pointing to EC2, not cPanel

#### Method 2: Zone Editor (DNS Only) ✅
- **Location**: cPanel → Domains → Zone Editor
- **What it does**: Just creates DNS record (A, CNAME, etc.)
- **When to use**: Pointing subdomain to external server (like EC2)
- **For PataBima**: ✅ Use this method - create A record only

### Important: Don't Create Subdomain Folder

**Don't do this:**
```
cPanel → Subdomains → Create → "api"
❌ This creates api.yourdomain.com pointing to cPanel, not EC2
```

**Do this instead:**
```
cPanel → Zone Editor → Add Record → Type: A
✅ This creates DNS record pointing to EC2 IP
```

### Subdomain Options for PataBima

**If using `hugo-shopping.com`, your subdomain options are:**

| Subdomain | Full URL | cPanel A Record |
|-----------|----------|------------------|
| `api` | `api.hugo-shopping.com` | Name: `api`, Address: `44.200.182.180` |
| `backend` | `backend.hugo-shopping.com` | Name: `backend`, Address: `44.200.182.180` |
| `patabima` | `patabima.hugo-shopping.com` | Name: `patabima`, Address: `44.200.182.180` |
| `pata` | `pata.hugo-shopping.com` | Name: `pata`, Address: `44.200.182.180` |
| `insurance` | `insurance.hugo-shopping.com` | Name: `insurance`, Address: `44.200.182.180` |

**Choose any subdomain you like!** They all work the same way.

### cPanel DNS Record Example

After creating the A record in Zone Editor, you'll see:

```
Zone File for yourdomain.com:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name                          Type    Record
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
yourdomain.com.               A       123.45.67.89  (your cPanel server)
www.yourdomain.com.           CNAME   yourdomain.com.
api.yourdomain.com.           A       44.200.182.180  ← Your new record
mail.yourdomain.com.          A       123.45.67.89
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### SSL Certificate Note for cPanel Users

**Important:** Let's Encrypt SSL will be installed on your **EC2 instance**, NOT in cPanel.

- **cPanel SSL**: Protects `yourdomain.com` (main domain on cPanel)
- **EC2 SSL**: Protects `api.yourdomain.com` (subdomain pointing to EC2)

They are separate and don't interfere with each other.
| RDS database | ~$20/month | db.t3.micro (already running) |
| Data transfer | ~$5/month | Normal usage |
| **Total new cost** | **$10-15/year** | Just the domain! |

---

## Alternative: Use Subdomain of Existing Domain

If you already own `patabima.co.ke` or any other domain, you can use a subdomain:

### Option 1: API Subdomain
```
api.patabima.co.ke → 44.200.182.180
```

### Option 2: Backend Subdomain
```
backend.patabima.co.ke → 44.200.182.180
```

### Option 3: Version Subdomain
```
v1.patabima.co.ke → 44.200.182.180
```

**All use same setup process!** Just replace `api.yourdomain.com` with your chosen subdomain.

---

## Next Steps After Setup

1. **Monitor SSL Expiry**
   - Set calendar reminder for 80 days
   - Check: https://www.ssllabs.com/ssltest/analyze.html?d=api.yourdomain.com

2. **Set Up Monitoring**
   - CloudWatch alarms for EC2 CPU/memory
   - UptimeRobot for uptime monitoring
   - Sentry for error tracking

3. **Backup SSL Certificates**
   ```bash
   # Backup Let's Encrypt certs
   sudo tar -czf letsencrypt-backup.tar.gz /etc/letsencrypt/
   aws s3 cp letsencrypt-backup.tar.gz s3://patabima-media-prod/backups/
   ```

4. **Update Documentation**
   - Update team wiki with new domain
   - Update API documentation
   - Update mobile app store listings

---

## Summary

You've successfully connected a custom domain with free SSL to your PataBima backend! 🎉

**What you achieved:**
- ✅ Custom domain (`api.yourdomain.com`)
- ✅ Free SSL certificate from Let's Encrypt
- ✅ Auto-renewal every 60 days
- ✅ HTTPS-secured API endpoints
- ✅ App Store compliance
- ✅ Professional appearance

**Your app now uses:**
- Production URL: `https://api.yourdomain.com`
- Motor Insurance API: `https://api.yourdomain.com/api/motor2/categories/`
- Secure data transmission (HTTPS)
- Valid SSL certificate (trusted by all devices)

**Total cost: Just your domain registration fee (~$10-15/year)**

---

## Quick Reference Commands

```bash
# Check DNS
nslookup api.yourdomain.com

# SSH to EC2
ssh -i ~/.ssh/aws-eb ec2-user@44.200.182.180

# Install Certbot
sudo dnf install -y certbot python3-certbot-nginx

# Get SSL
sudo certbot --nginx -d api.yourdomain.com --email your@email.com --non-interactive --agree-tos --redirect

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Restart Django
sudo systemctl restart patabima

# Check status
sudo systemctl status patabima nginx

# Test API
curl https://api.yourdomain.com/api/motor2/categories/

# Renew SSL (manual)
sudo certbot renew
```

---

**Questions or issues?** Check the Common Issues section above or review Nginx/Django logs:

```bash
# Nginx logs
sudo tail -f /var/log/nginx/error.log

# Django logs
sudo tail -f /var/www/patabima/logs/error.log

# Certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

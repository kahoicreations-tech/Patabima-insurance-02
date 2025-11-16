# PataBima EC2 Deployment Status

**Date:** November 15, 2025  
**Instance:** i-0d0f116005d812275  
**Public IP:** 44.200.182.180  
**Region:** us-east-1

---

## Current Status: ⚠️ HTTPS Redirect Blocking HTTP Access

### ✅ Working Components

1. **EC2 Instance**

   - State: Running
   - Type: t3.small (can upgrade to t3.medium if needed)
   - Security Group: sg-029645a9f7a7907c3 (SSH, HTTP, HTTPS open)
   - Key Pair: aws-eb

2. **Gunicorn Service**

   - Status: Active (running)
   - Workers: 3 workers, 2 threads each
   - Socket: unix:/var/www/patabima/gunicorn.sock
   - Memory: ~180MB
   - No errors in recent logs

3. **Nginx**

   - Status: Active (running)
   - Config: /etc/nginx/conf.d/patabima.conf
   - Proxy to Gunicorn socket working
   - Serving on port 80

4. **Django Application**

   - Version: 4.2.16
   - Python: 3.11.14
   - Virtual env: /var/www/patabima/venv
   - System check: Passes (0 issues)

5. **Environment Configuration**

   - ALLOWED_HOSTS: Updated with 44.200.182.180
   - RDS credentials: Configured
   - S3 bucket: patabima-media-prod
   - DMVIC integration: Configured

6. **RDS PostgreSQL**
   - Endpoint: patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com
   - Status: Available
   - Version: 15.8
   - Instance: db.t3.micro

---

## ⚠️ Current Issue: HTTPS Redirect

**Problem:** All HTTP requests are being redirected to HTTPS (301 Moved Permanently)

**Impact:**

- API endpoints return 301 instead of data
- Cannot test deployment over HTTP
- Need SSL certificate before app is usable

**Root Cause:** Django's `SecurityMiddleware` or Nginx config forcing HTTPS redirect

**Solutions (choose one):**

### Option A: Disable HTTPS Redirect (Quick Test)

Run on EC2:

```bash
# Add to .env
echo "SECURE_SSL_REDIRECT=False" | sudo tee -a /var/www/patabima/.env
sudo systemctl restart patabima

# Test
curl -I http://44.200.182.180/
```

### Option B: Install SSL Certificate (Recommended)

**Prerequisites:**

1. Point DNS: `api.patabima.co.ke` → `44.200.182.180` (A record)
2. Wait for DNS propagation (5-60 minutes)

**Install Let's Encrypt:**

```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.patabima.co.ke
```

---

## 📋 Remaining Tasks

### Immediate (before production)

- [ ] Fix HTTPS redirect issue (choose Option A or B above)
- [ ] Run database migrations: `python manage.py migrate`
- [ ] Collect static files: `python manage.py collectstatic --noinput`
- [ ] Create Django superuser
- [ ] Test all API endpoints
- [ ] Verify RDS connectivity from EC2

### DNS & SSL

- [ ] Point `api.patabima.co.ke` to `44.200.182.180`
- [ ] Install Let's Encrypt SSL certificate
- [ ] Re-enable HTTPS redirect
- [ ] Test HTTPS endpoints

### Security & Monitoring

- [ ] Configure CloudWatch agent
- [ ] Set up automated backups
- [ ] Enable RDS automatic backups
- [ ] Configure log rotation
- [ ] Review security group rules
- [ ] Enable AWS WAF (optional)

### Performance

- [ ] Upgrade to t3.medium if needed
- [ ] Install Redis for caching
- [ ] Configure database connection pooling
- [ ] Enable Nginx caching
- [ ] Set up CDN for static files

---

## 🔧 Quick Commands Reference

### Check Service Status

```bash
sudo systemctl status patabima
sudo systemctl status nginx
sudo journalctl -u patabima -n 100
```

### Restart Services

```bash
sudo systemctl restart patabima
sudo systemctl restart nginx
```

### View Logs

```bash
# Application logs
tail -f /var/www/patabima/logs/error.log

# Nginx logs
sudo tail -f /var/log/nginx/patabima_error.log

# Gunicorn logs
sudo journalctl -u patabima -f
```

### Django Management

```bash
cd /var/www/patabima
source venv/bin/activate
export $(grep -v '^#' .env | xargs)

python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
python manage.py check
```

### Test Endpoints

```bash
# From EC2
curl -I http://44.200.182.180/
curl http://44.200.182.180/api/motor2/categories/

# From PowerShell
Invoke-WebRequest -Uri "http://44.200.182.180/api/motor2/categories/" -UseBasicParsing
```

---

## 📊 Deployment Architecture

```
Internet
   ↓
AWS Route 53 (Future: api.patabima.co.ke)
   ↓
EC2: 44.200.182.180
   ├─ Nginx :80 (redirecting to :443)
   ├─ Gunicorn (Unix socket)
   └─ Django App (Python 3.11)
       ├─ RDS PostgreSQL (patabima-production-db)
       └─ S3 Bucket (patabima-media-prod)
```

---

## 🚀 Next Action

**Choose your path:**

1. **Quick Test Path** (disable HTTPS temporarily):

   - Run Option A commands on EC2
   - Test API endpoints work
   - Re-enable HTTPS after DNS/SSL setup

2. **Production Path** (setup SSL now):
   - Update DNS: `api.patabima.co.ke` → `44.200.182.180`
   - Wait for propagation
   - Run certbot
   - Keep HTTPS redirect enabled

**Recommended:** Option 1 first to verify everything works, then Option 2 for production.

---

## 📝 Notes

- Current IP may change if instance restarts (consider Elastic IP)
- SECURE_SSL_REDIRECT in .env might be overridden by settings.py
- Check `insurance/settings.py` for SECURE_SSL_REDIRECT setting
- Nginx config at `/etc/nginx/conf.d/patabima.conf` looks clean (no redirect rules)

---

**Last Updated:** November 15, 2025 07:30 UTC

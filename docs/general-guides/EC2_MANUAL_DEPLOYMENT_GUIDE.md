# EC2 Manual Redeployment Guide

## Prerequisites
- SSH access to EC2 instance
- EC2 instance running Ubuntu
- PostgreSQL database configured
- SSH key file (`.pem` or `.ppk`)

## Option 1: Automated Deployment (Recommended)

### For Windows (PowerShell):
```powershell
cd "C:\Users\USER\Desktop\PATABIMA\PATABIMA FRONT\PATA BIMA AGENCY - Copy"

# Update the SSH key path in the script first
# Edit: scripts/redeploy-to-ec2.ps1
# Line 10: $EC2_KEY_PATH = "path\to\your\key.pem"

# Run deployment
.\scripts\redeploy-to-ec2.ps1
```

### For Linux/Mac (Bash):
```bash
cd /path/to/PATA\ BIMA\ AGENCY\ -\ Copy

# Update the SSH key path in the script first
# Edit: scripts/redeploy-to-ec2.sh
# Line 13: EC2_KEY_PATH="path/to/your/key.pem"

# Make script executable
chmod +x scripts/redeploy-to-ec2.sh

# Run deployment
./scripts/redeploy-to-ec2.sh
```

---

## Option 2: Manual Deployment Steps

### Step 1: Connect to EC2
```bash
ssh -i /path/to/your-key.pem ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com
```

### Step 2: Backup Current Deployment
```bash
cd /home/ubuntu
BACKUP_DIR="insurance-app-backup-$(date +%Y%m%d-%H%M%S)"
cp -r insurance-app "$BACKUP_DIR"
echo "Backup created at: $BACKUP_DIR"
```

### Step 3: Upload New Code
**From your local machine (new terminal):**

Using SCP:
```bash
scp -i /path/to/your-key.pem -r ./insurance-app/* ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com:/home/ubuntu/insurance-app/
```

Or using rsync (better for large projects):
```bash
rsync -avz --progress \
  --exclude='*.pyc' \
  --exclude='__pycache__' \
  --exclude='.git' \
  --exclude='venv' \
  --exclude='.env' \
  --exclude='*.sqlite3' \
  -e "ssh -i /path/to/your-key.pem" \
  ./insurance-app/ \
  ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com:/home/ubuntu/insurance-app/
```

### Step 4: Install Dependencies
**Back on EC2 SSH:**
```bash
cd /home/ubuntu/insurance-app

# Create or activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt
```

### Step 5: Configure Environment
```bash
# Create .env file if it doesn't exist
nano /home/ubuntu/insurance-app/.env
```

Add these variables:
```env
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=ec2-34-203-241-81.compute-1.amazonaws.com,localhost

# Database (PostgreSQL)
DB_NAME=patabima_db
DB_USER=patabima_user
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432

# AWS (if using)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_STORAGE_BUCKET_NAME=patabima-media
AWS_S3_REGION_NAME=us-east-1
```

### Step 6: Run Migrations
```bash
cd /home/ubuntu/insurance-app
source venv/bin/activate

python manage.py migrate --noinput
```

### Step 7: Collect Static Files
```bash
python manage.py collectstatic --noinput
```

### Step 8: Seed Database
```bash
# Seed motor categories (60+ products)
python manage.py seed_motor_categories

# Seed pricing data
python manage.py seed_motor_pricing

# Seed underwriters
python manage.py seed_underwriters

# Create superuser if needed
python manage.py createsuperuser
```

### Step 9: Restart Django Service

**If using Gunicorn with systemd:**
```bash
sudo systemctl restart gunicorn
sudo systemctl status gunicorn
```

**If using PM2:**
```bash
pm2 restart django
pm2 status
```

**If using Django dev server:**
```bash
# Stop existing server
pkill -f "manage.py runserver"

# Start new server in background
cd /home/ubuntu/insurance-app
source venv/bin/activate
nohup python manage.py runserver 0.0.0.0:8000 > /home/ubuntu/django.log 2>&1 &

# Check if running
ps aux | grep runserver
```

### Step 10: Verify Deployment
**Test endpoints:**
```bash
# Health check
curl http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/api/v1/health/

# Motor2 categories
curl http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/api/v1/motor2/categories/

# Underwriters
curl http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/api/v1/public_app/insurance/get_underwriters/
```

---

## Option 3: Using WinSCP/PuTTY (Windows GUI)

### Step 1: Upload Files with WinSCP
1. Open WinSCP
2. New Site:
   - File protocol: SFTP
   - Host name: `ec2-34-203-241-81.compute-1.amazonaws.com`
   - Port: 22
   - User name: `ubuntu`
   - Private key: Browse to your `.ppk` file
3. Click "Login"
4. Navigate to `/home/ubuntu/`
5. Drag and drop the `insurance-app` folder from local to remote

### Step 2: Run Commands with PuTTY
1. Open PuTTY
2. Host Name: `ec2-34-203-241-81.compute-1.amazonaws.com`
3. Connection > SSH > Auth: Browse to your `.ppk` file
4. Click "Open"
5. Login as: `ubuntu`
6. Run the commands from Manual Deployment Step 4-10

---

## Troubleshooting

### Issue: Permission Denied
```bash
# Fix ownership
sudo chown -R ubuntu:ubuntu /home/ubuntu/insurance-app

# Fix permissions
chmod +x /home/ubuntu/insurance-app/manage.py
```

### Issue: Port 8000 Already in Use
```bash
# Find process using port 8000
sudo lsof -i :8000

# Kill the process
sudo kill -9 <PID>
```

### Issue: Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check database exists
sudo -u postgres psql -l
```

### Issue: Static Files Not Loading
```bash
# Check STATIC_ROOT in settings
cd /home/ubuntu/insurance-app
source venv/bin/activate
python manage.py diffsettings | grep STATIC

# Recollect static files
python manage.py collectstatic --noinput --clear
```

### Issue: Module Not Found
```bash
# Reinstall requirements
cd /home/ubuntu/insurance-app
source venv/bin/activate
pip install -r requirements.txt --force-reinstall
```

---

## Monitoring & Logs

### View Django Logs
```bash
# If using nohup
tail -f /home/ubuntu/django.log

# If using systemd
sudo journalctl -u gunicorn -f

# If using PM2
pm2 logs django
```

### View Nginx Logs (if configured)
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### View PostgreSQL Logs
```bash
sudo tail -f /var/log/postgresql/postgresql-*.log
```

---

## Post-Deployment Checklist

- [ ] Health endpoint responds: `http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/api/v1/health/`
- [ ] Motor2 categories returns data: `http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/api/v1/motor2/categories/`
- [ ] Underwriters endpoint works: `http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/api/v1/public_app/insurance/get_underwriters/`
- [ ] Can login from mobile app
- [ ] Database has motor categories seeded
- [ ] Database has at least one user account
- [ ] Static files are served correctly
- [ ] Media files upload successfully
- [ ] PostgreSQL database is connected
- [ ] SSL certificate configured (if production)
- [ ] Firewall rules allow port 8000 (or 80/443)
- [ ] Backup schedule configured
- [ ] Monitoring/alerting configured

---

## Quick Reference

**EC2 Details:**
- Host: `ec2-34-203-241-81.compute-1.amazonaws.com`
- User: `ubuntu`
- App Path: `/home/ubuntu/insurance-app`
- Port: `8000`

**Important Files:**
- Settings: `/home/ubuntu/insurance-app/insurance/settings.py`
- URLs: `/home/ubuntu/insurance-app/insurance/urls.py`
- Motor URLs: `/home/ubuntu/insurance-app/app/urls_motor.py`
- Logs: `/home/ubuntu/django.log`

**Key Endpoints:**
- Health: `/api/v1/health/`
- Motor2 Categories: `/api/v1/motor2/categories/`
- Motor2 Subcategories: `/api/v1/motor2/subcategories/`
- Underwriters: `/api/v1/public_app/insurance/get_underwriters/`
- Login: `/api/v1/public_app/auth/login`
- Signup: `/api/v1/public_app/auth/signup`

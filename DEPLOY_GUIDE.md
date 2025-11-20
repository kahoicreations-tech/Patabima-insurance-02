# PataBima Deployment Guide

## 🚀 Quick Deploy

### Option 1: PowerShell Script (Recommended for Local)

```powershell
# Deploy with default commit message
.\deploy.ps1

# Deploy with custom commit message
.\deploy.ps1 "Add new motor insurance feature"
```

This will:

1. ✅ Stage all changes
2. 💾 Commit to git
3. 🔄 Push to GitHub
4. 🎯 Trigger GitHub Actions deployment

---

## 🔧 Setup Required (One-Time)

### 1. GitHub Secrets Configuration

Go to: `https://github.com/kahoicreations-tech/Patabima-insurance-02/settings/secrets/actions`

Add these secrets:

| Secret Name             | Value                 | How to Get       |
| ----------------------- | --------------------- | ---------------- |
| `AWS_ACCESS_KEY_ID`     | Your AWS access key   | AWS IAM Console  |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key   | AWS IAM Console  |
| `EC2_INSTANCE_ID`       | `i-07a424fd876416ad0` | From EC2 console |

### 2. EC2 Initial Setup

**Run once on your EC2 instance:**

```bash
# SSH into EC2
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82

# Clone repository (first time only)
sudo mkdir -p /var/www/patabima
sudo chown ec2-user:ec2-user /var/www/patabima
cd /var/www/patabima
git clone https://github.com/kahoicreations-tech/Patabima-insurance-02.git .

# Run initial setup
sudo bash deployment/ec2_setup.sh
sudo bash deployment/deploy_to_ec2.sh
```

### 3. Make Deploy Script Executable on EC2

```bash
# On EC2 instance
sudo chmod +x /var/www/patabima/scripts/deploy_ec2.sh
```

---

## 🔄 Deployment Workflows

### Automatic Deployment (GitHub Actions)

Every push to `main` branch automatically:

1. Runs tests
2. Deploys to EC2 via AWS SSM
3. Restarts services
4. Verifies deployment

**Check deployment status:**
https://github.com/kahoicreations-tech/Patabima-insurance-02/actions

### Manual Deployment on EC2

If you need to deploy manually on the server:

```bash
# SSH into EC2
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82

# Run deployment script
sudo /var/www/patabima/scripts/deploy_ec2.sh
```

---

## 📊 Verify Deployment

### Check Application Status

```bash
# On EC2 instance
sudo systemctl status patabima
sudo systemctl status nginx

# View logs
sudo journalctl -u patabima -n 50
sudo tail -f /var/www/patabima/logs/error.log
```

### Test API Endpoints

```bash
# From anywhere
curl http://44.210.245.82/api/health/
curl http://44.210.245.82/api/motor2/categories/
```

---

## 🛠️ Troubleshooting

### GitHub Actions fails with SSM error

**Problem:** Instance not registered with SSM

**Solution:**

```bash
# On EC2, check SSM agent status
sudo systemctl status amazon-ssm-agent

# If not running, start it
sudo systemctl start amazon-ssm-agent
sudo systemctl enable amazon-ssm-agent
```

### Services not restarting

**Problem:** Gunicorn or Nginx fails to restart

**Solution:**

```bash
# Check what's wrong
sudo systemctl status patabima
sudo journalctl -u patabima -n 100

# Manual restart
sudo systemctl restart patabima
sudo systemctl restart nginx
```

### Database connection errors

**Problem:** Django can't connect to RDS

**Solution:**

```bash
# Verify environment variables
sudo cat /etc/systemd/system/patabima.service | grep Environment

# Test database connection
cd /var/www/patabima/insurance-app
source ../venv/bin/activate
python manage.py dbshell
```

---

## 📝 Environment Variables

These are set in `/etc/systemd/system/patabima.service`:

- `SECRET_KEY` - Django secret key
- `DEBUG` - Set to `False` in production
- `ALLOWED_HOSTS` - EC2 IP and domain
- `RDS_HOSTNAME` - PostgreSQL endpoint
- `RDS_PORT` - `5432`
- `RDS_DB_NAME` - `patabimadb`
- `RDS_USERNAME` - `patabimaadmin`
- `RDS_PASSWORD` - Database password

---

## 🔐 Security Checklist

- [x] SSH key-based authentication only
- [x] Security groups restrict access
- [x] Environment variables not in code
- [ ] SSL certificate (Let's Encrypt) - TODO
- [ ] Domain name configured - TODO
- [ ] CloudWatch monitoring - TODO
- [ ] Automated backups - TODO

---

## 📞 Quick Reference

**EC2 Instance:** `i-07a424fd876416ad0`  
**Public IP:** `44.210.245.82`  
**Database:** `patabima-production-db.ca5qwoi4lxw.us-east-1.rds.amazonaws.com`  
**S3 Bucket:** `patabima-media-prod`

**SSH Access:**

```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.210.245.82
```

**Application URL:**

```
http://44.210.245.82
```

**GitHub Actions:**

```
https://github.com/kahoicreations-tech/Patabima-insurance-02/actions
```

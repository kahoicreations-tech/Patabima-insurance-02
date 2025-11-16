# EC2 Deployment Rollback Options

You have **3 options** to undo the EC2 deployment, depending on how much you want to reset:

---

## ✅ Option 1: Clean Rollback (Recommended)

**What it does:**
- Stops Gunicorn and Nginx services
- Removes application files from `/var/www/patabima`
- Removes systemd service configurations
- Cleans up logs
- **Keeps:** EC2 instance running, Python/Nginx installed

**When to use:**
- You want to redeploy from scratch
- You want to test a different deployment approach
- You want to clean up but keep the server

**How to run:**
```powershell
.\deployment\rollback-ec2.ps1
```

**Result:** Clean EC2 instance ready for fresh deployment. You can redeploy immediately.

---

## 🔥 Option 2: Manual SSH Cleanup

**What it does:**
- Connect to EC2 via SSH
- Manually remove specific files/services
- Full control over what gets deleted

**When to use:**
- You want to inspect what's installed first
- You want to remove only specific components
- You want to troubleshoot issues

**How to run:**
```powershell
# Connect to EC2
ssh -i ~/.ssh/aws-eb ec2-user@44.200.182.180

# Then run commands manually:
sudo systemctl stop patabima
sudo systemctl disable patabima
sudo rm /etc/systemd/system/patabima.service
sudo systemctl daemon-reload

sudo rm /etc/nginx/conf.d/patabima.conf
sudo systemctl restart nginx

sudo rm -rf /var/www/patabima
```

**Result:** You control exactly what gets removed.

---

## ⚠️ Option 3: Terminate EC2 Instance (Nuclear Option)

**What it does:**
- **PERMANENTLY DELETES** the entire EC2 instance
- All data on the instance is LOST
- You get a new public IP when you recreate

**When to use:**
- The instance is completely broken
- You want to start from absolute zero
- You want to change instance type/configuration

**How to run:**
```powershell
.\deployment\terminate-ec2.ps1
```

**WARNING:** This requires **3 confirmations** and CANNOT be undone!

**What's preserved:**
- ✅ RDS Database (all your data is safe)
- ✅ S3 buckets and files
- ✅ IAM roles and security groups
- ✅ SSH key pair

**What's lost:**
- ❌ The EC2 instance itself
- ❌ Public IP address (you'll get a new one)
- ❌ All installed software
- ❌ All configuration files

---

## Quick Decision Guide

| Situation | Recommended Option |
|-----------|-------------------|
| "I want to redeploy cleanly" | **Option 1** (Clean Rollback) |
| "I need to debug what's wrong" | **Option 2** (Manual SSH) |
| "Instance is completely broken" | **Option 3** (Terminate) |
| "I want to change instance size" | **Option 3** (Terminate) |
| "App is running but I want fresh code" | **Option 1** (Clean Rollback) |

---

## After Rollback - Redeployment

### If you used Option 1 (Clean Rollback):
```powershell
# Instance is ready, just redeploy
.\deployment\complete_ec2_deployment.ps1
```

### If you used Option 2 (Manual SSH):
```powershell
# Finish cleanup, then redeploy
.\deployment\complete_ec2_deployment.ps1
```

### If you used Option 3 (Terminate):
```powershell
# Create new EC2 instance first
.\deployment\create-fresh-ec2.ps1

# Then deploy
.\deployment\complete_ec2_deployment.ps1
```

---

## Current EC2 Status

**Instance ID:** `i-0d0f116005d812275`  
**Public IP:** `44.200.182.180`  
**Status:** Running  
**Name:** `patabima--agency`

**Current deployment:**
- Django API is **LIVE** at: http://44.200.182.180
- Health check: http://44.200.182.180/api/v1/health/
- Nginx: Running
- Gunicorn: Running

---

## Need Help?

Check current deployment status:
```powershell
curl http://44.200.182.180/api/v1/health/
```

SSH into the instance:
```powershell
ssh -i ~/.ssh/aws-eb ec2-user@44.200.182.180
```

Check what's running:
```bash
sudo systemctl status patabima
sudo systemctl status nginx
```

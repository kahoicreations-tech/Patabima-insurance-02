# PataBima EC2 Management Scripts

## 🔌 Connect to EC2 Instance

### Using AWS Session Manager (Recommended - No SSH Keys)

```powershell
# From your local PowerShell terminal
.\scripts\connect-ec2.ps1
```

This script will:
1. ✅ Check if AWS CLI is installed
2. ✅ Check if Session Manager plugin is installed (auto-installs if missing)
3. ✅ Verify AWS credentials
4. ✅ Find your PataBima EC2 instance
5. ✅ Connect directly to the instance

**No SSH keys required!** Uses your AWS IAM credentials.

---

## 📋 Prerequisites

### 1. Install AWS CLI

```powershell
# Using winget (Windows Package Manager)
winget install Amazon.AWSCLI

# Or download from: https://aws.amazon.com/cli/
```

### 2. Configure AWS Credentials

```powershell
aws configure
```

Enter your AWS credentials:
- AWS Access Key ID: `YOUR_ACCESS_KEY`
- AWS Secret Access Key: `YOUR_SECRET_KEY`
- Default region: `us-east-1`
- Default output format: `json`

### 3. Session Manager Plugin

The `connect-ec2.ps1` script will auto-install this for you, but you can manually install:

**Download:** https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html

Or the script will download it automatically from:
```
https://s3.amazonaws.com/session-manager-downloads/plugin/latest/windows/SessionManagerPluginSetup.exe
```

---

## 🚀 Quick Start

### First Time Setup

1. **Install AWS CLI:**
   ```powershell
   winget install Amazon.AWSCLI
   ```

2. **Configure credentials:**
   ```powershell
   aws configure
   ```

3. **Connect to EC2:**
   ```powershell
   .\scripts\connect-ec2.ps1
   ```

---

## 🔄 Deploy Updates to EC2

### Method 1: Using the Connection Script + Manual Commands

```powershell
# Step 1: Connect to EC2
.\scripts\connect-ec2.ps1

# Step 2: Once connected, run deployment commands
cd /var/www/patabima
source venv/bin/activate
git pull origin main
pip install -r requirements.txt --upgrade
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart patabima nginx
```

### Method 2: Using GitHub Actions (Automated)

Just push to `main` branch:
```powershell
git add .
git commit -m "Update backend"
git push origin main
```

GitHub Actions will automatically deploy to EC2!

---

## 🛠️ Common Commands

### Check Service Status

```bash
# After connecting via .\scripts\connect-ec2.ps1
sudo systemctl status patabima
sudo systemctl status nginx
```

### View Logs

```bash
# Gunicorn logs
sudo journalctl -u patabima -n 50 --no-pager

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Nginx access logs
sudo tail -f /var/log/nginx/access.log
```

### Restart Services

```bash
sudo systemctl restart patabima
sudo systemctl restart nginx
```

### Update Application

```bash
cd /var/www/patabima
source venv/bin/activate
git pull origin main
pip install -r requirements.txt --upgrade
python manage.py migrate
sudo systemctl restart patabima
```

---

## 🔍 Troubleshooting

### "Session Manager plugin not found"

The script will auto-install it. If it fails:
1. Download manually: https://s3.amazonaws.com/session-manager-downloads/plugin/latest/windows/SessionManagerPluginSetup.exe
2. Run the installer
3. Restart PowerShell
4. Run `.\scripts\connect-ec2.ps1` again

### "AWS credentials not configured"

Run:
```powershell
aws configure
```

### "Instance not registered with SSM"

The EC2 instance needs SSM agent running. Connect via AWS Console and run:
```bash
sudo systemctl start amazon-ssm-agent
sudo systemctl enable amazon-ssm-agent
```

### "No running instance found"

Make sure your EC2 instance:
1. Is running (not stopped)
2. Has the tag: `Name=PataBima-Production`
3. Is in the `us-east-1` region

Check instances:
```powershell
aws ec2 describe-instances --query 'Reservations[].Instances[].[InstanceId,State.Name,Tags[?Key==`Name`].Value|[0]]' --output table
```

---

## 📝 EC2 Instance Requirements

Your EC2 instance must have:

1. **IAM Role** with these policies:
   - `AmazonSSMManagedInstanceCore`
   - `AmazonS3ReadOnlyAccess`

2. **Security Group** allowing:
   - Port 80 (HTTP)
   - Port 443 (HTTPS)
   - Port 22 (SSH - optional)

3. **SSM Agent** installed and running:
   ```bash
   sudo systemctl status amazon-ssm-agent
   ```

4. **Tag:** `Name=PataBima-Production`

---

## 🎯 Quick Reference

```powershell
# Connect to EC2
.\scripts\connect-ec2.ps1

# Once connected to EC2:
cd /var/www/patabima                    # Go to app directory
source venv/bin/activate                # Activate Python environment
git pull origin main                    # Get latest code
pip install -r requirements.txt         # Update dependencies
python manage.py migrate                # Run migrations
sudo systemctl restart patabima nginx   # Restart services
sudo journalctl -u patabima -f          # View live logs
exit                                    # Disconnect
```

---

## ⚡ Pro Tips

1. **Auto-deployment:** Push to GitHub and let Actions handle it
2. **Keep terminal open:** Session Manager stays connected even if you lose internet briefly
3. **Multiple sessions:** You can have multiple PowerShell windows connected simultaneously
4. **No SSH keys:** Session Manager uses IAM, no `.pem` files to manage!

---

**Need help?** Run `.\scripts\connect-ec2.ps1` and it will guide you through setup! 🚀

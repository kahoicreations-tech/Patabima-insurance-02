# PataBima EC2 Deployment Guide

## Instance Information

- **Instance ID**: i-07a424fd876416ad0
- **Public IP**: 44.210.245.82
- **Key Pair**: aws-eb
- **Security Group**: sg-029645a9f7a7907c3

## Prerequisites

1. Download the `aws-eb.pem` private key file from AWS Console:

   - Go to EC2 Console > Key Pairs
   - If you don't have the file, you'll need to create a new key pair or use CloudShell

2. Save the key to: `C:\Users\USER\.ssh\aws-eb.pem`

3. Set proper permissions (in PowerShell as Administrator):
   ```powershell
   icacls C:\Users\USER\.ssh\aws-eb.pem /inheritance:r /grant:r "$($env:USERNAME):R"
   ```

## Deployment Steps

### Step 1: Upload files to EC2

Using PowerShell (requires `ssh` and `scp` commands):

```powershell
# Set variables
$KEY = "C:\Users\USER\.ssh\aws-eb.pem"
$SERVER = "ec2-user@44.210.245.82"

# Upload setup script
scp -i $KEY deployment/ec2_setup.sh ${SERVER}:/tmp/

# SSH and run setup
ssh -i $KEY $SERVER "chmod +x /tmp/ec2_setup.sh && /tmp/ec2_setup.sh"

# Upload application code
scp -i $KEY deployment/patabima-backend.zip ${SERVER}:/tmp/

# Upload configuration files
scp -i $KEY deployment/systemd/patabima.service ${SERVER}:/tmp/
scp -i $KEY deployment/nginx/patabima.conf ${SERVER}:/tmp/

# Upload deployment script
scp -i $KEY deployment/deploy_to_ec2.sh ${SERVER}:/tmp/

# Extract and deploy
ssh -i $KEY $SERVER "cd /var/www/patabima && unzip -o /tmp/patabima-backend.zip && chmod +x /tmp/deploy_to_ec2.sh && /tmp/deploy_to_ec2.sh"
```

### Step 2: Verify Deployment

```powershell
# Check if application is running
curl http://44.210.245.82

# SSH into the server to check logs
ssh -i $KEY $SERVER
```

Once connected, run:

```bash
# Check Gunicorn status
sudo systemctl status patabima

# Check Nginx status
sudo systemctl status nginx

# View application logs
tail -f /var/www/patabima/logs/error.log

# View Gunicorn logs
sudo journalctl -u patabima -f

# Test Django
cd /var/www/patabima
source venv/bin/activate
python manage.py check
```

### Step 3: Test Endpoints

```powershell
# Test root endpoint
curl http://44.210.245.82/

# Test API endpoints
curl http://44.210.245.82/api/motor2/categories/
```

## Alternative: Using CloudShell (No SSH key needed)

If you don't have the private key, use AWS CloudShell:

1. Open CloudShell in AWS Console
2. Upload files using CloudShell's upload feature
3. Use AWS Systems Manager Session Manager:

```bash
aws ssm start-session --target i-07a424fd876416ad0
```

## Troubleshooting

### If deployment fails:

1. Check logs:

   ```bash
   sudo journalctl -u patabima -n 50
   sudo tail -f /var/log/nginx/patabima-error.log
   ```

2. Restart services:

   ```bash
   sudo systemctl restart patabima
   sudo systemctl restart nginx
   ```

3. Check database connectivity:
   ```bash
   cd /var/www/patabima
   source venv/bin/activate
   python manage.py dbshell
   ```

### Common Issues:

- **Port 80 blocked**: Check security group allows inbound HTTP
- **Database connection failed**: Verify RDS security group allows EC2 connection
- **Static files not loading**: Run `python manage.py collectstatic` again
- **Gunicorn won't start**: Check environment variables in `/etc/systemd/system/patabima.service`

## Next Steps After Deployment:

1. ✅ Configure DNS (api.patabima.co.ke → 44.210.245.82)
2. ✅ Install SSL certificate (Let's Encrypt)
3. ✅ Set up CloudWatch monitoring
4. ✅ Configure automatic backups
5. ✅ Set up CI/CD pipeline

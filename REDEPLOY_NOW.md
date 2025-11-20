# PataBima Backend Redeployment - EXACT STEPS

## What You Need to Do RIGHT NOW:

### Step 1: Upload Backend ZIP to S3
```powershell
aws s3 cp patabima-backend.zip s3://patabima-media-prod/deployment/patabima-backend.zip
```

### Step 2: Open AWS CloudShell
1. Go to AWS Console
2. Click CloudShell icon (top right)
3. Wait for it to load

### Step 3: Run This ONE Command in CloudShell
```bash
curl -o deploy.sh https://raw.githubusercontent.com/kahoicreations-tech/Patabima-insurance-02/main/scripts/cloudshell-deploy.sh && chmod +x deploy.sh && ./deploy.sh
```

**OR** if that doesn't work, copy-paste this entire block:

```bash
#!/bin/bash
INSTANCE_ID="i-07a424fd876416ad0"
S3_BUCKET="patabima-media-prod"

echo "🚀 Deploying PataBima Backend..."

COMMAND_ID=$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --timeout-seconds 600 \
  --parameters 'commands=[
    "cd /tmp",
    "aws s3 cp s3://patabima-media-prod/deployment/patabima-backend.zip ./patabima-backend.zip",
    "sudo systemctl stop patabima",
    "sudo rm -rf /var/www/patabima/insurance-app",
    "sudo mkdir -p /var/www/patabima/insurance-app",
    "sudo unzip -q patabima-backend.zip -d /var/www/patabima/insurance-app",
    "sudo chown -R ec2-user:ec2-user /var/www/patabima/insurance-app",
    "cd /var/www/patabima",
    "source venv/bin/activate",
    "pip install -q -r insurance-app/requirements.txt",
    "cd insurance-app",
    "python manage.py migrate --noinput",
    "python manage.py collectstatic --noinput --clear",
    "sudo systemctl start patabima",
    "sudo systemctl restart nginx",
    "echo DEPLOYMENT COMPLETE"
  ]' \
  --output text --query "Command.CommandId")

echo "Waiting for deployment..."
aws ssm wait command-executed --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID"

echo "✅ DONE! Check: http://44.210.245.82"
```

---

## That's It. 3 Steps Total.

1. Upload ZIP to S3
2. Open CloudShell  
3. Run the command

**Time: 2-3 minutes total**

Your app will be live at: **http://44.210.245.82**

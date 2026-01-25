#!/bin/bash
# PataBima Campaign Admin Fix - Deployment Script
# Date: 2025-11-23 11:35:48

INSTANCE_ID="i-0d0f116005d812275"
S3_FILE="s3://patabima-media-prod/deployment/campaign-admin-fix-20251123-113003.zip"

echo "🚀 Deploying campaign_admin.py fix to PataBima..."

COMMAND_ID=$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --timeout-seconds 300 \
  --parameters 'commands=[
    "cd /tmp",
    "aws s3 cp '' ./campaign-admin-fix.zip --region us-east-1",
    "unzip -o campaign-admin-fix.zip",
    "sudo cp /var/www/patabima/insurance-app/app/campaign_admin.py /var/www/patabima/insurance-app/app/campaign_admin.py.backup",
    "sudo cp /tmp/app/campaign_admin.py /var/www/patabima/insurance-app/app/campaign_admin.py",
    "sudo chown ec2-user:ec2-user /var/www/patabima/insurance-app/app/campaign_admin.py",
    "sudo systemctl restart patabima",
    "sleep 3",
    "sudo systemctl status patabima --no-pager | head -n 10",
    "echo ✅ DEPLOYMENT COMPLETE - campaign_admin.py updated"
  ]' \
  --output text --query "Command.CommandId")

echo "📦 Command ID: $COMMAND_ID"
echo "⏳ Waiting for deployment to complete..."

aws ssm wait command-executed --command-id "$COMMAND_ID" --instance-id "$INSTANCE_ID"

echo ""
echo "📋 Deployment Output:"
aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" \
  --output text --query "StandardOutputContent"

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "🌐 Test at: https://api.hugo-shopping.com/admin/app/campaign/add/"

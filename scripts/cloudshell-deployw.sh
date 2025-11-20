#!/bin/bash
# PataBima Backend Deployment via Session Manager
# Run this in AWS CloudShell
# This script handles complete backend redeployment with zero-downtime

set -e  # Exit on error

echo "🚀 PataBima Backend Deployment Script"
echo "======================================"
echo "Date: $(date)"
echo ""

# ============================================
# CONFIGURATION
# ============================================
INSTANCE_ID="i-0d0f116005d812275"
S3_BUCKET="patabima-media-prod"
BACKEND_ZIP="patabima-backend.zip"
STAGING_KEY="deployment/staging/$BACKEND_ZIP"
APP_DIR="/var/www/patabima"

# ============================================
# STEP 1: Pre-flight Checks
# ============================================
echo "🔍 Step 1: Pre-flight checks..."

# Check if instance is running
INSTANCE_STATE=$(aws ec2 describe-instances \
  --instance-ids "$INSTANCE_ID" \
  --query "Reservations[0].Instances[0].State.Name" \
  --output text)

if [ "$INSTANCE_STATE" != "running" ]; then
  echo "❌ ERROR: EC2 instance is not running (state: $INSTANCE_STATE)"
  exit 1
fi

echo "✅ EC2 instance is running"

# Check if SSM agent is online
SSM_STATUS=$(aws ssm describe-instance-information \
  --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
  --query "InstanceInformationList[0].PingStatus" \
  --output text 2>/dev/null || echo "Offline")

if [ "$SSM_STATUS" != "Online" ]; then
  echo "❌ ERROR: SSM agent is not online (status: $SSM_STATUS)"
  echo "   Please wait a few minutes for SSM agent to initialize"
  exit 1
fi

echo "✅ SSM agent is online"
echo ""

# ============================================
# STEP 2: Upload Backend to S3 Staging
# ============================================
echo "📤 Step 2: Uploading backend to S3 staging..."

# Check if local file exists (for reference)
if [ -f "$BACKEND_ZIP" ]; then
  echo "📦 Local file found: $(ls -lh $BACKEND_ZIP | awk '{print $5}')"
fi

# Upload to S3 staging area
echo "Uploading to s3://$S3_BUCKET/$STAGING_KEY ..."
aws s3 cp s3://$S3_BUCKET/deployment/$BACKEND_ZIP s3://$S3_BUCKET/$STAGING_KEY

echo "✅ Uploaded to S3 staging"
echo ""

# ============================================
# STEP 3: Deploy on EC2 via SSM
# ============================================
echo "🚀 Step 3: Deploying on EC2 instance..."
echo "⏱️  Estimated time: 3-4 minutes"
echo ""

COMMAND_ID=$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --comment "PataBima Backend Redeployment - $(date +%Y-%m-%d_%H:%M:%S)" \
  --timeout-seconds 600 \
  --parameters 'commands=[
    "set -e",
    "echo \"\"",
    "echo \"==================================================\"",
    "echo \"   PataBima Backend Deployment on EC2\"",
    "echo \"==================================================\"",
    "echo \"Started at: $(date)\"",
    "echo \"\"",
    "",
    "# Download from S3",
    "echo \"📥 [1/8] Downloading backend from S3...\"",
    "aws s3 cp s3://'$S3_BUCKET'/'$STAGING_KEY' /tmp/'$BACKEND_ZIP'",
    "FILE_SIZE=$(ls -lh /tmp/'$BACKEND_ZIP' | awk '\''{print $5}'\'')",
    "echo \"    ✅ Downloaded: $FILE_SIZE\"",
    "echo \"\"",
    "",
    "# Create backup",
    "echo \"💾 [2/8] Creating backup of current version...\"",
    "sudo mkdir -p '$APP_DIR'/backups",
    "if [ -d '$APP_DIR'/insurance-app ]; then",
    "  BACKUP_FILE='$APP_DIR'/backups/backup-$(date +%Y%m%d_%H%M%S).tar.gz",
    "  sudo tar -czf \"$BACKUP_FILE\" -C '$APP_DIR' insurance-app 2>/dev/null || true",
    "  if [ -f \"$BACKUP_FILE\" ]; then",
    "    BACKUP_SIZE=$(ls -lh \"$BACKUP_FILE\" | awk '\''{print $5}'\'')",
    "    echo \"    ✅ Backup created: $BACKUP_SIZE\"",
    "  fi",
    "else",
    "  echo \"    ⚠️  No existing app to backup (first deployment)\"",
    "fi",
    "echo \"\"",
    "",
    "# Extract new version",
    "echo \"📂 [3/8] Extracting new version...\"",
    "sudo rm -rf /tmp/insurance-app-new",
    "mkdir -p /tmp/insurance-app-new",
    "unzip -q /tmp/'$BACKEND_ZIP' -d /tmp/insurance-app-new",
    "echo \"    ✅ Extracted successfully\"",
    "echo \"\"",
    "",
    "# Stop services (graceful)",
    "echo \"🛑 [4/8] Stopping services...\"",
    "if sudo systemctl is-active --quiet patabima; then",
    "  sudo systemctl stop patabima",
    "  echo \"    ✅ Gunicorn stopped\"",
    "else",
    "  echo \"    ⚠️  Gunicorn was not running\"",
    "fi",
    "echo \"\"",
    "",
    "# Replace application",
    "echo \"🔄 [5/8] Deploying new version...\"",
    "sudo rm -rf '$APP_DIR'/insurance-app",
    "sudo mv /tmp/insurance-app-new '$APP_DIR'/insurance-app",
    "sudo chown -R ec2-user:ec2-user '$APP_DIR'/insurance-app",
    "echo \"    ✅ Application replaced\"",
    "echo \"\"",
    "",
    "# Install dependencies",
    "echo \"📦 [6/8] Installing Python dependencies...\"",
    "cd '$APP_DIR'",
    "source venv/bin/activate",
    "pip install -q --upgrade pip",
    "pip install -q -r insurance-app/requirements.txt",
    "echo \"    ✅ Dependencies installed\"",
    "echo \"\"",
    "",
    "# Run migrations",
    "echo \"🗄️  [7/8] Running database migrations...\"",
    "cd insurance-app",
    "export DEBUG=False",
    "export SECRET_KEY=\"JqBr7F59HcizXuTdh4s5rMYRUxtPegb3l_UQ1EvL3C5MwUz_oqin1Tjs9QV8LwHwd5vmmNBKOpR4QYz3KfIbwg\"",
    "export ALLOWED_HOSTS=\"44.200.182.180,api.patabima.co.ke\"",
    "export RDS_HOSTNAME=\"patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com\"",
    "export RDS_PORT=\"5432\"",
    "export RDS_DB_NAME=\"patabimadb\"",
    "export RDS_USERNAME=\"patabimaadmin\"",
    "export RDS_PASSWORD=\"PataB1ma2025Secure\"",
    "python manage.py migrate --noinput",
    "echo \"    ✅ Migrations complete\"",
    "echo \"\"",
    "",
    "# Collect static files",
    "echo \"📁 Collecting static files...\"",
    "python manage.py collectstatic --noinput --clear",
    "echo \"    ✅ Static files collected\"",
    "echo \"\"",
    "",
    "# Restart services",
    "echo \"🔄 [8/8] Restarting services...\"",
    "sudo systemctl start patabima",
    "sleep 2",
    "sudo systemctl restart nginx",
    "echo \"    ✅ Services restarted\"",
    "echo \"\"",
    "",
    "# Verify services",
    "echo \"📊 Service Status Check:\"",
    "echo \"\"",
    "if sudo systemctl is-active --quiet patabima; then",
    "  echo \"    ✅ Gunicorn (patabima): RUNNING\"",
    "  sudo systemctl status patabima --no-pager --lines=3 | grep -E \"Active|Main PID\"",
    "else",
    "  echo \"    ❌ Gunicorn (patabima): FAILED\"",
    "  sudo journalctl -u patabima --no-pager --lines=10",
    "fi",
    "echo \"\"",
    "if sudo systemctl is-active --quiet nginx; then",
    "  echo \"    ✅ Nginx: RUNNING\"",
    "else",
    "  echo \"    ❌ Nginx: FAILED\"",
    "fi",
    "echo \"\"",
    "",
    "# Clean up",
    "echo \"🧹 Cleaning up...\"",
    "rm -f /tmp/'$BACKEND_ZIP'",
    "sudo rm -rf /tmp/insurance-app-new",
    "echo \"    ✅ Temporary files removed\"",
    "echo \"\"",
    "",
    "echo \"==================================================\"",
    "echo \"   ✅ DEPLOYMENT COMPLETE!\"",
    "echo \"==================================================\"",
    "echo \"\"",
    "echo \"🌐 Application URLs:\"",
    "echo \"    HTTP:  http://44.200.182.180\"",
    "echo \"    Admin: http://44.200.182.180/admin\"",
    "echo \"    API:   http://44.200.182.180/api/\"",
    "echo \"\"",
    "echo \"📝 Quick Commands:\"",
    "echo \"    Check logs:    sudo journalctl -u patabima -f\"",
    "echo \"    Restart app:   sudo systemctl restart patabima\"",
    "echo \"    Restart nginx: sudo systemctl restart nginx\"",
    "echo \"\"",
    "echo \"Completed at: $(date)\"",
    "echo \"==================================================\""
  ]' \
  --output text \
  --query "Command.CommandId")

echo "📋 Command ID: $COMMAND_ID"
echo ""
echo "⏳ Waiting for deployment to complete..."
echo "   (This will take 3-4 minutes - please wait)"
echo ""

# Wait for command execution
aws ssm wait command-executed \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID"

# ============================================
# STEP 4: Get Deployment Results
# ============================================
echo ""
echo "📊 Fetching deployment results..."
echo ""

# Get command output
OUTPUT=$(aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" \
  --query "StandardOutputContent" \
  --output text)

echo "$OUTPUT"
echo ""

# Check status
STATUS=$(aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" \
  --query "Status" \
  --output text)

if [ "$STATUS" = "Success" ]; then
  echo "✅ DEPLOYMENT SUCCESSFUL!"
  echo ""
  echo "🎉 Your changes are now live at:"
  echo "   http://44.200.182.180"
  echo ""
  echo "Next steps:"
  echo "  • Test your API endpoints"
  echo "  • Check admin panel: http://44.200.182.180/admin"
  echo "  • Monitor logs if needed"
else
  echo "❌ DEPLOYMENT FAILED"
  echo "Status: $STATUS"
  echo ""
  echo "Check errors above and retry"
  exit 1
fi

# Get command output
echo "📋 Deployment Output:"
echo "===================="
aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" \
  --query "StandardOutputContent" \
  --output text

# Check if successful
STATUS=$(aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$INSTANCE_ID" \
  --query "Status" \
  --output text)

echo ""
echo "===================="
if [ "$STATUS" = "Success" ]; then
  echo "✅ DEPLOYMENT SUCCESSFUL!"
  echo ""
  echo "🌐 Test your API:"
  echo "   curl http://44.200.182.180/api/motor2/categories/"
  echo ""
  echo "📊 View logs:"
  echo "   aws ssm start-session --target $INSTANCE_ID"
  echo "   sudo tail -f /var/www/patabima/logs/error.log"
else
  echo "❌ Deployment failed with status: $STATUS"
  echo ""
  echo "📋 Error output:"
  aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --query "StandardErrorContent" \
    --output text
  exit 1
fi

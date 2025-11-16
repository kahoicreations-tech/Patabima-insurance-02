#!/bin/bash

# ============================================
# PataBima Backend Redeployment Script
# ============================================
# This script redeploys the insurance-app backend to EC2
# with all motor2 endpoints and database seeding

set -e  # Exit on any error

# Configuration
EC2_HOST="ec2-34-203-241-81.compute-1.amazonaws.com"
EC2_USER="ubuntu"
EC2_KEY_PATH="$HOME/.ssh/patabima-key.pem"  # Update this path
REMOTE_APP_PATH="/home/ubuntu/insurance-app"
LOCAL_APP_PATH="./insurance-app"

echo "================================================"
echo "PataBima Backend Redeployment to EC2"
echo "================================================"
echo ""

# Step 1: Test SSH Connection
echo "Step 1/8: Testing SSH connection to EC2..."
ssh -i "$EC2_KEY_PATH" -o ConnectTimeout=10 "$EC2_USER@$EC2_HOST" "echo 'SSH connection successful'" || {
    echo "❌ Error: Cannot connect to EC2. Please check:"
    echo "   - EC2 instance is running"
    echo "   - SSH key path is correct: $EC2_KEY_PATH"
    echo "   - Security group allows SSH from your IP"
    exit 1
}
echo "✅ SSH connection verified"
echo ""

# Step 2: Backup existing deployment
echo "Step 2/8: Creating backup of existing deployment..."
ssh -i "$EC2_KEY_PATH" "$EC2_USER@$EC2_HOST" << 'BACKUP'
    if [ -d "/home/ubuntu/insurance-app" ]; then
        BACKUP_DIR="/home/ubuntu/insurance-app-backup-$(date +%Y%m%d-%H%M%S)"
        echo "Creating backup at: $BACKUP_DIR"
        cp -r /home/ubuntu/insurance-app "$BACKUP_DIR"
        echo "✅ Backup created successfully"
    else
        echo "⚠️  No existing deployment found, skipping backup"
    fi
BACKUP
echo ""

# Step 3: Sync application files
echo "Step 3/8: Syncing application files to EC2..."
rsync -avz --progress \
    --exclude='*.pyc' \
    --exclude='__pycache__' \
    --exclude='.git' \
    --exclude='venv' \
    --exclude='env' \
    --exclude='.env' \
    --exclude='*.sqlite3' \
    --exclude='media/' \
    --exclude='staticfiles/' \
    -e "ssh -i $EC2_KEY_PATH" \
    "$LOCAL_APP_PATH/" \
    "$EC2_USER@$EC2_HOST:$REMOTE_APP_PATH/"
echo "✅ Files synced successfully"
echo ""

# Step 4: Install/Update dependencies
echo "Step 4/8: Installing Python dependencies..."
ssh -i "$EC2_KEY_PATH" "$EC2_USER@$EC2_HOST" << 'DEPENDENCIES'
    cd /home/ubuntu/insurance-app
    
    # Activate virtual environment or create if doesn't exist
    if [ ! -d "venv" ]; then
        echo "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install dependencies
    pip install -r requirements.txt
    
    echo "✅ Dependencies installed"
DEPENDENCIES
echo ""

# Step 5: Run database migrations
echo "Step 5/8: Running database migrations..."
ssh -i "$EC2_KEY_PATH" "$EC2_USER@$EC2_HOST" << 'MIGRATIONS'
    cd /home/ubuntu/insurance-app
    source venv/bin/activate
    
    # Run migrations
    python manage.py migrate --noinput
    
    echo "✅ Migrations completed"
MIGRATIONS
echo ""

# Step 6: Collect static files
echo "Step 6/8: Collecting static files..."
ssh -i "$EC2_KEY_PATH" "$EC2_USER@$EC2_HOST" << 'STATIC'
    cd /home/ubuntu/insurance-app
    source venv/bin/activate
    
    # Collect static files
    python manage.py collectstatic --noinput
    
    echo "✅ Static files collected"
STATIC
echo ""

# Step 7: Seed database with motor data
echo "Step 7/8: Seeding database with motor2 data..."
ssh -i "$EC2_KEY_PATH" "$EC2_USER@$EC2_HOST" << 'SEEDING'
    cd /home/ubuntu/insurance-app
    source venv/bin/activate
    
    # Check if seed scripts exist and run them
    echo "Seeding motor categories..."
    python manage.py seed_motor_categories || echo "⚠️  seed_motor_categories command not found"
    
    echo "Seeding motor pricing..."
    python manage.py seed_motor_pricing || echo "⚠️  seed_motor_pricing command not found"
    
    echo "Seeding underwriters..."
    python manage.py seed_underwriters || echo "⚠️  seed_underwriters command not found"
    
    echo "✅ Database seeding attempted"
SEEDING
echo ""

# Step 8: Restart Django application
echo "Step 8/8: Restarting Django application..."
ssh -i "$EC2_KEY_PATH" "$EC2_USER@$EC2_HOST" << 'RESTART'
    cd /home/ubuntu/insurance-app
    
    # Try different restart methods based on what's running
    if sudo systemctl list-units --type=service | grep -q gunicorn; then
        echo "Restarting gunicorn service..."
        sudo systemctl restart gunicorn
        sudo systemctl status gunicorn --no-pager
    elif sudo systemctl list-units --type=service | grep -q django; then
        echo "Restarting django service..."
        sudo systemctl restart django
        sudo systemctl status django --no-pager
    elif command -v pm2 &> /dev/null; then
        echo "Restarting with pm2..."
        pm2 restart django || pm2 restart all
        pm2 status
    elif pgrep -f "manage.py runserver" > /dev/null; then
        echo "Stopping existing Django dev server..."
        pkill -f "manage.py runserver"
        sleep 2
        echo "Starting Django dev server..."
        cd /home/ubuntu/insurance-app
        source venv/bin/activate
        nohup python manage.py runserver 0.0.0.0:8000 > /home/ubuntu/django.log 2>&1 &
        echo "Django dev server started"
    else
        echo "⚠️  Could not detect running service. Please start Django manually:"
        echo "   cd /home/ubuntu/insurance-app"
        echo "   source venv/bin/activate"
        echo "   python manage.py runserver 0.0.0.0:8000"
    fi
    
    echo "✅ Application restart attempted"
RESTART
echo ""

# Step 9: Verify deployment
echo "================================================"
echo "Verifying deployment..."
echo "================================================"
sleep 3

echo ""
echo "Testing health endpoint..."
curl -s -X GET "http://$EC2_HOST:8000/api/v1/health/" | python3 -m json.tool || echo "⚠️  Health check failed"

echo ""
echo "Testing motor2 categories endpoint..."
curl -s -X GET "http://$EC2_HOST:8000/api/v1/motor2/categories/" | python3 -m json.tool || echo "⚠️  Motor2 categories endpoint failed"

echo ""
echo "Testing underwriters endpoint..."
curl -s -X GET "http://$EC2_HOST:8000/api/v1/public_app/insurance/get_underwriters/" | python3 -m json.tool || echo "⚠️  Underwriters endpoint failed"

echo ""
echo "================================================"
echo "✅ Redeployment Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Test login from mobile app"
echo "2. Create test user if needed:"
echo "   ssh -i $EC2_KEY_PATH $EC2_USER@$EC2_HOST"
echo "   cd /home/ubuntu/insurance-app"
echo "   source venv/bin/activate"
echo "   python manage.py createsuperuser"
echo ""
echo "3. Monitor logs:"
echo "   ssh -i $EC2_KEY_PATH $EC2_USER@$EC2_HOST"
echo "   tail -f /home/ubuntu/django.log"
echo "   # or"
echo "   sudo journalctl -u gunicorn -f"
echo ""
echo "Backend URL: http://$EC2_HOST:8000"
echo "================================================"

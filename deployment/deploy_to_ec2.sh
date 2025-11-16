#!/bin/bash
set -e

echo "=== PataBima Backend Complete Deployment ==="
echo "Starting at $(date)"

# Variables
APP_DIR="/var/www/patabima"
VENV_DIR="$APP_DIR/venv"

cd $APP_DIR

# Activate virtual environment
source $VENV_DIR/bin/activate

# Install Python requirements
echo "Installing Python requirements..."
pip install -r requirements.txt

# Create logs directory
mkdir -p logs

# Set environment variables
export DEBUG=False
export SECRET_KEY="JqBr7F59HcizXuTdh4s5rMYRUxtPegb3l_UQ1EvL3C5MwUz_oqin1Tjs9QV8LwHwd5vmmNBKOpR4QYz3KfIbwg"
export ALLOWED_HOSTS="44.210.245.82,api.patabima.co.ke"
export RDS_HOSTNAME="patabima-production-db.ca5qwoi4lxw.us-east-1.rds.amazonaws.com"
export RDS_PORT="5432"
export RDS_DB_NAME="patabimadb"
export RDS_USERNAME="patabimaadmin"
export RDS_PASSWORD="PataB1ma2025Secure"
export USE_S3_MEDIA="1"
export AWS_STORAGE_BUCKET_NAME="patabima-media-prod"
export AWS_S3_REGION_NAME="us-east-1"
export DMVIC_BASE_URL="https://uat-api.dmvic.com"
export DMVIC_MEMBER_CODE="PATABIMA"

# Test database connection
echo "Testing database connection..."
python manage.py check --database default

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser (if needed)
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@patabima.co.ke', 'Admin@2025')" | python manage.py shell

# Copy systemd service
echo "Setting up Gunicorn service..."
sudo cp /tmp/patabima.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable patabima
sudo systemctl start patabima
sudo systemctl status patabima

# Copy Nginx config
echo "Setting up Nginx..."
sudo cp /tmp/patabima.conf /etc/nginx/conf.d/
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
sudo systemctl status nginx

echo "=== Deployment Complete! ==="
echo "Application is now running at http://44.210.245.82"
echo ""
echo "To check logs:"
echo "  Application: tail -f $APP_DIR/logs/error.log"
echo "  Gunicorn: sudo journalctl -u patabima -f"
echo "  Nginx: sudo tail -f /var/log/nginx/patabima-error.log"
echo ""
echo "To restart:"
echo "  sudo systemctl restart patabima"
echo "  sudo systemctl restart nginx"
